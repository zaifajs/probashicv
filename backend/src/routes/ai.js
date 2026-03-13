import express from "express";
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openAiApiKey });
export const aiRouter = express.Router();
const SUPPORTED_LANGUAGES = new Set(["en", "bn", "pt"]);

function extractJsonObject(value) {
  if (typeof value !== "string") return null;
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return value.slice(start, end + 1);
}

/** Strip large binary/URL fields before sending to OpenAI to avoid token limits and errors */
function sanitizeCvDataForTranslation(cvData) {
  const out = JSON.parse(JSON.stringify(cvData));
  if (out.personalInfo && typeof out.personalInfo.photo === "string" && out.personalInfo.photo.length > 200) {
    out.personalInfo.photo = "[PHOTO]";
  }
  return out;
}

/** Restore photo from original cvData into translated result */
function restorePhoto(translated, original) {
  if (!original?.personalInfo?.photo) return translated;
  const photo = original.personalInfo.photo;
  if (!translated.personalInfo) translated.personalInfo = {};
  translated.personalInfo.photo = photo;
  return translated;
}

aiRouter.post("/generate", async (req, res, next) => {
  try {
    const { text, targetLanguage, contentType = "general" } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ message: "text and targetLanguage are required." });
    }

    if (!config.openAiApiKey) {
      return res.status(500).json({ message: "OpenAI API key is not configured." });
    }

    const systemPromptByType = {
      about_me:
        "You are an expert CV writer. Improve the user's profile summary into a polished, professional 'About Me' paragraph. expand the input text into at most 30 words. Be concise and impactful. Preserve factual meaning; do not invent employers or achievements. Translate to the requested language.",
      experience:
        "You are an expert CV writer. Rewrite work experience text professionally and clearly for Europass-style CV usage. Use concise bullet-like sentences when appropriate, and translate to the requested language.",
      general:
        "You are an expert CV writer. Rewrite text professionally and translate it to the requested language. Keep output concise and suitable for Europass-style CV bullets or short paragraphs."
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPromptByType[contentType] || systemPromptByType.general
        },
        {
          role: "user",
          content: `Target language: ${targetLanguage}\n\nInput text:\n${text}`
        }
      ],
      temperature: 0.7
    });

    const generatedText = completion.choices?.[0]?.message?.content?.trim() || "";
    return res.json({ generatedText });
  } catch (error) {
    return next(error);
  }
});

aiRouter.post("/translate-cv", async (req, res, next) => {
  try {
    const { cvData, targetLanguage } = req.body;
    if (!cvData || typeof cvData !== "object") {
      return res.status(400).json({ message: "cvData is required." });
    }
    if (!targetLanguage) {
      return res.status(400).json({ message: "targetLanguage is required." });
    }
    if (!SUPPORTED_LANGUAGES.has(targetLanguage)) {
      return res.status(400).json({ message: "Unsupported targetLanguage." });
    }
    if (targetLanguage === "en") {
      return res.json({ cvData });
    }
    if (!config.openAiApiKey) {
      return res.status(500).json({ message: "OpenAI API key is not configured." });
    }

    const payloadForApi = sanitizeCvDataForTranslation(cvData);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a professional CV translator. Translate all human-readable text values in the provided CV JSON to the requested language while preserving the exact JSON structure and keys. Keep email, phone numbers, URLs, and date-like values (e.g. YYYY-MM-DD) unchanged. Return only valid JSON with the same keys."
        },
        {
          role: "user",
          content: `Target language: ${targetLanguage}\n\nCV JSON:\n${JSON.stringify(payloadForApi)}`
        }
      ],
      temperature: 0.2
    });

    const content = completion.choices?.[0]?.message?.content;
    const rawJson = extractJsonObject(content);
    if (!rawJson) {
      return res.status(502).json({ message: "Could not parse translated CV response." });
    }

    let translatedCvData;
    try {
      translatedCvData = JSON.parse(rawJson);
    } catch (_parseError) {
      return res.status(502).json({ message: "Translated CV response was invalid JSON." });
    }

    const cvDataWithPhoto = restorePhoto(translatedCvData, cvData);
    return res.json({ cvData: cvDataWithPhoto });
  } catch (error) {
    if (error?.status === 429) {
      return res.status(429).json({ message: "OpenAI rate limit exceeded. Please try again in a moment." });
    }
    if (error?.status === 401) {
      return res.status(502).json({ message: "OpenAI API key is invalid." });
    }
    if (error?.message) {
      return res.status(502).json({ message: error.message });
    }
    return next(error);
  }
});
