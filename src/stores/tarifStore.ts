// tarifStore — Pinia setup store (data-model.md §2; FR-008). Murni state tarif + flag ketersediaan.
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { TarifGolongan } from '../domain/types'

export const useTarifStore = defineStore('tarif', () => {
  const records = ref<TarifGolongan[]>([])
  const tariffAvailable = ref(false)

  function loadRecords(list: TarifGolongan[]) {
    records.value = list
    tariffAvailable.value = list.length === 9
  }

  function setFailed() {
    records.value = []
    tariffAvailable.value = false
  }

  return { records, tariffAvailable, loadRecords, setFailed }
})