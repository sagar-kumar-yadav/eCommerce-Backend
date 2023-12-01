import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import cors from "cors";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import multer from "multer";

// configure env
dotenv.config();

// database config
connectDB();

// rest object
const app = express();

const corsOptions = {
  origin: "*", // Replace '*' with your frontend URL for production
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization",
};

// middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, res, cb) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });

// rest api
app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

// PORT
const PORT = process.env.PORT || 8080;

// run listen
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`.bgCyan.white);
});
