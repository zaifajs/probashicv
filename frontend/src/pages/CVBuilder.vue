<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useCvStore } from "../store/cv";
import { useAuthStore } from "../store/auth";
import { apiBase } from "../services/api";
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
const GUEST_DRAFT_KEY = "cv_builder_guest_draft";
const LEGACY_GUEST_DRAFT_KEY = "probashicv_guest_draft";

const saving = ref(false);
const photoUploading = ref(false);
const message = ref("");
const statusBannerClosed = ref(false);
const lastSavedSnapshot = ref("");
let messageTimeout = null;
let statusToastTimeout = null;
const cv = computed(() => cvStore.currentCv);
const currentStep = ref(1);
const totalSteps = 3;
const mobilePreviewOpen = ref(false);

const stepLabels = computed(() => [
  "Personal info",
  "Work & education",
  "Skills & languages"
]);

function goToStep(step) {
  currentStep.value = Math.min(totalSteps, Math.max(1, step));
}

function nextStep() {
  goToStep(currentStep.value + 1);
}

function prevStep() {
  goToStep(currentStep.value - 1);
}

function openMobilePreview() {
  mobilePreviewOpen.value = true;
}

function closeMobilePreview() {
  mobilePreviewOpen.value = false;
}

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

const isErrorToast = computed(() => {
  return statusMessage.value === "Please log in to download a PDF.";
});

