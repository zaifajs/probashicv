<script setup>
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  defaultTitle: { type: String, default: "Languages" }
});
const items = defineModel({ type: Array, required: true });
const sectionConfig = defineModel("sectionConfig", { type: Object, default: () => ({ title: "", enabled: true }) });
const { t } = useI18n();
const editingTitle = ref(false);
const titleDraft = ref("");
const titleEditableEl = ref(null);
const sectionTitle = computed(() => String(sectionConfig.value?.title ?? "").trim() || props.defaultTitle);
const sectionEnabled = computed(() => sectionConfig.value?.enabled !== false);

const LEVELS = [
  { value: "", label: "Level" },
  { value: "A1", label: "A1 (Beginner)" },
  { value: "A2", label: "A2 (Elementary)" },
  { value: "B1", label: "B1 (Intermediate)" },
  { value: "B2", label: "B2 (Upper Intermediate)" },
  { value: "C1", label: "C1 (Advanced)" },
  { value: "C2", label: "C2 (Proficiency)" },
  { value: "Native", label: "Native" }
];

function addItem() {
  if (!Array.isArray(items.value)) items.value = [];
  items.value.push({ name: "", level: "" });
}

function removeItem(index) {
  if (!Array.isArray(items.value)) return;
  items.value.splice(index, 1);
}

async function startEditTitle() {
  titleDraft.value = sectionTitle.value;
  editingTitle.value = true;
  await nextTick();
  if (titleEditableEl.value) {
    titleEditableEl.value.textContent = titleDraft.value;
    titleEditableEl.value.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(titleEditableEl.value);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}

function saveTitle() {
  sectionConfig.value.title = String(titleDraft.value ?? "").trim();
  editingTitle.value = false;
}

function cancelTitleEdit() {
  titleDraft.value = sectionTitle.value;
  editingTitle.value = false;
}

function onTitleInput(event) {
  titleDraft.value = String(event?.target?.innerText ?? "").replace(/\n/g, "");
}

function toggleSection() {
  sectionConfig.value.enabled = !sectionEnabled.value;
}
</script>

<template>
  <section class="pb-6">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex min-w-0 items-center gap-2">
        <h2
          v-if="editingTitle"
          ref="titleEditableEl"
          class="section-title mb-0 inline-block min-w-[10rem] rounded whitespace-nowrap outline-none ring-brand-300 focus:ring-2"
          contenteditable="true"
          @input="onTitleInput"
          @keydown.enter.prevent="saveTitle"
          @keydown.esc.prevent="cancelTitleEdit"
        />
        <h2 v-else class="section-title mb-0">{{ sectionTitle }}</h2>
      </div>
      <div class="flex items-center gap-1">
        <button v-if="editingTitle" type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100" :aria-label="t('cv.save')" @click="saveTitle">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button v-if="editingTitle" type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" :aria-label="t('cv.toast.close')" @click="cancelTitleEdit">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
        <button v-else type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100" :aria-label="t('cv.editSectionTitle')" @click="startEditTitle">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 11l7.768-7.768a2.5 2.5 0 113.536 3.536L12.536 14.536A4 4 0 0110.586 15.586L7 17l1.414-3.586A4 4 0 019 11z" />
          </svg>
        </button>
        <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100" :aria-label="sectionEnabled ? t('cv.hideSection') : t('cv.showSection')" @click="toggleSection">
          <svg v-if="sectionEnabled" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-7-10-7a19.48 19.48 0 015.168-5.943M9.88 9.88A3 3 0 1014.12 14.12M6.1 6.1L3 3m15.9 15.9L21 21M10.73 5.08A9.96 9.96 0 0112 5c5.523 0 10 7 10 7a19.56 19.56 0 01-4.39 5.08" />
          </svg>
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <circle cx="12" cy="12" r="3" stroke-width="2" />
          </svg>
        </button>
        <button class="inline-flex h-8 items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-100" type="button" @click="addItem">+ {{ t("cvPreview.add") }}</button>
      </div>
    </div>

    <p v-if="!sectionEnabled" class="card-subtle mb-4 text-sm text-slate-500">{{ t("cv.sectionHidden") }}</p>
    <div v-else-if="!items.length" class="card-subtle mb-4 flex items-center justify-between gap-2">
      <p class="text-sm text-slate-500">{{ t("cv.emptyLanguages") }}</p>
      <button type="button" class="btn-secondary py-1.5 text-xs" @click="addItem">+ {{ t("cvPreview.add") }}</button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="card-subtle flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
      >
        <div class="min-w-0 flex-1">
          <label class="form-label">{{ items.length > 1 ? `Language ${index + 1}` : "Language" }}</label>
          <input v-model="item.name" class="form-input" placeholder="e.g. English" />
        </div>
        <div class="w-full sm:w-56">
          <label class="form-label">Level</label>
          <select v-model="item.level" class="form-input">
            <option v-for="opt in LEVELS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <button
          type="button"
          class="btn-ghost self-end text-slate-500"
          :aria-label="t('cvPreview.remove')"
          @click="removeItem(index)"
        >
          {{ t("cvPreview.remove") }}
        </button>
      </div>
    </div>
  </section>
</template>
