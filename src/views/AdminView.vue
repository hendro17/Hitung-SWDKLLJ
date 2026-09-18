<template>
  <AppBreadcrumb :crumbs="[{ label: 'Admin' }]" />
  <div class="mx-auto max-w-[30rem] p-4">
    <div class="mb-2"><RouterLink to="/" class="text-xs text-brand hover:underline">← Beranda</RouterLink></div>
    <h1 class="text-xl font-bold text-ink">Admin — Setup Keringanan</h1>

    <!-- Token login -->
    <div v-if="!admin.isAuthenticated" class="mt-4 space-y-3">
      <p class="text-sm text-mu">Paste token sk-* untuk login.</p>
      <div>
        <label for="admin-token" class="mb-1 block text-xs font-semibold text-ink">Token admin</label>
        <input id="admin-token" v-model="tokenInput" placeholder="sk-..." class="w-full rounded-2xl border border-line bg-surface px-4 py-3 font-mono text-sm outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
      </div>
      <button type="button" :disabled="isVerifying" :aria-busy="isVerifying" class="w-full cursor-pointer rounded-2xl bg-brand-strong px-4 py-3 font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70" @click="onVerify"><span v-if="isVerifying" class="inline-flex items-center gap-2"><svg class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Memverifikasi...</span><span v-else>Verifikasi</span></button>
      <p v-if="err" class="text-sm text-danger">{{ err }}</p>
    </div>

    <div v-else class="mt-4 space-y-4">
      <p class="text-sm text-ink">Login sebagai {{ admin.sessionLabel }} <button type="button" class="ml-2 cursor-pointer rounded-full border border-danger/50 bg-danger/5 px-3 py-1 text-xs font-medium text-danger transition-all hover:border-danger hover:bg-danger hover:text-white active:scale-95" @click="admin.resetSession()">Logout</button></p>

      <DataLoading v-if="isPageLoading" text="Memuat data keringanan dari Firestore..." />
      <template v-if="!isPageLoading">

      <div class="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-[var(--shadow-card)]">
        <div>
          <label for="form-label" class="mb-1 block text-xs font-semibold text-ink">Label provisi</label>
          <input id="form-label" v-model="form.label" placeholder="Label provisi required" class="w-full rounded-2xl border border-line bg-surface px-3 py-2 text-sm outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" :class="formLabelInvalid ? 'border-danger ring-1 ring-danger' : ''" @input="formLabelInvalid = false" />
        </div>
        <div class="flex gap-2">
          <div class="flex-1">
            <span class="mb-1 block text-xs font-semibold text-ink">Mulai</span>
            <DatePicker v-model="form.mulai" placeholder="Mulai" />
          </div>
          <div class="flex-1">
            <span class="mb-1 block text-xs font-semibold text-ink">Akhir</span>
            <DatePicker v-model="form.akhir" placeholder="Akhir" />
          </div>
        </div>
        <div class="space-y-3">
          <fieldset class="rounded-2xl border border-line bg-surface p-3">
            <legend class="px-1 text-xs font-semibold text-ink">Pokok Tunggakan</legend>
            <div class="grid grid-cols-2 gap-1 text-sm">
              <label v-for="k in 4" :key="'p'+k" class="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-brand-soft"><input type="checkbox" v-model="(form as unknown as Record<string, boolean>)[`pokokTunggakan${k}`]" class="size-4 cursor-pointer accent-brand" /> Pokok {{ k }}</label>
            </div>
          </fieldset>
          <fieldset class="rounded-2xl border border-line bg-surface p-3">
            <legend class="px-1 text-xs font-semibold text-ink">Denda Tunggakan</legend>
            <div class="grid grid-cols-2 gap-1 text-sm">
              <label v-for="k in 4" :key="'d'+k" class="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-brand-soft"><input type="checkbox" v-model="(form as unknown as Record<string, boolean>)[`dendaTunggakan${k}`]" class="size-4 cursor-pointer accent-brand" /> Denda {{ k }}</label>
            </div>
          </fieldset>
        </div>
        <div>
          <label for="form-hari" class="mb-1 block text-xs font-semibold text-ink">Hari tambahan kebijakan (di atas 30 hari)</label>
          <input id="form-hari" v-model.number="form.hariTambahan" type="number" min="0" step="1" class="mt-1 w-full rounded-2xl border border-line bg-surface px-3 py-2 text-sm outline-none transition-all hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
        </div>
        <button type="button" class="w-full cursor-pointer rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]" @click="onSave">Simpan Keringanan</button>
      </div>

      <h3 class="font-semibold text-ink">Keringanan milik saya</h3>
      <div>
        <button type="button" :disabled="isRefreshingK" class="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95 disabled:cursor-wait disabled:opacity-70" @click="onRefreshK"><span v-if="isRefreshingK" class="inline-flex items-center gap-1.5"><svg class="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Menyinkron...</span><span v-else>Reload Data</span></button>
      </div>
      <ul class="space-y-3 text-sm">
        <li v-for="k in myList" :key="k.id" class="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-semibold text-ink">{{ k.label }} <span class="font-normal text-mu">({{ k.mulai }}→{{ k.akhir }})</span></p>
            <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">+{{ normalizeHariTambahan(k.hariTambahan) }}d</span>
          </div>
          <p class="mt-1 text-xs text-mu">{{ flags(k) }} · +{{ normalizeHariTambahan(k.hariTambahan) }}d → jendela {{ 30 + normalizeHariTambahan(k.hariTambahan) }} hari</p>
          <div class="mt-3 flex gap-2">
            <button type="button" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95" @click="startEdit(k)">Edit</button>
            <button type="button" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-danger transition-all hover:border-danger hover:bg-danger/10 active:scale-95" @click="deleteId = k.id; deleteInput = ''">Hapus</button>
          </div>
          <div v-if="deleteId===k.id" class="mt-3 rounded-2xl border border-danger/40 bg-danger/5 p-3">
            <p class="text-xs text-ink">Keringanan "{{ k.label }}" akan dihapus permanen. Ketik label keringanan untuk konfirmasi:</p>
            <input v-model="deleteInput" type="text" placeholder="Ketik label keringanan" class="mt-2 w-full rounded-2xl border border-line bg-surface px-3 py-2 text-xs outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
            <div class="mt-2 flex gap-2">
              <button type="button" :disabled="deleteInput!==k.label" class="flex-1 cursor-pointer rounded-2xl bg-danger px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50" @click="onDelete(k.id)">Hapus permanen</button>
              <button type="button" class="cursor-pointer rounded-2xl border border-line bg-surface px-4 py-2 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95" @click="deleteId = null">Batal</button>
            </div>
          </div>
          <div v-if="editId===k.id" class="mt-3 space-y-3 rounded-2xl bg-app p-3">
            <div>
              <label :for="'admin-edit-label-' + k.id" class="mb-1 block text-xs font-semibold text-ink">Label</label>
              <input :id="'admin-edit-label-' + k.id" v-model="editForm.label" class="w-full rounded-2xl border border-line bg-surface px-3 py-2 text-sm outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" :class="editLabelInvalid ? 'border-danger ring-1 ring-danger' : ''" @input="editLabelInvalid = false" />
            </div>
            <div class="flex gap-2">
              <div class="flex-1">
                <span class="mb-1 block text-xs font-semibold text-ink">Mulai</span>
                <DatePicker v-model="editForm.mulai" placeholder="Mulai" />
              </div>
              <div class="flex-1">
                <span class="mb-1 block text-xs font-semibold text-ink">Akhir</span>
                <DatePicker v-model="editForm.akhir" placeholder="Akhir" />
              </div>
            </div>
            <div class="space-y-3">
              <fieldset class="rounded-2xl border border-line bg-surface p-3">
                <legend class="px-1 text-xs font-semibold text-ink">Pokok Tunggakan</legend>
                <div class="grid grid-cols-2 gap-1 text-xs">
                  <label v-for="n in 4" :key="'ep'+n" class="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-brand-soft"><input type="checkbox" v-model="(editForm as unknown as Record<string, boolean>)[`pokokTunggakan${n}`]" class="size-4 cursor-pointer accent-brand" /> Pokok {{ n }}</label>
                </div>
              </fieldset>
              <fieldset class="rounded-2xl border border-line bg-surface p-3">
                <legend class="px-1 text-xs font-semibold text-ink">Denda Tunggakan</legend>
                <div class="grid grid-cols-2 gap-1 text-xs">
                  <label v-for="n in 4" :key="'ed'+n" class="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-brand-soft"><input type="checkbox" v-model="(editForm as unknown as Record<string, boolean>)[`dendaTunggakan${n}`]" class="size-4 cursor-pointer accent-brand" /> Denda {{ n }}</label>
                </div>
              </fieldset>
            </div>
            <div>
              <label :for="'admin-edit-hari-' + k.id" class="mb-1 block text-xs font-semibold text-ink">Hari tambahan kebijakan (di atas 30 hari)</label>
              <input :id="'admin-edit-hari-' + k.id" v-model.number="editForm.hariTambahan" type="number" min="0" step="1" class="mt-1 w-full rounded-2xl border border-line bg-surface px-3 py-2 text-xs outline-none transition-all hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
            </div>
            <div class="flex gap-2">
              <button type="button" class="flex-1 cursor-pointer rounded-2xl bg-brand-strong px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]" @click="onUpdate">Simpan</button>
              <button type="button" class="cursor-pointer rounded-2xl border border-line bg-surface px-4 py-2 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95" @click="editId=null">Batal</button>
            </div>
          </div>
        </li>
      </ul>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'
