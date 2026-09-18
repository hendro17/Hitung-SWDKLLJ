<template>
  <div class="mt-4 space-y-3">
    <output class="flex items-center gap-2 text-sm text-ink" aria-live="polite" aria-label="Memuat data">
      <svg class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
      {{ text }}
    </output>
    <div class="space-y-2" aria-hidden="true">
      <div v-for="i in rows" :key="i" class="h-16 animate-pulse rounded-2xl border border-line bg-brand-soft/50 motion-reduce:animate-none" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ text?: string; rows?: number }>(), { text: 'Memuat data dari Firestore...', rows: 3 })
</script>
