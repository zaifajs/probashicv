<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useCvStore } from "../store/cv";
import { useAuthStore } from "../store/auth";
import { cvService } from "../services/cvService";
import { aiService } from "../services/aiService";
import CvPreview from "../components/CvPreview.vue";
import PersonalInfoSection from "../sections/PersonalInfoSection.vue";
import WorkExperienceSection from "../sections/WorkExperienceSection.vue";
import EducationSection from "../sections/EducationSection.vue";
import SkillsLanguagesSection from "../sections/SkillsLanguagesSection.vue";
import LanguagesSection from "../sections/LanguagesSection.vue";
import { useI18n } from "vue-i18n";

const route = useRoute();
const cvStore = useCvStore();
const authStore = useAuthStore();
const { t } = useI18n();
const GUEST_DRAFT_KEY = "probashicv_guest_draft";

const saving = ref(false);
const photoUploading = ref(false);
const message = ref("");
const lastSavedSnapshot = ref("");
let messageTimeout = null;
const cv = computed(() => cvStore.currentCv);

const isDirty = computed(() => {
  if (!lastSavedSnapshot.value || !cv.value) return false;
  try {
    return JSON.stringify(cv.value) !== lastSavedSnapshot.value;
  } catch {
    return false;
  }
});

const statusMessage = computed(() => {
  if (message.value) return message.value;
  if (isDirty.value) return t("cv.unsavedChanges");
  return "";
});

const statusMessageStyle = computed(() => {
  if (message.value) return "text-emerald-600";
  if (isDirty.value) return "text-amber-600";
  return "";
});
const translatedCvData = ref(null);
const translatingPreview = ref(false);
const translationError = ref("");
let translationTimer = null;
let translationRequestId = 0;
let lastTranslationSignature = "";

const loadingMessageIndex = ref(0);
const loadingMessages = computed(() => [
  t("cvPreview.preparingPreview"),
  t("cvPreview.translating")
]);
let loadingInterval = null;

watch(translatingPreview, (isTranslating) => {
  if (isTranslating) {
    loadingMessageIndex.value = 0;
    loadingInterval = setInterval(() => {
      loadingMessageIndex.value = (loadingMessageIndex.value + 1) % 2;
    }, 2200);
  } else {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }
});

/** Signature of text content only (excludes photo) so translation is cached until content changes */
function getContentSignature(cvData) {
  if (!cvData) return "";
  try {
    const copy = JSON.parse(JSON.stringify(cvData));
    if (copy.personalInfo && typeof copy.personalInfo.photo === "string") {
      copy.personalInfo.photo = "[PHOTO]";
    }
    return JSON.stringify(copy);
  } catch {
    return "";
  }
}

const contentSignature = computed(() => {
  const lang = cv.value?.outputLanguage ?? "";
  const sig = getContentSignature(cv.value?.cvData);
  return `${lang}:${sig}`;
});

async function isPdfBlob(blob) {
  if (!blob) return false;
  const bytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...bytes) === "%PDF-";
}

function ensureIdentityDocuments(cvData) {
  if (!cvData) return;
  if (!Array.isArray(cvData.identityDocuments) || cvData.identityDocuments.length === 0) {
    cvData.identityDocuments = [{ type: "", number: "" }];
  }
}

function ensureLanguages(cvData) {
  if (!cvData) return;
  if (!Array.isArray(cvData.languages)) {
    cvData.languages = [{ name: "", level: "" }];
    return;
  }
  cvData.languages = cvData.languages.map((item) =>
    typeof item === "string" ? { name: item, level: "" } : { name: item?.name ?? "", level: item?.level ?? "" }
  );
  if (cvData.languages.length === 0) {
    cvData.languages = [{ name: "", level: "" }];
  }
}

