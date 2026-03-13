<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { cvService } from "../services/cvService";
import CvPreview from "../components/CvPreview.vue";

const route = useRoute();
const cv = ref(null);
const error = ref("");

onMounted(async () => {
  try {
    cv.value = await cvService.getPublicBySlug(route.params.slug);
  } catch (_error) {
    error.value = "Public CV not found.";
  }
});
</script>

<template>
  <section>
    <p v-if="error" class="rounded bg-red-100 p-3 text-red-700">{{ error }}</p>
    <CvPreview v-else-if="cv" :cv="cv" :readonly="true" />
    <p v-else>Loading...</p>
  </section>
</template>
