<template>
  <div class="min-h-screen bg-app">
    <a
      href="#mulai"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-2xl focus:bg-brand-strong focus:px-4 focus:py-2 focus:text-white"
    >
      Lewati ke konten
    </a>

    <AppNavbar />
    <StepIndicator />

    <main id="mulai" class="mx-auto max-w-[30rem] space-y-5 px-4 pb-12 pt-2">
      <CardTransaksi v-show="store.step >= 1" />
      <CardDataKendaraan v-show="store.step >= 2" />
      <CardHasil v-show="store.step >= 3" />
    </main>

    <footer class="mx-auto max-w-[30rem] px-4 pb-8 text-center text-xs leading-relaxed text-mu">
      Tarif dasar mengacu pada PMK No. 16/PMK.010/2017 · denda berjenjang 25%/50%/75%/100% dari pokok per triwulan (maks Rp100.000).
      Hasil bersifat estimasi — penetapan resmi mengikuti ketentuan Samsat &amp; Jasa Raharja.
    </footer>
  </div>
</template>

<script setup lang="ts">
import AppNavbar from '../components/AppNavbar.vue'
import StepIndicator from '../components/StepIndicator.vue'
import CardTransaksi from '../components/CardTransaksi.vue'
import CardDataKendaraan from '../components/CardDataKendaraan.vue'
import CardHasil from '../components/CardHasil.vue'
import { useKalkulatorStore } from '../stores/kalkulatorStore'
import { useTarif } from '../composables/useTarif'

const store = useKalkulatorStore()
useTarif()
</script>