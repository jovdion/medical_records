import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Import routing dan model
import CatatanRoute from "./Route/CatatanRoute.js";
import UserRoute from "./Route/Userroute.js";
import "./models/Usermodel.js";
import "./models/CatatanModel.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const allowedOrigin = 'https://fe-oscar-dot-f-07-450706.uc.r.appspot.com';

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.options("*", cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use(CatatanRoute);
app.use(UserRoute);

app.use(express.static(path.join(projectRoot, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}`);
});
