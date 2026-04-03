<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  cv: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  targetLanguage: {
    type: String,
    default: "en"
  },
  translatedCvData: {
    type: Object,
    default: null
  },
  translating: {
    type: Boolean,
    default: false
  },
  translationError: {
    type: String,
    default: ""
  },
  photoUploading: {
    type: Boolean,
    default: false
  },
  hasUnsavedChanges: {
    type: Boolean,
    default: false
  }
});
const { messages } = useI18n();

function listValues(values = []) {
  const arr = Array.isArray(values) ? values : [];
  return arr.map((item) => (typeof item === "string" ? item : item?.name || "")).filter(Boolean);
}

/** Languages as display strings: "Name (Level)" when level set, else "Name"; supports legacy string[] */
function languageDisplayStrings(languages = []) {
  const arr = Array.isArray(languages) ? languages : [];
  return arr
    .map((item) => {
      if (typeof item === "string") return item.trim() ? item : null;
      const name = (item?.name ?? "").trim();
      if (!name) return null;
      const level = (item?.level ?? "").trim();
      return level ? `${name} (${level})` : name;
    })
    .filter(Boolean);
}

function hasValue(value) {
  return Boolean(value && String(value).trim());
}

/** Format YYYY-MM-DD (or ISO date) as "January 23, 2004"; otherwise return as-is */
function formatDate(value) {
  const s = String(value ?? "").trim();
  if (!s) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const date = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return s;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

/** Year only from YYYY-MM-DD or ISO date */
function formatYear(value) {
  const s = String(value ?? "").trim();
  const m = s.match(/^(\d{4})/);
  return m ? m[1] : "";
}

function getTranslation(path) {
  const locale = props.targetLanguage || "en";
  const active = messages.value?.[locale];
  const fallback = messages.value?.en;
  const keys = path.split(".");

  let current = active;
  for (const key of keys) {
    current = current?.[key];
  }
  if (typeof current === "string") return current;

  current = fallback;
  for (const key of keys) {
    current = current?.[key];
  }
  return typeof current === "string" ? current : path;
}

const previewData = computed(() => {
  const base = props.cv?.cvData || {};
  if (!props.translatedCvData) return base;
  return {
    ...props.translatedCvData,
    sectionSettings: base.sectionSettings || props.translatedCvData.sectionSettings
  };
});
const sectionSettings = computed(() => previewData.value?.sectionSettings || {});

function sectionEnabled(key) {
  return sectionSettings.value?.[key]?.enabled !== false;
}

function sectionTitle(key, fallbackPath) {
  const custom = String(sectionSettings.value?.[key]?.title ?? "").trim();
  return custom || getTranslation(fallbackPath);
}

const photoSrc = computed(() => {
  const value = previewData.value?.personalInfo?.photo;
  if (!value || typeof value !== "string") return "";
  if (value.startsWith("data:")) return value;
  if (value.startsWith("http")) return value;
  const base =
    import.meta.env.VITE_API_URL !== undefined && String(import.meta.env.VITE_API_URL) !== ""
      ? import.meta.env.VITE_API_URL
      : import.meta.env.DEV
        ? "http://localhost:4000"
        : "";
  return `${base}${value}`;
});

/** Split description into bullet lines (by newline) */
function descriptionBullets(description) {
  const s = String(description ?? "").trim();
  if (!s) return [];
  return s.split(/\r?\n/).filter((line) => line.trim());
}
</script>

<template>
  <article
    class="cv-preview overflow-hidden border bg-white p-5 pb-5 pt-0 transition-shadow md:px-10 md:pb-8 md:pt-0"
    :class="(hasUnsavedChanges && !translating) ? 'border-red-400 shadow-[0_25px_50px_-12px_rgba(239,68,68,0.35)]' : 'border-slate-200 shadow-sm'"
  >
    <div class="cv-top-bar -mx-5 h-[112px] w-[calc(100%+4.5rem)] bg-[#93c5fd] md:-mx-10 md:w-[calc(100%+5rem)]" aria-hidden="true" />
    <div class="-mt-5 bg-white px-6 pt-5 md:px-6 md:pt-5">
    <p v-if="photoUploading && !translating" class="mb-3 rounded bg-slate-100 p-2 text-xs text-slate-600 md:mx-8 md:mt-6">
      {{ getTranslation("cvPreview.preparingPreview") }}
    </p>
    <p v-if="translationError" class="mb-3 rounded bg-rose-50 p-2 text-xs text-rose-700 md:mx-8 md:mt-6">
      {{ translationError }}
    </p>

    <!-- Header: circular photo left, name + title + location + about + contact right -->
    <header class="cv-header border-b border-slate-200 pb-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
        <div v-if="previewData?.personalInfo?.photo" class="shrink-0">
          <img :src="photoSrc" alt="Profile" class="cv-photo h-28 w-28 rounded-full border-2 border-emerald-800 object-cover" />
        </div>
        <div class="min-w-0 flex-1">
          <h1 class="cv-name text-2xl font-black tracking-tight text-slate-900">
            {{ (previewData?.personalInfo?.name || getTranslation("cvPreview.yourName")).toUpperCase() }}
          </h1>
          <p class="mt-1 text-sm text-slate-700">
            <span class="cv-job-title font-medium text-[#4169E1]">{{ previewData?.personalInfo?.jobTitle || getTranslation("cvPreview.jobTitle") }}</span>
          </p>
          <p class="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-800">
            {{ previewData?.personalInfo?.aboutMe || "-" }}
          </p>
          <div class="mt-3 space-y-2 text-sm">
            <div v-if="hasValue(previewData?.personalInfo?.email) || hasValue(previewData?.personalInfo?.phone)" class="flex flex-wrap items-center gap-x-4 gap-y-1">
              <template v-if="hasValue(previewData?.personalInfo?.email)">
                <span class="flex items-center gap-2">
                  <span class="flex h-5 w-5 shrink-0 items-center justify-center text-[#4169E1]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <a :href="`mailto:${previewData.personalInfo.email}`" class="cv-link text-[#4169E1] underline">{{ previewData.personalInfo.email }}</a>
                </span>
              </template>
              <template v-if="hasValue(previewData?.personalInfo?.phone)">
                <span class="flex items-center gap-2">
                  <span class="flex h-5 w-5 shrink-0 items-center justify-center text-[#4169E1]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <a :href="`tel:${previewData.personalInfo.phone}`" class="cv-link text-[#4169E1] underline">{{ previewData.personalInfo.phone }}</a>
                </span>
              </template>
            </div>
            <div v-if="hasValue(previewData?.personalInfo?.address)" class="flex items-center gap-2">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center text-[#4169E1]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span class="text-slate-600">{{ previewData.personalInfo.address }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Optional meta: nationality, DOB, gender, work permit, ID/Passport (compact, same line) -->
    <div v-if="hasValue(previewData?.personalInfo?.nationality) || hasValue(previewData?.personalInfo?.dateOfBirth) || hasValue(previewData?.personalInfo?.gender) || hasValue(previewData?.personalInfo?.workPermitCountry) || (previewData?.identityDocuments?.length && previewData.identityDocuments.some(d => hasValue(d.type) || hasValue(d.number)))" class="cv-meta flex flex-wrap gap-x-[18px] gap-y-3 border-b border-slate-100 py-2.5 text-sm text-slate-600">
      <span v-if="hasValue(previewData?.personalInfo?.nationality)">
        <strong class="font-semibold text-slate-700">{{ getTranslation("cvPreview.nationality") }}:</strong> {{ previewData?.personalInfo?.nationality }}
      </span>
      <template v-for="(doc, idx) in (previewData?.identityDocuments ?? [])" :key="`doc-${idx}`">
        <span v-if="hasValue(doc.type) || hasValue(doc.number)">
          <strong class="font-semibold text-slate-700">{{ doc.type || getTranslation("cvPreview.idTypePlaceholder") }}:</strong> {{ doc.number || "—" }}
        </span>
      </template>
      <span v-if="hasValue(previewData?.personalInfo?.dateOfBirth)">
        <strong class="font-semibold text-slate-700">{{ getTranslation("cvPreview.dateOfBirth") }}:</strong> {{ formatDate(previewData?.personalInfo?.dateOfBirth) }}
      </span>
      <span v-if="hasValue(previewData?.personalInfo?.gender)">
        <strong class="font-semibold text-slate-700">{{ getTranslation("cvPreview.gender") }}:</strong> {{ previewData?.personalInfo?.gender }}
      </span>
      <span v-if="hasValue(previewData?.personalInfo?.workPermitCountry)">
        <strong class="font-semibold text-slate-700">{{ getTranslation("cvPreview.workPermit") }}:</strong> {{ previewData?.personalInfo?.workPermitCountry }}
      </span>
    </div>

    <!-- Core skills: same line -->
    <section v-if="sectionEnabled('skills')" class="cv-section border-b border-slate-100 pt-4 pb-4">
      <h3 class="cv-section-title mb-2.5 border-b border-[#4169E1] pb-1 text-base font-semibold text-[#4169E1]">
        {{ sectionTitle("skills", "cvPreview.skills") }}
      </h3>
      <p v-if="listValues(Array.isArray(previewData?.skills) ? previewData.skills : []).length" class="text-sm text-slate-800">
        {{ listValues(Array.isArray(previewData?.skills) ? previewData.skills : []).join(", ") }}
      </p>
      <p v-else class="text-sm text-slate-500">—</p>
    </section>

    <!-- Professional experience -->
    <section v-if="sectionEnabled('workExperience')" class="cv-section border-b border-slate-100 pt-4 pb-4">
      <h3 class="cv-section-title mb-2.5 border-b border-[#4169E1] pb-1 text-base font-semibold text-[#4169E1]">
        {{ sectionTitle("workExperience", "cvPreview.workExperience") }}
      </h3>
      <div
        v-for="(work, index) in previewData?.workExperience || []"
        :key="`work-${index}`"
        class="cv-entry mb-3.5 last:mb-0"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="text-base font-semibold text-slate-900">{{ work.jobTitle || "-" }}</h4>
          <span class="text-sm font-semibold text-slate-700">
            {{ formatDate(work.startDate) || "-" }} – {{ work.endDate ? formatDate(work.endDate) : getTranslation("cvPreview.present") }}
          </span>
        </div>
        <p class="mt-0.5 text-sm text-slate-700">
          <strong class="font-semibold text-slate-800">{{ work.company || "-" }}</strong><span v-if="hasValue(work.location)"> · {{ work.location }}</span>
        </p>
        <ul v-if="descriptionBullets(work.description).length" class="mt-2 list-inside list-disc space-y-0.5 text-sm text-slate-800">
          <li v-for="(line, i) in descriptionBullets(work.description)" :key="i">{{ line }}</li>
        </ul>
        <p v-else-if="hasValue(work.description)" class="mt-2 whitespace-pre-line text-sm text-slate-800">{{ work.description }}</p>
      </div>
    </section>

    <!-- Education: same style as work experience -->
    <section v-if="sectionEnabled('education')" class="cv-section border-b border-slate-100 pt-4 pb-4">
      <h3 class="cv-section-title mb-2.5 border-b border-[#4169E1] pb-1 text-base font-semibold text-[#4169E1]">
        {{ sectionTitle("education", "cvPreview.educationTraining") }}
      </h3>
      <div
        v-for="(item, index) in previewData?.education || []"
        :key="`edu-${index}`"
        class="cv-entry mb-3.5 last:mb-0"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="text-base font-semibold text-slate-900">{{ item.degree || "-" }}</h4>
          <span class="text-sm font-semibold text-slate-700">
            {{ formatDate(item.startDate) || "-" }} – {{ item.endDate ? formatDate(item.endDate) : getTranslation("cvPreview.present") }}
          </span>
        </div>
        <p class="mt-0.5 text-sm text-slate-700">
          <strong class="font-semibold text-slate-800">{{ item.school || "-" }}</strong><span v-if="hasValue(item.location)"> · {{ item.location }}</span>
        </p>
      </div>
    </section>

    <!-- Languages: bulleted list -->
    <section v-if="sectionEnabled('languages')" class="cv-section pt-4 pb-4">
      <h3 class="cv-section-title mb-2.5 border-b border-[#4169E1] pb-1 text-base font-semibold text-[#4169E1]">
        {{ sectionTitle("languages", "cvPreview.languages") }}
      </h3>
      <ul v-if="languageDisplayStrings(previewData?.languages).length" class="list-inside list-disc space-y-1 text-sm text-slate-800">
        <li v-for="(lang, index) in languageDisplayStrings(previewData?.languages)" :key="`lang-${index}`">{{ lang }}</li>
      </ul>
      <p v-else class="text-sm text-slate-500">—</p>
    </section>
    </div>
  </article>
</template>

<style scoped>
.cv-preview {
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
}
.cv-link:hover {
  text-decoration: underline;
}
</style>
