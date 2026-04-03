<script setup>
import { useI18n } from "vue-i18n";
import AITextAssistant from "../components/AITextAssistant.vue";
import CountrySearchSelect from "../components/CountrySearchSelect.vue";

const model = defineModel({ type: Object, required: true });
const identityDocuments = defineModel("identityDocuments", { type: Array, default: () => [] });
const props = defineProps({
  photoUploading: { type: Boolean, default: false },
  targetLanguage: { type: String, default: "en" }
});
const emit = defineEmits(["photo-change"]);
const { t } = useI18n();

const genderOptions = [
  { value: "", labelKey: "cvPreview.genderPlaceholder" },
  { value: "Male", labelKey: "cvPreview.genderMale" },
  { value: "Female", labelKey: "cvPreview.genderFemale" },
  { value: "Other", labelKey: "cvPreview.genderOther" }
];

const idTypeOptions = [
  { value: "", labelKey: "cvPreview.idTypePlaceholder" },
  { value: "ID", labelKey: "cvPreview.idTypeId" },
  { value: "Passport", labelKey: "cvPreview.idTypePassport" },
  { value: "Residence permit", labelKey: "cvPreview.idTypeResidencePermit" }
];

function photoPreviewSrc(photo) {
  if (!photo || typeof photo !== "string") return "";
  if (photo.startsWith("data:") || photo.startsWith("http")) return photo;
  const base =
    import.meta.env.VITE_API_URL !== undefined && String(import.meta.env.VITE_API_URL) !== ""
      ? import.meta.env.VITE_API_URL
      : import.meta.env.DEV
        ? "http://localhost:4000"
        : "";
  return `${base}${photo}`;
}

function addIdentityDocument() {
  const list = identityDocuments.value ?? [];
  identityDocuments.value = [...list, { type: "", number: "" }];
}

function removeIdentityDocument(index) {
  const list = identityDocuments.value ?? [];
  if (list.length === 0) return;
  identityDocuments.value = list.filter((_, i) => i !== index);
}
</script>

<template>
  <section class="pb-6">
    <h2 class="section-title mb-4">{{ t("cvPreview.personalInfo") }}</h2>

    <!-- Photo + key contact fields -->
    <div class="mb-6 grid grid-cols-[auto,minmax(0,1fr)] gap-4">
      <div class="flex flex-col items-start">
        <label class="group relative block cursor-pointer">
          <input type="file" accept="image/*" class="sr-only" @change="emit('photo-change', $event)" />
          <div
            class="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition group-hover:border-brand-400 group-hover:bg-brand-50/50"
          >
            <img
              v-if="photoPreviewSrc(model.photo)"
              :src="photoPreviewSrc(model.photo)"
              alt="Profile"
              class="h-full w-full object-cover"
            />
            <span v-else class="flex flex-col items-center gap-1 text-slate-400">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
              <span class="text-xs">{{ t("cvPreview.photo") }}</span>
            </span>
          </div>
          <button
            v-if="photoPreviewSrc(model.photo)"
            type="button"
            class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 bg-white/95 text-rose-500 shadow-sm transition hover:bg-white hover:text-rose-700"
            :aria-label="t('cvPreview.remove')"
            @click.prevent.stop="model.photo = ''"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
          <span class="mt-1.5 block text-center text-xs text-slate-500 group-hover:text-brand-600">Click to upload</span>
        </label>
        <p v-if="photoUploading" class="mt-2 text-sm text-slate-500">Uploading photo...</p>
      </div>

      <div class="grid gap-4">
        <div class="flex flex-col">
          <label class="form-label">{{ t("auth.name") }}</label>
          <input v-model="model.name" class="form-input" :placeholder="t('auth.name')" />
        </div>
        <div class="flex flex-col">
          <label class="form-label">{{ t("cvPreview.jobTitle") }}</label>
          <input v-model="model.jobTitle" class="form-input" :placeholder="t('cvPreview.jobTitle')" />
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="flex flex-col">
        <label class="form-label">{{ t("cvPreview.phoneNumber") }}</label>
        <input v-model="model.phone" class="form-input" :placeholder="t('cvPreview.phoneNumber')" />
      </div>
      <div class="flex flex-col">
        <CountrySearchSelect
          v-model="model.nationality"
          :label="t('cvPreview.nationality')"
          :placeholder="t('cvPreview.nationalityPlaceholder')"
          :search-placeholder="t('cvPreview.workPermitSearchPlaceholder')"
        />
      </div>
      <div class="flex flex-col">
        <label class="form-label">{{ t("cvPreview.dateOfBirth") }}</label>
        <input v-model="model.dateOfBirth" type="date" class="form-input" />
      </div>
      <div class="flex flex-col">
        <label class="form-label">{{ t("cvPreview.gender") }}</label>
        <select v-model="model.gender" class="form-input">
          <option v-for="opt in genderOptions" :key="opt.value" :value="opt.value">{{ t(opt.labelKey) }}</option>
        </select>
      </div>
      <div class="flex flex-col sm:col-span-2">
        <CountrySearchSelect
          v-model="model.workPermitCountry"
          :label="t('cvPreview.workPermit')"
          :placeholder="t('cvPreview.workPermitPlaceholder')"
          :search-placeholder="t('cvPreview.workPermitSearchPlaceholder')"
        />
      </div>
      <div class="sm:col-span-2 space-y-3">
        <div class="flex items-center justify-between">
          <span class="form-label mb-0">{{ t("cvPreview.identityDocuments") }}</span>
          <button type="button" class="btn-ghost" @click="addIdentityDocument">
            {{ t("cvPreview.add") }}
          </button>
        </div>
        <div
          v-for="(doc, index) in (identityDocuments ?? [])"
          :key="index"
          class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-white/60 p-3 sm:grid-cols-[1fr,2fr,auto]"
        >
          <div class="flex flex-col">
            <label class="form-label">{{ t("cvPreview.documentType") }}</label>
            <select v-model="doc.type" class="form-input">
              <option v-for="opt in idTypeOptions" :key="opt.value" :value="opt.value">{{ t(opt.labelKey) }}</option>
            </select>
          </div>
          <div class="flex flex-col">
            <label class="form-label">{{ t("cvPreview.idNumber") }}</label>
            <input v-model="doc.number" type="text" class="form-input" :placeholder="t('cvPreview.idNumber')" />
          </div>
          <div class="flex items-end">
            <button
              type="button"
              class="btn-ghost text-slate-500"
              :aria-label="t('cvPreview.remove')"
              @click="removeIdentityDocument(index)"
            >
              {{ t("cvPreview.remove") }}
            </button>
          </div>
        </div>
      </div>
      <div class="flex flex-col sm:col-span-2">
        <label class="form-label">{{ t("cvPreview.address") }}</label>
        <input v-model="model.address" class="form-input" :placeholder="t('cvPreview.address')" />
      </div>
      <div class="flex flex-col">
        <label class="form-label">{{ t("cvPreview.emailAddress") }}</label>
        <input v-model="model.email" class="form-input" type="email" :placeholder="t('cvPreview.emailAddress')" />
      </div>
      <div class="flex flex-col sm:col-span-2">
        <label class="form-label">{{ t("cvPreview.aboutMe") }}</label>
        <textarea
          v-model="model.aboutMe"
          class="form-input min-h-28 resize-y"
          :placeholder="t('cvPreview.aboutMe')"
        />
      </div>
      <div class="sm:col-span-2">
        <AITextAssistant v-model="model.aboutMe" :target-language="props.targetLanguage" content-type="about_me" />
      </div>
    </div>
  </section>
</template>
