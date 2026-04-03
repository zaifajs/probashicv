<script setup>
import { useI18n } from "vue-i18n";
import AITextAssistant from "../components/AITextAssistant.vue";

const props = defineProps({
  targetLanguage: { type: String, default: "en" }
});
const items = defineModel({ type: Array, required: true });
const { t } = useI18n();

function addItem() {
  items.value.push({
    jobTitle: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: ""
  });
}

function removeItem(index) {
  if (items.value.length <= 1) return;
  items.value.splice(index, 1);
}
</script>

<template>
  <section class="pb-6">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="section-title">{{ t("cvPreview.workExperience") }}</h2>
      <button type="button" class="btn-ghost" @click="addItem">+ Add</button>
    </div>

    <div v-for="(item, index) in items" :key="index" class="card-subtle mb-4 space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {{ t("cvPreview.workExperience") }} {{ index + 1 }}
        </p>
        <button
          v-if="items.length > 1"
          type="button"
          class="btn-ghost py-1 text-slate-500"
          @click="removeItem(index)"
        >
          {{ t("cvPreview.remove") }}
        </button>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col">
          <label class="form-label">{{ t("cvPreview.jobTitle") }}</label>
          <input v-model="item.jobTitle" class="form-input" :placeholder="t('cvPreview.jobTitle')" />
        </div>
        <div class="flex flex-col">
          <label class="form-label">{{ t("cvPreview.company") }}</label>
          <input v-model="item.company" class="form-input" :placeholder="t('cvPreview.company')" />
        </div>
        <div class="flex flex-col">
          <label class="form-label">{{ t("cvPreview.location") }}</label>
          <input v-model="item.location" class="form-input" :placeholder="t('cvPreview.location')" />
        </div>
        <div class="flex flex-col">
          <label class="form-label">{{ t("cvPreview.startDate") }}</label>
          <input v-model="item.startDate" type="date" class="form-input" />
        </div>
        <div class="flex flex-col">
          <label class="form-label">{{ t("cvPreview.endDateOptional") }}</label>
          <input v-model="item.endDate" type="date" class="form-input" />
        </div>
      </div>
      <div class="flex flex-col">
        <label class="form-label">{{ t("cvPreview.description") }}</label>
        <textarea v-model="item.description" class="form-input min-h-28 w-full resize-y" :placeholder="t('cvPreview.description')" />
      </div>
      <AITextAssistant v-model="item.description" :target-language="props.targetLanguage" content-type="experience" />
    </div>
  </section>
</template>
