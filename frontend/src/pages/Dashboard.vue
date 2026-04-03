<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { defaultCvData, useCvStore } from "../store/cv";
import { cvService } from "../services/cvService";

const router = useRouter();
const cvStore = useCvStore();

async function createNew() {
  cvStore.currentCv = {
    id: null,
    title: "Cook CV - Lisbon",
    outputLanguage: "en",
    isPublic: false,
    cvData: defaultCvData()
  };
  const created = await cvStore.createCv();
  router.push(`/builder/${created.id}`);
}

async function remove(id) {
  await cvService.remove(id);
  await cvStore.fetchCvs();
}

onMounted(() => {
  cvStore.fetchCvs();
});
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <button class="rounded-lg bg-brand-600 px-4 py-2 text-white" @click="createNew">Create CV</button>
    </div>

    <div class="grid gap-3">
      <article
        v-for="cv in cvStore.list"
        :key="cv.id"
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-4"
      >
        <div>
          <h2 class="font-semibold">{{ cv.title }}</h2>
          <p class="text-xs text-slate-500">Language: {{ cv.outputLanguage }} | Public: {{ cv.isPublic ? "Yes" : "No" }}</p>
        </div>
        <div class="flex gap-2">
          <router-link :to="`/builder/${cv.id}`" class="rounded border px-3 py-1 text-sm">Edit</router-link>
          <router-link :to="`/cv/${cv.slug}`" class="rounded border px-3 py-1 text-sm">Public Link</router-link>
          <button class="rounded bg-red-600 px-3 py-1 text-sm text-white" @click="remove(cv.id)">Delete</button>
        </div>
      </article>
    </div>
  </section>
</template>
