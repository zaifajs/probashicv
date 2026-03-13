<script setup>
const props = defineProps({
  title: { type: String, required: true },
  placeholder: { type: String, required: true }
});

const items = defineModel({ type: Array, required: true });

function addItem() {
  items.value.push("");
}

function removeItem(index) {
  if (items.value.length <= 1) return;
  items.value.splice(index, 1);
}
</script>

<template>
  <section class="pb-6">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="section-title">{{ props.title }}</h2>
      <button class="btn-ghost" type="button" @click="addItem">+ Add</button>
    </div>

    <div class="space-y-3">
      <div
        v-for="(_, index) in items"
        :key="index"
        class="card-subtle flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
      >
        <div class="min-w-0 flex-1">
          <label class="form-label">{{ items.length > 1 ? `${props.title} ${index + 1}` : props.title }}</label>
          <input v-model="items[index]" class="form-input" :placeholder="props.placeholder" />
        </div>
        <button
          v-if="items.length > 1"
          type="button"
          class="btn-ghost self-end text-slate-500"
          aria-label="Remove"
          @click="removeItem(index)"
        >
          Remove
        </button>
      </div>
    </div>
  </section>
</template>