const showStatusToast = computed(() => {
  return Boolean(statusMessage.value) && !statusBannerClosed.value;
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
    const draft =
      localStorage.getItem(GUEST_DRAFT_KEY) ||
      localStorage.getItem(LEGACY_GUEST_DRAFT_KEY);
    if (draft) {
      try {
        cvStore.currentCv = JSON.parse(draft);
        ensureIdentityDocuments(cvStore.currentCv?.cvData);
        ensureLanguages(cvStore.currentCv?.cvData);
        lastSavedSnapshot.value = JSON.stringify(cvStore.currentCv);
        localStorage.setItem(GUEST_DRAFT_KEY, draft);
        localStorage.removeItem(LEGACY_GUEST_DRAFT_KEY);
        message.value = "Guest draft loaded";
      } catch (_error) {
        localStorage.removeItem(GUEST_DRAFT_KEY);
        localStorage.removeItem(LEGACY_GUEST_DRAFT_KEY);
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
  if (!authStore.isAuthenticated) {
    message.value = "Please log in to download a PDF.";
    return;
  }

  if (!cv.value.id) {
    await save();
    if (!cv.value.id) {
      message.value = "Save your CV before downloading.";
      return;
    }
  }

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
      cvId: cv.value.id,
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
      cv.value.cvData.personalInfo.photo = `${apiBase}${result.photoUrl}`;
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
  } catch (err) {
    if (requestId !== translationRequestId) return;
    translatedCvData.value = null;
    translationError.value =
      err?.response?.data?.message || "Could not translate preview right now.";
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

watch(statusMessage, (next, prev) => {
  if (next !== prev) {
    statusBannerClosed.value = false;
  }
});

watch(showStatusToast, (visible) => {
  if (statusToastTimeout) {
    clearTimeout(statusToastTimeout);
    statusToastTimeout = null;
  }
  if (visible) {
    statusToastTimeout = setTimeout(() => {
      statusBannerClosed.value = true;
      statusToastTimeout = null;
    }, 5000);
  }
});

function closeStatusToast() {
  statusBannerClosed.value = true;
}

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
  if (statusToastTimeout) {
    clearTimeout(statusToastTimeout);
    statusToastTimeout = null;
  }
});
</script>

<template>
  <div class="mx-auto w-full max-w-[90rem] px-4 py-6 pb-24 lg:pb-6">
    <Transition name="status-toast">
      <div
        v-if="showStatusToast"
        class="pointer-events-none fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-xs"
      >
        <div
          class="pointer-events-auto flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 shadow-lg"
          :class="isErrorToast ? 'border-red-200 bg-red-50 text-red-800' : (message ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800')"
          role="status"
          aria-live="polite"
        >
          <p class="min-w-0 flex-1 text-left text-sm font-medium leading-5">{{ statusMessage }}</p>
          <button
            type="button"
            class="shrink-0 rounded-md border border-current/30 p-1 hover:bg-black/5"
            aria-label="Close notification"
            @click="closeStatusToast"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <section class="grid grid-cols-1 gap-8 lg:grid-cols-8">
      <div class="order-2 space-y-6 lg:order-none lg:col-span-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <div class="mb-3 flex flex-wrap gap-2">
            <button
              v-for="(label, idx) in stepLabels"
              :key="label"
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              :class="
                currentStep === idx + 1
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              "
              @click="goToStep(idx + 1)"
            >
              {{ idx + 1 }}. {{ label }}
            </button>
          </div>
          <p class="text-xs text-slate-500">Step {{ currentStep }} of {{ totalSteps }}</p>
        </div>

        <template v-if="currentStep === 1">
          <PersonalInfoSection
            v-model="cv.cvData.personalInfo"
            v-model:identity-documents="cv.cvData.identityDocuments"
            :photo-uploading="photoUploading"
            :target-language="cv.outputLanguage"
            @photo-change="onPhotoChange"
          />
        </template>

        <template v-else-if="currentStep === 2">
          <WorkExperienceSection v-model="cv.cvData.workExperience" :target-language="cv.outputLanguage" />
          <EducationSection v-model="cv.cvData.education" />
        </template>

        <template v-else>
          <SkillsLanguagesSection v-model="cv.cvData.skills" title="Skill" placeholder="Skill" />
          <LanguagesSection v-model="cv.cvData.languages" />
        </template>

        <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
          <button
            type="button"
            class="btn-secondary py-1.5 text-sm"
            :disabled="currentStep === 1"
            @click="prevStep"
          >
            Previous
          </button>
          <button
            v-if="currentStep < totalSteps"
            type="button"
            class="btn-primary py-1.5 text-sm"
            @click="nextStep"
          >
            Next
          </button>
          <span v-else class="text-sm font-medium text-emerald-600">Final step</span>
        </div>
      </div>

    <div class="order-1 lg:order-none lg:col-span-5 lg:sticky lg:top-6 lg:h-fit">
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
            <button type="button" class="btn-primary hidden items-center justify-center py-1.5 text-sm lg:inline-flex" :disabled="saving" @click="save">
              {{ t("cv.save") }}
            </button>
          </div>
        </div>
        <span class="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="btn-secondary hidden items-center gap-2 py-1.5 text-sm lg:inline-flex"
            :disabled="saving"
            @click="downloadPdf"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ t("cv.downloadPdf") }}
          </button>
        </span>
      </div>
      <div class="relative hidden max-h-[calc(100vh-12rem)] overflow-y-auto rounded-md shadow-xl shadow-slate-300/30 lg:block">
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

    <div v-if="mobilePreviewOpen" class="fixed inset-0 z-50 bg-slate-900/60 p-3 lg:hidden">
      <div class="mx-auto flex h-full max-w-3xl flex-col rounded-xl bg-white">
        <div class="flex items-center justify-between border-b border-slate-200 p-3">
          <h3 class="text-sm font-semibold text-slate-800">Preview</h3>
          <div class="flex items-center gap-2">
            <button type="button" class="btn-secondary py-1.5 text-xs" :disabled="saving" @click="downloadPdf">
              {{ t("cv.downloadPdf") }}
            </button>
            <button type="button" class="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600" @click="closeMobilePreview">
              Close
            </button>
          </div>
        </div>

        <div class="relative flex-1 overflow-y-auto">
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
    </div>

    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
      <div class="flex items-center gap-2">
        <button type="button" class="btn-primary flex flex-1 items-center justify-center py-2.5 text-sm" :disabled="saving" @click="save">
          {{ t("cv.save") }}
        </button>
        <button type="button" class="btn-secondary flex-1 py-2.5 text-sm" @click="openMobilePreview">
          Preview
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-toast-enter-active,
.status-toast-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.status-toast-enter-from,
.status-toast-leave-to {
  opacity: 0;
  transform: translateX(18px);
}

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
