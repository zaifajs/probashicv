<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { COUNTRIES } from "../data/countries.js";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Select" },
  searchPlaceholder: { type: String, default: "e.g: France" },
  label: { type: String, default: "" }
});
const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const search = ref("");

const filteredCountries = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
});

function select(country) {
  emit("update:modelValue", country);
  open.value = false;
  search.value = "";
}

function clear() {
  emit("update:modelValue", "");
  open.value = false;
  search.value = "";
}

function onBlur() {
  setTimeout(() => { open.value = false; }, 150);
}

function handleClickOutside(event) {
  const el = event.target?.closest?.(".country-search-select");
  if (!el) open.value = false;
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="country-search-select relative flex flex-col">
    <label v-if="label" class="form-label">{{ label }}</label>
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      :class="open ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300'"
      @click="open = !open"
    >
      <span :class="modelValue ? 'text-slate-800' : 'text-slate-400'">{{ modelValue || placeholder }}</span>
      <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div
      v-show="open"
      class="absolute left-0 right-0 top-full z-10 mt-1.5 max-h-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
    >
      <div class="relative border-b border-slate-200 p-2">
        <input
          v-model="search"
          type="text"
          class="w-full rounded border border-slate-300 py-2 pl-3 pr-9 text-sm"
          :placeholder="searchPlaceholder"
          @click.stop
        />
        <svg
          class="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div class="max-h-48 overflow-y-auto">
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
          :class="!modelValue ? 'bg-brand-50 text-brand-800' : 'text-slate-600'"
          @click="clear"
        >
          {{ placeholder }}
        </button>
        <button
          v-for="country in filteredCountries"
          :key="country"
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
          :class="modelValue === country ? 'bg-brand-50 font-medium text-brand-800' : 'text-slate-800'"
          @click="select(country)"
        >
          {{ country }}
        </button>
      </div>
    </div>
  </div>
</template>