import DataLoading from '../components/DataLoading.vue'
import DatePicker from '../components/ui/DatePicker.vue'
import { useAdminStore } from '../stores/adminStore'
import { verifyAdminToken } from '../services/adminTokenService'
import { upsertKeringanan, deleteKeringanan, updateKeringanan } from '../services/keringananService'
import { refreshKeringanan, awaitKeringanan } from '../composables/useKeringanan'
import { sha256Hex } from '../services/firebase'
import { toast } from 'vue-sonner'
import type { KeringananDoc } from '../domain/keringanan'
import { normalizeHariTambahan } from '../domain/keringanan'

const admin = useAdminStore()
const tokenInput = ref(''); const err = ref(''); const isVerifying = ref(false)
const form = reactive({ label: '', mulai: new Date().toISOString().slice(0,10), akhir: new Date(Date.now()+30*864e5).toISOString().slice(0,10), hariTambahan: 30, pokokTunggakan1: false, dendaTunggakan1: false, pokokTunggakan2: false, dendaTunggakan2: false, pokokTunggakan3: false, dendaTunggakan3: false, pokokTunggakan4: false, dendaTunggakan4: false })
const myList = computed(() => admin.keringananList.filter((k) => k.createdBy === admin.sessionHash))
const editId = ref<string | null>(null)
const deleteId = ref<string | null>(null)
const deleteInput = ref('')
const formLabelInvalid = ref(false); const editLabelInvalid = ref(false)
const isPageLoading = ref(false)

