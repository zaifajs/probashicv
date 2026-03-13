import { api } from "./api";

export const aiService = {
  async generate(text, targetLanguage, contentType = "general") {
    const { data } = await api.post("/api/ai/generate", { text, targetLanguage, contentType });
    return data.generatedText;
  },
  async translateCv(cvData, targetLanguage) {
    const { data } = await api.post("/api/ai/translate-cv", { cvData, targetLanguage });
    return data.cvData;
  }
};