async function load() {
  if (route.params.id && authStore.isAuthenticated) {
    await cvStore.loadCv(route.params.id);
    ensureIdentityDocuments(cvStore.currentCv?.cvData);
    ensureLanguages(cvStore.currentCv?.cvData);
    lastSavedSnapshot.value = JSON.stringify(cvStore.currentCv);
    return;
  }

  if (!authStore.isAuthenticated) {
    const draft = localStorage.getItem(GUEST_DRAFT_KEY);
    if (draft) {
      try {
        cvStore.currentCv = JSON.parse(draft);
        ensureIdentityDocuments(cvStore.currentCv?.cvData);
        ensureLanguages(cvStore.currentCv?.cvData);
        lastSavedSnapshot.value = JSON.stringify(cvStore.currentCv);
        message.value = "Guest draft loaded";
      } catch (_error) {
        localStorage.removeItem(GUEST_DRAFT_KEY);
      }
    } else {
      lastSavedSnapshot.value = JSON.stringify(cvStore.currentCv ?? {});
      message.value = "Guest mode: build first, login later to save online";
    }
  }
  if (!lastSavedSnapshot.value && cvStore.currentCv) {
    lastSavedSnapshot.value = JSON.stringify(cvStore.currentCv);
  }
}

async function save() {
  saving.value = true;
  if (messageTimeout) {
    clearTimeout(messageTimeout);
    messageTimeout = null;
  }
  try {
    if (authStore.isAuthenticated) {
      await cvStore.saveCv();
      message.value = "Saved to your account";
    } else {
      localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(cv.value));
      message.value = "Saved locally (guest mode)";
    }
    lastSavedSnapshot.value = JSON.stringify(cv.value);
    messageTimeout = setTimeout(() => {
      message.value = "";
      messageTimeout = null;
    }, 3000);
  } finally {
    saving.value = false;
  }
}

