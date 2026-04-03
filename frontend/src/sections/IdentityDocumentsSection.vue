<script setup>
import { useI18n } from "vue-i18n";

const items = defineModel({ type: Array, required: true });
const { t } = useI18n();

const idTypeOptions = [
  { value: "", labelKey: "cvPreview.idTypePlaceholder" },
  { value: "ID", labelKey: "cvPreview.idTypeId" },
  { value: "Passport", labelKey: "cvPreview.idTypePassport" },
  { value: "Residence permit", labelKey: "cvPreview.idTypeResidencePermit" }
];

function addItem() {
  items.value.push({ type: "", number: "" });
}

function removeItem(index) {
  if (items.value.length === 0) return;
  items.value.splice(index, 1);
}
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold">{{ t("cvPreview.identityDocuments") }}</h2>
      <button
        type="button"
        class="btn-secondary px-3 py-1 text-sm"
        @click="addItem"
      >
        {{ t("cvPreview.add") }}
      </button>
    </div>
    <div class="space-y-3">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="grid grid-cols-1 gap-2 rounded border border-slate-200 p-3 sm:grid-cols-[1fr,2fr,auto]"
      >
        <div class="flex flex-col">
          <label class="mb-1 block text-xs text-slate-500">{{ t("cvPreview.documentType") }}</label>
          <select v-model="item.type" class="form-input">
            <option v-for="opt in idTypeOptions" :key="opt.value" :value="opt.value">{{ t(opt.labelKey) }}</option>
          </select>
        </div>
        <div class="flex flex-col">
          <label class="mb-1 block text-xs text-slate-500">{{ t("cvPreview.idNumber") }}</label>
          <input
            v-model="item.number"
            type="text"
            class="w-full rounded border border-slate-300 p-2 text-sm"
            :placeholder="t('cvPreview.idNumber')"
          />
        </div>
        <div class="flex items-end">
          <button
            type="button"
            class="btn-secondary px-2 py-1.5 text-xs"
            :aria-label="t('cvPreview.remove')"
            @click="removeItem(index)"
          >
            {{ t("cvPreview.remove") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
