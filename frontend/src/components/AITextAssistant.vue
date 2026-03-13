<script setup>
import { ref } from "vue";
import { aiService } from "../services/aiService";
import { useI18n } from "vue-i18n";

const props = defineProps({
  modelValue: { type: String, default: "" },
  targetLanguage: { type: String, default: "en" },
  contentType: { type: String, default: "general" }
});
const emit = defineEmits(["update:modelValue"]);
const { t } = useI18n();

const loading = ref(false);
const suggestion = ref("");
const error = ref("");

async function generate() {
  loading.value = true;
  error.value = "";
  try {
    suggestion.value = await aiService.generate(props.modelValue, props.targetLanguage, props.contentType);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "AI request failed. Check your connection or try again.";
    error.value = msg;
  } finally {
    loading.value = false;
  }
}

function accept() {
  emit("update:modelValue", suggestion.value);
  suggestion.value = "";
}
</script>

<template>
  <div class="space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
    <div class="flex flex-wrap gap-2">
      <button
        class="rounded bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        :disabled="loading"
        @click="generate"
      >
        {{ t("cv.generateAi") }}
      </button>
      <button
        class="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold"
        :disabled="loading"
        @click="generate"
      >
        {{ t("cv.regenerate") }}
      </button>
    </div>

    <div v-if="loading" class="text-xs text-slate-500">Generating...</div>
    <div v-if="error" class="rounded bg-amber-50 p-2 text-xs text-amber-800">{{ error }}</div>
    <div v-if="suggestion" class="space-y-2">
      <p class="rounded bg-white p-2 text-sm text-slate-700">{{ suggestion }}</p>
      <button class="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white" @click="accept">
        {{ t("cv.accept") }}
      </button>
    </div>
  </div>
</template>
