// index.js (backend utama)
import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import CatatanRoute from "./Route/CatatanRoute.js";
import UserRoute from "./Route/Userroute.js";
import "./models/Usermodel.js"; // pastikan model di-import agar sequelize sync bisa jalan
import "./models/CatatanModel.js"; // jika kamu pakai juga

dotenv.config();

const app = express();

// CORS untuk frontend yang terpisah domain
app.use(cors({
  credentials: true,
  origin: 'https://fe-oscar-dot-f-07-450706.uc.r.appspot.com'
}));

app.use(cookieParser());
app.use(express.json());

// Routing
app.use(CatatanRoute);
app.use(UserRoute);

// (opsional) Melayani file statis jika frontend bareng
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
app.use(express.static(projectRoot));

app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));
