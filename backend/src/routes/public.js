import express from "express";
import { prisma } from "../lib/prisma.js";

export const publicRouter = express.Router();

const SAFE_PERSONAL_INFO_FIELDS = new Set(["name", "jobTitle", "aboutMe", "photo", "address", "email", "phone"]);

function pickSafePersonalInfo(info = {}) {
  const safe = {};
  for (const key of SAFE_PERSONAL_INFO_FIELDS) {
    if (info[key] !== undefined && info[key] !== null) {
      safe[key] = info[key];
    }
  }
  return safe;
}

function sanitizePublicCv(cv) {
  const cloned = JSON.parse(JSON.stringify(cv));
  const data = cloned.cvData || {};
  return {
    id: cloned.id,
    slug: cloned.slug,
    title: cloned.title,
    outputLanguage: cloned.outputLanguage,
    updatedAt: cloned.updatedAt,
    cvData: {
      ...data,
      personalInfo: pickSafePersonalInfo(data.personalInfo),
      identityDocuments: []
    }
  };
}

publicRouter.get("/cv/:slug", async (req, res, next) => {
  try {
    const cv = await prisma.cv.findUnique({
      where: { slug: req.params.slug }
    });
    if (!cv || !cv.isPublic) {
      return res.status(404).json({ message: "Public CV not found." });
    }
    return res.json(sanitizePublicCv(cv));
  } catch (error) {
    return next(error);
  }
});