onMounted(async () => {
  if (!admin.isAuthenticated) return
  isPageLoading.value = true
  try { await awaitKeringanan() } finally { isPageLoading.value = false }
})
const editForm = reactive({ label: '', mulai: '', akhir: '', hariTambahan: 30, pokokTunggakan1: false, dendaTunggakan1: false, pokokTunggakan2: false, dendaTunggakan2: false, pokokTunggakan3: false, dendaTunggakan3: false, pokokTunggakan4: false, dendaTunggakan4: false })

function flags(k: KeringananDoc) { return [1,2,3,4].flatMap((n) => [(k as unknown as Record<string, boolean>)[`pokokTunggakan${n}`] ? `P${n}` : null, (k as unknown as Record<string, boolean>)[`dendaTunggakan${n}`] ? `D${n}` : null]).filter(Boolean).join(' ') || '—' }

async function onVerify() {
  err.value = ''
  isVerifying.value = true
  const raw = tokenInput.value.trim()
  if (!raw.startsWith('sk-')) { err.value = 'Token harus sk-*'; isVerifying.value = false; return }
  try {
    const { valid, doc } = await verifyAdminToken(raw)
    if (!valid || !doc) { err.value = 'Token tidak valid / expired / revoked'; toast.error('Token tidak valid / expired / revoked'); return }
    const hash = await sha256Hex(raw)
    admin.setSession(hash, doc.validUntil, doc.label)
    isPageLoading.value = true
    try { await awaitKeringanan() } finally { isPageLoading.value = false }
    toast.success('Selamat datang, ' + doc.label + '!')
  } catch (e: unknown) { err.value = e instanceof Error ? e.message : String(e); toast.error(err.value) } finally { isVerifying.value = false }
}

