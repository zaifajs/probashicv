import express from "express";
import { prisma } from "../lib/prisma.js";

export const publicRouter = express.Router();

publicRouter.get("/cv/:slug", async (req, res, next) => {
  try {
    const cv = await prisma.cv.findUnique({
      where: { slug: req.params.slug }
    });
    if (!cv || !cv.isPublic) {
      return res.status(404).json({ message: "Public CV not found." });
    }
    return res.json(cv);
  } catch (error) {
    return next(error);
  }
});
