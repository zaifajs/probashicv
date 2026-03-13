<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";
import { useI18n } from "vue-i18n";

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const form = reactive({ name: "", email: "", password: "" });
const error = reactive({ message: "" });

async function submit() {
  try {
    error.message = "";
    await auth.register(form);
    router.push("/dashboard");
  } catch (err) {
    error.message = err?.response?.data?.message || "Failed to register.";
  }
}
</script>

<template>
  <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
    <h1 class="mb-4 text-2xl font-bold">{{ t("auth.submitRegister") }}</h1>
    <form class="space-y-3" @submit.prevent="submit">
      <input v-model="form.name" class="w-full rounded border p-2" :placeholder="t('auth.name')" />
      <input v-model="form.email" type="email" class="w-full rounded border p-2" :placeholder="t('auth.email')" />
      <input
        v-model="form.password"
        type="password"
        class="w-full rounded border p-2"
        :placeholder="t('auth.password')"
      />
      <button class="w-full rounded bg-brand-600 px-4 py-2 text-white">{{ t("auth.submitRegister") }}</button>
      <p v-if="error.message" class="text-sm text-red-600">{{ error.message }}</p>
    </form>
  </section>
</template>