async function downloadPdf() {
  try {
    let pdfCvData = cv.value.cvData;

    if (cv.value.outputLanguage !== "en") {
      if (translatedCvData.value) {
        pdfCvData = translatedCvData.value;
      } else {
        try {
          translatingPreview.value = true;
          pdfCvData = await aiService.translateCv(cv.value.cvData, cv.value.outputLanguage);
        } catch (_error) {
          message.value = "Could not translate for PDF. Downloading current CV content.";
        } finally {
          translatingPreview.value = false;
        }
      }
    }

    const blob = await cvService.renderPdf({
      title: cv.value.title || "CV",
      slug: cv.value.slug || "cv",
      outputLanguage: cv.value.outputLanguage || "en",
      cvData: pdfCvData
    });

    if (!(await isPdfBlob(blob))) {
      message.value = "PDF generation failed. Please try again.";
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${cv.value.slug || "cv"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (_error) {
    message.value = "PDF download failed. Please try again.";
  }
}

async function onPhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!cv.value.cvData) cv.value.cvData = {};
  if (!cv.value.cvData.personalInfo) cv.value.cvData.personalInfo = {};

  photoUploading.value = true;
  try {
    if (authStore.isAuthenticated && cv.value.id) {
      const result = await cvService.uploadPhoto(cv.value.id, file);
      cv.value.cvData.personalInfo.photo = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${result.photoUrl}`;
    } else {
      cv.value.cvData.personalInfo.photo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
    }
  } finally {
    photoUploading.value = false;
    event.target.value = "";
  }
}

async function runPreviewTranslation() {
  if (!cv.value?.cvData) {
    translatedCvData.value = null;
    translationError.value = "";
    return;
  }

  const currentSignature = contentSignature.value;
  if (currentSignature === lastTranslationSignature) {
    return;
  }

  const language = cv.value.outputLanguage || "en";
  if (language === "en") {
    translatedCvData.value = null;
    translationError.value = "";
    lastTranslationSignature = currentSignature;
    return;
  }

  const requestId = ++translationRequestId;
  translatingPreview.value = true;
  translationError.value = "";
  try {
    const translated = await aiService.translateCv(cv.value.cvData, language);
    if (requestId !== translationRequestId) return;
    translatedCvData.value = translated;
    lastTranslationSignature = currentSignature;
  } catch (_error) {
    if (requestId !== translationRequestId) return;
    translatedCvData.value = null;
    translationError.value = "Could not translate preview right now.";
  } finally {
    if (requestId === translationRequestId) {
      translatingPreview.value = false;
    }
  }
}

function queuePreviewTranslation() {
  if (translationTimer) clearTimeout(translationTimer);
  translationTimer = setTimeout(() => {
    translationTimer = null;
    runPreviewTranslation();
  }, 500);
}

watch(contentSignature, () => {
  queuePreviewTranslation();
});

onMounted(load);
onUnmounted(() => {
  if (messageTimeout) {
    clearTimeout(messageTimeout);
    messageTimeout = null;
  }
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
});
</script>

<template>
  <div class="mx-auto w-full max-w-[90rem] px-4 py-6">
    <section class="grid grid-cols-1 gap-8 lg:grid-cols-8">
      <div class="space-y-8 lg:col-span-3">
        <PersonalInfoSection
        v-model="cv.cvData.personalInfo"
        v-model:identity-documents="cv.cvData.identityDocuments"
        :photo-uploading="photoUploading"
        :target-language="cv.outputLanguage"
        @photo-change="onPhotoChange"
      />
      <WorkExperienceSection v-model="cv.cvData.workExperience" :target-language="cv.outputLanguage" />
      <EducationSection v-model="cv.cvData.education" />
      <SkillsLanguagesSection v-model="cv.cvData.skills" title="Skill" placeholder="Skill" />
      <LanguagesSection v-model="cv.cvData.languages" />
    </div>

    <div class="lg:col-span-5 lg:sticky lg:top-6 lg:h-fit">
      <div class="mb-8 flex flex-wrap items-start gap-3">
        <div class="flex flex-col gap-2">
          <div class="flex flex-nowrap items-stretch gap-2 sm:gap-3">
            <input
              v-model="cv.title"
              type="text"
              class="form-input min-w-0 flex-1 py-1.5 text-sm sm:max-w-[14rem]"
              :placeholder="t('cv.title')"
            />
            <select v-model="cv.outputLanguage" class="form-input w-auto shrink-0 py-1.5 text-sm">
              <option value="en">English</option>
              <option value="bn">Bangla</option>
              <option value="pt">Portuguese</option>
            </select>
            <label class="flex h-[2.25rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 whitespace-nowrap text-sm text-slate-600 shadow-sm transition hover:border-slate-300 [box-sizing:border-box]">
              <input v-model="cv.isPublic" type="checkbox" class="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              {{ t("cv.public") }}
            </label>
            <div class="relative shrink-0">
              <button type="button" class="btn-primary py-1.5 text-sm" :disabled="saving" @click="save">
                {{ t("cv.save") }}
              </button>
              <span v-if="statusMessage" :class="['absolute left-0 top-full mt-0.5 whitespace-nowrap text-sm font-medium', statusMessageStyle]">{{ statusMessage }}</span>
            </div>
          </div>
        </div>
        <span class="ml-auto flex shrink-0 items-center gap-2">
          <button type="button" class="btn-secondary inline-flex items-center gap-2 py-1.5 text-sm" @click="downloadPdf">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ t("cv.downloadPdf") }}
          </button>
        </span>
      </div>
      <div class="relative max-h-[calc(100vh-12rem)] overflow-y-auto rounded-md shadow-xl shadow-slate-300/30">
        <div
          v-if="translatingPreview"
          class="preview-loading-overlay absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/90 backdrop-blur-sm"
          aria-live="polite"
        >
          <svg
            class="h-10 w-10 animate-spin text-brand-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <Transition name="loading-msg" mode="out-in">
            <p
              :key="loadingMessageIndex"
              class="min-h-[1.25rem] text-center text-sm font-medium text-slate-700"
            >
              {{ loadingMessages[loadingMessageIndex] }}
            </p>
          </Transition>
        </div>
        <CvPreview
        :cv="cv"
        :target-language="cv.outputLanguage"
        :translated-cv-data="translatedCvData"
        :translating="translatingPreview"
        :translation-error="translationError"
        :photo-uploading="photoUploading"
        :has-unsaved-changes="isDirty"
      />
      </div>
    </div>
    </section>
  </div>
</template>

<style scoped>
.loading-msg-enter-active,
.loading-msg-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.loading-msg-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.loading-msg-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
