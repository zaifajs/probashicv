import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/auth.js";
import { cvRouter } from "./routes/cv.js";
import { publicRouter } from "./routes/public.js";
import { aiRouter } from "./routes/ai.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/cv", cvRouter);
app.use("/api/public", publicRouter);
app.use("/api/ai", aiRouter);

app.use(errorHandler);

// In production, optionally serve frontend build (single-server deployment)
const isProduction = process.env.NODE_ENV === "production";
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
if (isProduction && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}