async function onSave() {
  formLabelInvalid.value = !form.label.trim()
  if (formLabelInvalid.value) { toast.error('Form required'); return }
  try {
    const doc: KeringananDoc = { id: crypto.randomUUID(), label: form.label.trim(), mulai: form.mulai || new Date().toISOString().slice(0,10), akhir: form.akhir || new Date(Date.now()+30*864e5).toISOString().slice(0,10), hariTambahan: normalizeHariTambahan(form.hariTambahan), pokokTunggakan1: form.pokokTunggakan1, dendaTunggakan1: form.dendaTunggakan1, pokokTunggakan2: form.pokokTunggakan2, dendaTunggakan2: form.dendaTunggakan2, pokokTunggakan3: form.pokokTunggakan3, dendaTunggakan3: form.dendaTunggakan3, pokokTunggakan4: form.pokokTunggakan4, dendaTunggakan4: form.dendaTunggakan4, createdBy: admin.sessionHash! }
    await upsertKeringanan(doc)
    admin.setKeringananList([...admin.keringananList, doc])
    toast.success('Keringanan tersimpan')
  } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
}

function startEdit(k: KeringananDoc) { editId.value = k.id; editLabelInvalid.value = false; Object.assign(editForm, { label: k.label, mulai: k.mulai, akhir: k.akhir, hariTambahan: normalizeHariTambahan(k.hariTambahan), pokokTunggakan1: k.pokokTunggakan1, dendaTunggakan1: k.dendaTunggakan1, pokokTunggakan2: k.pokokTunggakan2, dendaTunggakan2: k.dendaTunggakan2, pokokTunggakan3: k.pokokTunggakan3, dendaTunggakan3: k.dendaTunggakan3, pokokTunggakan4: k.pokokTunggakan4, dendaTunggakan4: k.dendaTunggakan4 }) }
async function onUpdate() {
  if (!editId.value) return
  editLabelInvalid.value = !editForm.label.trim()
  if (editLabelInvalid.value) { toast.error('Form required'); return }
  try {
    await updateKeringanan(editId.value, { label: editForm.label, mulai: editForm.mulai, akhir: editForm.akhir, hariTambahan: normalizeHariTambahan(editForm.hariTambahan), pokokTunggakan1: editForm.pokokTunggakan1, dendaTunggakan1: editForm.dendaTunggakan1, pokokTunggakan2: editForm.pokokTunggakan2, dendaTunggakan2: editForm.dendaTunggakan2, pokokTunggakan3: editForm.pokokTunggakan3, dendaTunggakan3: editForm.dendaTunggakan3, pokokTunggakan4: editForm.pokokTunggakan4, dendaTunggakan4: editForm.dendaTunggakan4, updatedBy: admin.sessionHash! } as unknown as Parameters<typeof updateKeringanan>[1])
    admin.setKeringananList(admin.keringananList.map((k) => k.id === editId.value ? { ...k, label: editForm.label, mulai: editForm.mulai, akhir: editForm.akhir, hariTambahan: normalizeHariTambahan(editForm.hariTambahan), pokokTunggakan1: editForm.pokokTunggakan1, dendaTunggakan1: editForm.dendaTunggakan1, pokokTunggakan2: editForm.pokokTunggakan2, dendaTunggakan2: editForm.dendaTunggakan2, pokokTunggakan3: editForm.pokokTunggakan3, dendaTunggakan3: editForm.dendaTunggakan3, pokokTunggakan4: editForm.pokokTunggakan4, dendaTunggakan4: editForm.dendaTunggakan4 } : k))
    toast.success('Keringanan tersimpan'); editId.value = null
  } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
}
async function onDelete(id: string) {
  try { await deleteKeringanan(id); admin.setKeringananList(admin.keringananList.filter((k) => k.id !== id)); toast.success('Keringanan dihapus'); deleteId.value = null }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    toast.error(/permission/i.test(msg) ? 'Izin ditolak: token sesi tidak aktif (revoked/expired) atau rules Firestore belum di-deploy. Verifikasi ulang token.' : msg)
  }
}
const isRefreshingK = ref(false)
async function onRefreshK() {
  if (isRefreshingK.value) return
  isRefreshingK.value = true
  try {
    const ok = await refreshKeringanan()
    if (ok) toast.success('Keringanan disinkron dari Firestore')
    else toast.error('Sync gagal — periksa koneksi lalu coba lagi')
  } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
  finally { isRefreshingK.value = false }
}
</script>
