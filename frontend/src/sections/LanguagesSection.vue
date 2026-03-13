<script setup>
const items = defineModel({ type: Array, required: true });

const LEVELS = [
  { value: "", label: "Level" },
  { value: "A1", label: "A1 (Beginner)" },
  { value: "A2", label: "A2 (Elementary)" },
  { value: "B1", label: "B1 (Intermediate)" },
  { value: "B2", label: "B2 (Upper Intermediate)" },
  { value: "C1", label: "C1 (Advanced)" },
  { value: "C2", label: "C2 (Proficiency)" },
  { value: "Native", label: "Native" }
];

function addItem() {
  items.value.push({ name: "", level: "" });
}

function removeItem(index) {
  if (items.value.length <= 1) return;
  items.value.splice(index, 1);
}
</script>

<template>
  <section class="pb-6">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="section-title">Languages</h2>
      <button class="btn-ghost" type="button" @click="addItem">+ Add</button>
    </div>

    <div class="space-y-3">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="card-subtle flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
      >
        <div class="min-w-0 flex-1">
          <label class="form-label">{{ items.length > 1 ? `Language ${index + 1}` : "Language" }}</label>
          <input v-model="item.name" class="form-input" placeholder="e.g. English" />
        </div>
        <div class="w-full sm:w-56">
          <label class="form-label">Level</label>
          <select v-model="item.level" class="form-input">
            <option v-for="opt in LEVELS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
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
