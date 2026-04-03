<script setup>
import { computed, ref } from "vue";
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
const isExperience = computed(() => props.contentType === "experience");
const actionLabel = computed(() => {
  if (isExperience.value) {
    return suggestion.value ? t("cv.regenerateDescription") : t("cv.generateDescription");
  }
  return suggestion.value ? t("cv.regenerate") : t("cv.generateAi");
});
const acceptLabel = computed(() => (isExperience.value ? t("cv.addToDescription") : t("cv.accept")));
const hintText = computed(() => {
  if (props.contentType === "experience") return t("cv.descriptionAiHint");
  if (props.contentType === "about_me") return t("cv.aboutAiHint");
  return "";
});

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
    <p v-if="hintText" class="text-xs text-slate-600">
      {{ hintText }}
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        class="btn-cta px-3 py-1.5 text-xs"
        :disabled="loading"
        @click="generate"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14z" />
        </svg>
        {{ actionLabel }}
      </button>
    </div>

    <div v-if="loading" class="text-xs text-slate-500">Generating...</div>
    <div v-if="error" class="rounded bg-amber-50 p-2 text-xs text-amber-800">{{ error }}</div>
    <div v-if="suggestion" class="space-y-2">
      <p class="rounded bg-white p-2 text-sm text-slate-700">{{ suggestion }}</p>
      <button class="btn-cta px-3 py-1.5 text-xs" @click="accept">
        {{ acceptLabel }}
      </button>
    </div>
  </div>
</template>
