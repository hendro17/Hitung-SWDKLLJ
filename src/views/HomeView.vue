<template>
  <StepIndicator />
  <div class="mx-auto max-w-[30rem] space-y-5 px-4 pb-12 pt-2">
    <CardTransaksi v-show="store.step >= 1" />
    <CardDataKendaraan v-show="store.step >= 2" />
    <CardHasil v-show="store.step >= 3" />
  </div>
</template>

<script setup lang="ts">
import StepIndicator from '../components/StepIndicator.vue'
import CardTransaksi from '../components/CardTransaksi.vue'
import CardDataKendaraan from '../components/CardDataKendaraan.vue'
import CardHasil from '../components/CardHasil.vue'
import { useKalkulatorStore } from '../stores/kalkulatorStore'
import { useTarif } from '../composables/useTarif'

const store = useKalkulatorStore()
useTarif()
</script>