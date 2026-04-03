import { defineStore } from "pinia";
import { cvService } from "../services/cvService";

function defaultSectionSettings() {
  return {
    workExperience: { title: "", enabled: true },
    education: { title: "", enabled: true },
    skills: { title: "", enabled: true },
    languages: { title: "", enabled: true }
  };
}

export function emptyCvData() {
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
    identityDocuments: [],
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    sectionSettings: defaultSectionSettings()
  };
}

export function defaultCvData() {
  return {
    personalInfo: {
      name: "Nadim Ahmed",
      jobTitle: "Cook",
      nationality: "Bangladeshi",
      dateOfBirth: "1994-08-14",
      gender: "Male",
      address: "Rua do Benformoso 32, 1100-082 Lisbon, Portugal",
      phone: "+351 912 345 678",
      email: "nadim.ahmed.cv@example.com",
      aboutMe:
        "Experienced cook based in Lisbon with strong skills in prep, hygiene, and high-volume service. Focused on consistent quality, teamwork, and safe kitchen operations.",
      photo:
        "https://images.unsplash.com/photo-1740252117044-2af197eea287?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      workPermitCountry: "Portugal"
    },
    identityDocuments: [{ type: "Residence permit", number: "PT-LX-948271" }],
    workExperience: [
      {
        jobTitle: "Line Cook",
        company: "Mar Azul Restaurant",
        location: "Lisbon, Portugal",
        startDate: "2022-03-01",
        endDate: "",
        description:
          "Prepared hot and cold dishes during lunch and dinner service.\nManaged mise en place and coordinated with front-of-house for timing.\nMaintained HACCP standards for food safety, storage, and cleaning."
      },
      {
        jobTitle: "Kitchen Assistant",
        company: "Tasquinha Alfama",
        location: "Lisbon, Portugal",
        startDate: "2019-06-01",
        endDate: "2022-02-28",
        description:
          "Handled vegetable, meat, and seafood prep for daily menus.\nSupported stock rotation, portioning, and supplier deliveries.\nHelped reduce kitchen waste by improving prep and storage routines."
      }
    ],
    education: [
      {
        degree: "Level 4 Certificate in Professional Cookery",
        school: "Lisbon Hospitality Training Center",
        location: "Lisbon, Portugal",
        startDate: "2018-09-01",
        endDate: "2019-05-31"
      },
      {
        degree: "Secondary School Certificate (SSC)",
        school: "Dhaka Central Girls School",
        location: "Dhaka, Bangladesh",
        startDate: "2009-01-01",
        endDate: "2011-12-31"
      }
    ],
    skills: ["Food Preparation", "Grill & Fry Station", "Kitchen Hygiene (HACCP)", "Inventory Control"],
    languages: [
      { name: "Bengali", level: "Native" },
      { name: "Portuguese", level: "B1" }
    ],
    sectionSettings: defaultSectionSettings()
  };
}

export const useCvStore = defineStore("cv", {
  state: () => ({
    list: [],
    currentCv: {
      id: null,
      title: "Cook CV - Lisbon",
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
