<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <section class="rounded-2xl bg-white p-8 text-center shadow-sm">
    <h1 class="mb-3 text-3xl font-bold text-slate-900">{{ t("home.title") }}</h1>
    <p class="mb-6 text-slate-600">{{ t("home.subtitle") }}</p>
    <router-link to="/builder" class="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700">
      {{ t("home.cta") }}
    </router-link>
  </section>
</template>
