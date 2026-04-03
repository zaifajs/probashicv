<script setup>
import { useI18n } from "vue-i18n";

const items = defineModel({ type: Array, required: true });
const { t } = useI18n();

function addItem() {
  items.value.push({
    degree: "",
    school: "",
    location: "",
    startDate: "",
    endDate: ""
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
      <h2 class="section-title">{{ t("cvPreview.education") }}</h2>
      <button type="button" class="btn-ghost" @click="addItem">+ Add</button>
    </div>
    <div v-for="(item, index) in items" :key="index" class="card-subtle mb-4 grid gap-4 sm:grid-cols-2">
      <div class="col-span-full flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {{ t("cvPreview.education") }} {{ index + 1 }}
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
      <div class="flex flex-col">
        <label class="form-label">{{ t("cvPreview.degree") }}</label>
        <input v-model="item.degree" class="form-input" :placeholder="t('cvPreview.degree')" />
      </div>
      <div class="flex flex-col">
        <label class="form-label">{{ t("cvPreview.school") }}</label>
        <input v-model="item.school" class="form-input" :placeholder="t('cvPreview.school')" />
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
  </section>
</template>
