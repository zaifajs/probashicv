import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { makeCvSlug } from "../utils/slug.js";
import { getCvHtml } from "../utils/pdfTemplate.js";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });

export const cvRouter = express.Router();

function getSystemChromePath() {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  if (process.platform === "darwin") {
    const paths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  }
  if (process.platform === "linux") {
    const paths = [
      "/snap/bin/chromium",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome"
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

async function launchBrowser() {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--single-process"
  ];
  const chromePath = getSystemChromePath();
  const options = { headless: true, args };
  if (chromePath) {
    options.executablePath = chromePath;
  }
  return await puppeteer.launch(options);
}

async function renderCvPdf(res, cv) {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    const html = getCvHtml(cv);
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 10000
    });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${cv.slug || "cv"}.pdf"`);
    return res.send(pdfBuffer);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

cvRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const cvs = await prisma.cv.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: "desc" }
    });
    return res.json(cvs);
  } catch (error) {
    return next(error);
  }
});

cvRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, cvData, outputLanguage = "en", isPublic = false } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const nameHint = cvData?.personalInfo?.name || title;
    const slug = makeCvSlug(nameHint);
    const cv = await prisma.cv.create({
      data: {
        userId: req.user.userId,
        title,
        slug,
        cvData: cvData || {},
        outputLanguage,
        isPublic: Boolean(isPublic)
      }
    });

    return res.status(201).json(cv);
  } catch (error) {
    return next(error);
  }
});

cvRouter.post("/pdf/render", async (req, res, next) => {
  try {
    const { title = "CV", slug = "cv", outputLanguage = "en", cvData = {} } = req.body;
    return await renderCvPdf(res, {
      title,
      slug,
      outputLanguage,
      cvData
    });
  } catch (error) {
    console.error("[PDF render error]", error?.message || error);
    console.error(error?.stack);
    if (!res.headersSent) {
      return res.status(500).json({ message: "PDF generation failed.", error: error?.message });
    }
    next(error);
  }
});

cvRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cv = await prisma.cv.findFirst({
      where: { id, userId: req.user.userId }
    });
    if (!cv) {
      return res.status(404).json({ message: "CV not found." });
    }
    return res.json(cv);
  } catch (error) {
    return next(error);
  }
});

cvRouter.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.cv.findFirst({
      where: { id, userId: req.user.userId }
    });
    if (!existing) {
      return res.status(404).json({ message: "CV not found." });
    }

    const { title, cvData, outputLanguage, isPublic } = req.body;
    const updated = await prisma.cv.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        cvData: cvData ?? existing.cvData,
        outputLanguage: outputLanguage ?? existing.outputLanguage,
        isPublic: isPublic ?? existing.isPublic
      }
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

cvRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.cv.findFirst({
      where: { id, userId: req.user.userId }
    });
    if (!existing) {
      return res.status(404).json({ message: "CV not found." });
    }

    await prisma.cv.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

cvRouter.post("/:id/photo", requireAuth, upload.single("photo"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.cv.findFirst({
      where: { id, userId: req.user.userId }
    });
    if (!existing) {
      return res.status(404).json({ message: "CV not found." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo file is required." });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const cvData = existing.cvData || {};
    const updatedCvData = {
      ...cvData,
      personalInfo: {
        ...(cvData.personalInfo || {}),
        photo: photoUrl
      }
    };

    const updated = await prisma.cv.update({
      where: { id },
      data: { cvData: updatedCvData }
    });

    return res.json({ photoUrl, cv: updated });
  } catch (error) {
    return next(error);
  }
});

cvRouter.get("/:id/pdf", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cv = await prisma.cv.findFirst({
      where: { id, userId: req.user.userId }
    });
    if (!cv) {
      return res.status(404).json({ message: "CV not found." });
    }

    return await renderCvPdf(res, cv);
  } catch (error) {
    return next(error);
  }
});
