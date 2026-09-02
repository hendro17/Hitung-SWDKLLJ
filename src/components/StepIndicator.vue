<template>
  <ol class="mx-auto flex max-w-[30rem] items-center gap-2 px-4 py-4 text-xs font-semibold text-mu">
    <li v-for="(s, i) in LANGKAH" :key="s" class="flex items-center gap-2">
      <span
        class="flex h-7 min-w-7 items-center justify-center rounded-full border px-2"
        :class="status(i)"
      >
        {{ done(i) ? '✓' : i + 1 }}
      </span>
      <span :class="done(i) || current(i) ? 'text-ink' : ''">{{ s }}</span>
      <span v-if="i < 2" class="mx-1 h-px w-6 bg-line" aria-hidden="true"></span>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { useKalkulatorStore } from '../stores/kalkulatorStore'

const store = useKalkulatorStore()

const LANGKAH = ['Transaksi', 'Data Kendaraan', 'Hasil']

function done(i: number) {
  return store.step > i + 1
}
function current(i: number) {
  return store.step === i + 1
}
function status(i: number) {
  if (done(i)) return 'border-brand bg-brand-soft text-brand'
  if (current(i)) return 'border-brand text-brand'
  return 'border-line'
}
</script>