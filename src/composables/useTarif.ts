// useTarif — muat CSV tarif (URL aset) → parseCsvTarif → tarifStore. Gagal apa pun → tariffAvailable=false (FR-008).
import { onMounted, ref } from 'vue'
import { parseCsvTarif } from '../domain/csv-parser'
import { useTarifStore } from '../stores/tarifStore'

export function useTarif() {
  const tarifStore = useTarifStore()
  const loading = ref(true)

  onMounted(async () => {
    try {
      const res = await fetch(new URL('../data/tarif-swdkllj.csv', import.meta.url), { cache: 'no-cache' })
      if (!res.ok) throw new Error(`fetch gagal: ${res.status}`)
      const text = await res.text()
      const records = parseCsvTarif(text)
      tarifStore.loadRecords(records)
    } catch (err) {
      console.error('[tarif] gagal memuat tarif', err) // NOSONAR - intentional error logging for tariff load failure
      tarifStore.setFailed()
    } finally {
      loading.value = false
    }
  })

  return { tarifStore, loading }
}