import { api } from "./api";

export const cvService = {
  async list() {
    const { data } = await api.get("/api/cv");
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/api/cv", payload);
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/api/cv/${id}`);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/api/cv/${id}`, payload);
    return data;
  },
  async remove(id) {
    await api.delete(`/api/cv/${id}`);
  },
  async uploadPhoto(id, file) {
    const formData = new FormData();
    formData.append("photo", file);
    const { data } = await api.post(`/api/cv/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },
  async downloadPdf(id) {
    const response = await api.get(`/api/cv/${id}/pdf`, { responseType: "blob" });
    return response.data;
  },
  async renderPdf(payload) {
    const body = { ...payload };
    if (body.cvId === undefined && body.id !== undefined) {
      body.cvId = body.id;
      delete body.id;
    }
    const response = await api.post("/api/cv/pdf/render", body, { responseType: "blob" });
    return response.data;
  },
  async getPublicBySlug(slug) {
    const { data } = await api.get(`/api/public/cv/${slug}`);
    return data;
  }
};
