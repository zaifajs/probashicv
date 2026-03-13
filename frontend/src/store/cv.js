import { defineStore } from "pinia";
import { cvService } from "../services/cvService";

export function defaultCvData() {
  return {
    personalInfo: {
      name: "",
      jobTitle: "",
      nationality: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      phone: "",
      email: "",
      aboutMe: "",
      photo: "",
      workPermitCountry: ""
    },
    identityDocuments: [{ type: "", number: "" }],
    workExperience: [
      { jobTitle: "", company: "", location: "", startDate: "", endDate: "", description: "" }
    ],
    education: [{ degree: "", school: "", location: "", startDate: "", endDate: "" }],
    skills: [],
    languages: [{ name: "", level: "" }]
  };
}

export const useCvStore = defineStore("cv", {
  state: () => ({
    list: [],
    currentCv: {
      id: null,
      title: "My CV",
      outputLanguage: "en",
      isPublic: false,
      cvData: defaultCvData()
    },
    loading: false
  }),
  actions: {
    async fetchCvs() {
      this.loading = true;
      try {
        this.list = await cvService.list();
      } finally {
        this.loading = false;
      }
    },
    async createCv() {
      const created = await cvService.create(this.currentCv);
      this.currentCv = created;
      await this.fetchCvs();
      return created;
    },
    async loadCv(id) {
      this.currentCv = await cvService.getById(id);
      return this.currentCv;
    },
    async saveCv() {
      if (!this.currentCv.id) {
        return this.createCv();
      }
      const updated = await cvService.update(this.currentCv.id, this.currentCv);
      this.currentCv = updated;
      await this.fetchCvs();
      return updated;
    }
  }
});
