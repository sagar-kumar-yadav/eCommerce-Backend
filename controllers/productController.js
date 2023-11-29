import fs from "fs";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import { uploadOnCloudinary } from "../utils/cloudnary.js";

// create product -------- Admin------------------------
//  when you use formidable you req data from fields for non file
// if you have files to import then you have to use req.files
export const createProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.body;

    const photoLocalPath = req.files?.photos.map((file) => file.path);
    console.log(photoLocalPath);

    const folderName = "product_images";

    const photoUploadPromises = photoLocalPath.map(async (localPath) => {
      return await uploadOnCloudinary(localPath, folderName);
    });

    const uploadedPhotos = await Promise.all(photoUploadPromises);

    const photoURLs = uploadedPhotos.map((photo) => photo.url);

    const products = await productModel({
      ...req.body,
      slug: slugify(name),
      photos: photoURLs,
    });
    await products.save();

    res.status(201).send({
      success: true,
      message: "product created successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error in creating product",
      error,
    });
  }
};

// update product -------------- Admin -------------------------------------
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, photo, shipping } =
      req.body;

    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is required" });

      case !description:
        return res.status(500).send({ error: "description is required" });

      case !price:
        return res.status(500).send({ error: "price is required" });

      case !category:
        return res.status(500).send({ error: "category is required" });

      case !quantity:
        return res.status(500).send({ error: "quantity is required" });

      case !photo:
        return res.status(500).send({ error: "photo is required" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.body, slug: slugify(name) },
      { new: true }
    );
    await products.save();
    res.status(201).send({
      success: true,
      message: "product updated successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Update product",
    });
  }
};

// get all product -----------------------------------------------------------
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      message: "All products",
      totalCount: products.length,
      products,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "error in getting all products",
      error,
    });
  }
};

// get single product ----------------------------------------------------------
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single product fetched",
      product,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "error in getting single products",
      error,
    });
  }
};

// get product photo ----------------------------------------------------------------
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "error while getting photo",
      error,
    });
  }
};

// delete product ---------------------------------------------------------------
export const deleteProductController = async (req, res) => {
  try {
    const product = await productModel
      .findByIdAndDelete(req.params.pid)
      .select("-photo");
    res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "error while delete product",
      error,
    });
  }
};

// filters
export const productFilterController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while filtering product",
      error,
    });
  }
};

// product count controller
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in count product",
      error,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in  search product",
      error,
    });
  }
};

// similar products
export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in getting related product",
      error,
    });
  }
};

// get product by category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while getting product",
      error,
    });
  }
};
