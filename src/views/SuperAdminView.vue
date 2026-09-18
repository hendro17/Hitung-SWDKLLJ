<template>
  <AppBreadcrumb :crumbs="[{ label: 'Super Admin' }]" />
  <div class="mx-auto max-w-[30rem] p-4">
    <div class="mb-2"><RouterLink to="/" class="text-xs text-brand hover:underline">← Beranda</RouterLink></div>
    <h1 class="text-xl font-bold text-ink">Super Admin</h1>
    <p v-if="!store.loading && !store.user" class="mt-1 text-sm text-mu">Login untuk kelola token admin.</p>
    <p v-else-if="store.isSuperAdmin" class="mt-1 text-sm text-mu">Kelola token admin & override keringanan.</p>
    <p v-else-if="store.user" class="mt-1 text-sm text-danger">Akun bukan super admin (allowlist).</p>

    <div v-if="store.loading" class="mt-4 text-sm text-mu">Memuat...</div>

    <form v-else-if="!store.user" class="mt-4 space-y-3" @submit.prevent="onLogin">
      <div>
        <label for="sa-email" class="mb-1 block text-xs font-semibold text-ink">Email</label>
        <input id="sa-email" v-model="email" type="email" placeholder="Email" required class="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
      </div>
      <div>
        <label for="sa-password" class="mb-1 block text-xs font-semibold text-ink">Password</label>
        <input id="sa-password" v-model="password" type="password" placeholder="Password" required class="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
      </div>
      <button type="submit" :disabled="isLoggingIn" :aria-busy="isLoggingIn" class="w-full cursor-pointer rounded-2xl bg-brand-strong px-4 py-3 font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70"><span v-if="isLoggingIn" class="inline-flex items-center gap-2"><svg class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Masuk...</span><span v-else>Login</span></button>
      <p v-if="err" class="text-sm text-danger">{{ err }}</p>
    </form>

    <div v-else class="mt-4 space-y-6">
      <button type="button" class="cursor-pointer rounded-full border border-danger/50 bg-danger/5 px-4 py-2 text-sm font-medium text-danger transition-all hover:border-danger hover:bg-danger hover:text-white active:scale-95" @click="store.logout()">Logout ({{ store.user.email }})</button>

      <DataLoading v-if="isPageLoading" text="Memuat data admin dari Firestore..." />

      <div v-if="store.isSuperAdmin && !isPageLoading" class="space-y-4">
        <h2 class="font-semibold text-ink">Generate Token Admin</h2>
        <div class="space-y-3">
          <div>
            <label for="gen-label" class="mb-1 block text-xs font-semibold text-ink">Label admin</label>
            <input id="gen-label" v-model="genLabel" placeholder="Label admin (required) e.g. Admin Samsat Bandung — Budi" class="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" :class="genLabelInvalid ? 'border-danger ring-1 ring-danger' : ''" @input="genLabelInvalid = false" />
          </div>
          <div>
            <label for="gen-token" class="mb-1 block text-xs font-semibold text-ink">Token</label>
            <input id="gen-token" v-model="genToken" placeholder="Token sk-* (auto)" class="w-full rounded-2xl border border-line bg-surface px-4 py-3 font-mono text-sm outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" :class="genTokenInvalid ? 'border-danger ring-1 ring-danger' : ''" @input="genTokenInvalid = false" />
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <span class="mb-1 block text-xs font-semibold text-ink">Berlaku dari</span>
              <DatePicker v-model="genFrom" placeholder="Dari tanggal" />
            </div>
            <div class="flex-1">
              <span class="mb-1 block text-xs font-semibold text-ink">Berlaku sampai</span>
              <DatePicker v-model="genUntil" placeholder="Sampai tanggal" />
            </div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="cursor-pointer rounded-2xl border border-green-500/30 bg-green-100/70 px-4 py-2 text-sm font-medium text-green-800 ring-2 ring-green-500/30 transition-all hover:border-green-500/50 hover:bg-green-200/70 focus-visible:ring-green-500 active:scale-95" @click="genToken = generateRawToken()">Change Token</button>
            <button type="button" class="flex-1 cursor-pointer rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]" @click="onCreate">Buat Token</button>
          </div>
        </div>

        <h3 class="font-semibold text-ink">Daftar Token</h3>
        <button type="button" :disabled="isRefreshingT" class="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95 disabled:cursor-wait disabled:opacity-70" @click="onRefreshT"><span v-if="isRefreshingT" class="inline-flex items-center gap-1.5"><svg class="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Menyinkron...</span><span v-else>Reload Data</span></button>
        <ul class="space-y-3">
          <li v-for="t in tokens" :key="t.hash" class="rounded-2xl border border-line bg-surface p-4 text-sm shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
            <div class="flex items-start justify-between gap-2">
              <p class="font-semibold text-ink">{{ t.label }}</p>
              <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" :class="t.status === 'active' ? 'bg-green-100 text-green-800' : 'border border-line bg-surface text-mu'">{{ t.status }}</span>
            </div>
            <p class="mt-1 font-mono text-xs break-all text-mu">{{ t.hash.slice(0,16) }}… ({{ t.validFrom }} → {{ t.validUntil }})</p>
            <div class="mt-3 flex gap-2">
              <button type="button" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95" @click="copyRaw(t.tokenRaw)">Copy raw</button>
              <button v-if="t.status==='active'" type="button" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-danger transition-all hover:border-danger hover:bg-danger/10 active:scale-95" @click="onRevoke(t.hash)">Revoke</button>
              <button v-if="t.status!=='active'" type="button" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-danger transition-all hover:border-danger hover:bg-danger/10 active:scale-95" @click="deleteId = t.hash; deleteInput = ''">Hapus</button>
              <button v-else type="button" disabled title="Revoke dulu sebelum token bisa dihapus" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-danger transition-all hover:border-danger hover:bg-danger/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">Hapus</button>
            </div>
            <div v-if="deleteId===t.hash" class="mt-3 rounded-2xl border border-danger/40 bg-danger/5 p-3">
              <p class="text-xs text-ink">Token "{{ t.label }}" akan dihapus permanen. Ketik label token untuk konfirmasi:</p>
              <input v-model="deleteInput" type="text" placeholder="Ketik label token" class="mt-2 w-full rounded-2xl border border-line bg-surface px-3 py-2 text-sm outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
              <div class="mt-2 flex gap-2">
                <button type="button" :disabled="deleteInput!==t.label" class="flex-1 cursor-pointer rounded-2xl bg-danger px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50" @click="onDeleteToken(t.hash)">Hapus permanen</button>
                <button type="button" class="cursor-pointer rounded-2xl border border-line bg-surface px-4 py-2 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95" @click="deleteId = null">Batal</button>
              </div>
            </div>
          </li>
        </ul>

        <h3 class="font-semibold text-ink">Kelola Keringanan (semua admin)</h3>
        <p class="text-xs text-mu">Super admin bisa edit/hapus semua keringanan tanpa perlu token admin.</p>
        <div>
          <button type="button" :disabled="isRefreshingK" class="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95 disabled:cursor-wait disabled:opacity-70" @click="onRefreshK"><span v-if="isRefreshingK" class="inline-flex items-center gap-1.5"><svg class="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Menyinkron...</span><span v-else>Reload Data</span></button>
        </div>
        <ul class="space-y-3 text-sm">
          <li v-for="k in adminStore.keringananList" :key="k.id" class="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold text-ink">{{ k.label }} <span class="font-normal text-mu">({{ k.mulai }}→{{ k.akhir }})</span></p>
              <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">+{{ normalizeHariTambahan(k.hariTambahan) }}d</span>
              <span class="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-mu">admin {{ tokens.find(t => t.hash === k.createdBy)?.label ?? k.createdBy.slice(0,8) + '…' }}</span>
            </div>
            <p class="mt-1 text-xs text-mu">{{ flagsK(k) }}</p>
            <div class="mt-3 flex gap-2">
              <button type="button" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95" @click="startEditK(k)">Edit</button>
              <button type="button" class="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs text-danger transition-all hover:border-danger hover:bg-danger/10 active:scale-95" @click="onSADelete(k.id)">Hapus</button>
            </div>
            <div v-if="editId===k.id" class="mt-3 space-y-3 rounded-2xl bg-app p-3">
              <div>
                <label :for="'sa-edit-label-' + k.id" class="mb-1 block text-xs font-semibold text-ink">Label</label>
                <input :id="'sa-edit-label-' + k.id" v-model="editForm.label" class="w-full rounded-2xl border border-line bg-surface px-3 py-2 text-sm outline-none transition-all placeholder:text-mu/70 hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" :class="editLabelInvalid ? 'border-danger ring-1 ring-danger' : ''" @input="editLabelInvalid = false" />
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
                <label :for="'sa-edit-hari-' + k.id" class="mb-1 block text-xs font-semibold text-ink">Hari tambahan kebijakan (di atas 30 hari)</label>
                <input :id="'sa-edit-hari-' + k.id" v-model.number="editForm.hariTambahan" type="number" min="0" step="1" class="mt-1 w-full rounded-2xl border border-line bg-surface px-3 py-2 text-xs outline-none transition-all hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/30" />
              </div>
              <div class="flex gap-2">
                <button type="button" class="flex-1 cursor-pointer rounded-2xl bg-brand-strong px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]" @click="onSASave">Simpan</button>
                <button type="button" class="cursor-pointer rounded-2xl border border-line bg-surface px-4 py-2 text-xs text-ink transition-all hover:border-brand hover:text-brand active:scale-95" @click="editId=null">Batal</button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'
import DataLoading from '../components/DataLoading.vue'
import DatePicker from '../components/ui/DatePicker.vue'
import { useSuperAdminStore } from '../stores/superAdminStore'
import { generateRawToken, createAdminToken, listAdminTokens, revokeAdminToken, deleteAdminToken, type AdminTokenDoc } from '../services/adminTokenService'
import { useAdminStore } from '../stores/adminStore'
import { deleteKeringanan, updateKeringanan } from '../services/keringananService'
import { refreshKeringanan, awaitKeringanan } from '../composables/useKeringanan'
import { toast } from 'vue-sonner'
import type { KeringananDoc } from '../domain/keringanan'
import { normalizeHariTambahan } from '../domain/keringanan'

const store = useSuperAdminStore()
const adminStore = useAdminStore()
const email = ref(''); const password = ref(''); const err = ref(''); const isLoggingIn = ref(false)
const genLabel = ref(''); const genToken = ref(generateRawToken())
const genFrom = ref(new Date().toISOString().slice(0,10)); const genUntil = ref(new Date(Date.now()+30*864e5).toISOString().slice(0,10))
const genLabelInvalid = ref(false); const genTokenInvalid = ref(false); const editLabelInvalid = ref(false)
const tokens = ref<AdminTokenDoc[]>([])
const isPageLoading = ref(false)
const editId = ref<string | null>(null)
const deleteId = ref<string | null>(null)
const deleteInput = ref('')
const editForm = ref({ label: '', mulai: '', akhir: '', hariTambahan: 30, pokokTunggakan1: false, dendaTunggakan1: false, pokokTunggakan2: false, dendaTunggakan2: false, pokokTunggakan3: false, dendaTunggakan3: false, pokokTunggakan4: false, dendaTunggakan4: false })

onMounted(async () => { await store.initAuth(); if (store.isSuperAdmin) await waitInitialData() })

async function waitInitialData() {
  isPageLoading.value = true
  try { await Promise.all([loadList(), awaitKeringanan()]) } finally { isPageLoading.value = false }
}

async function onLogin() {
  err.value = ''
  isLoggingIn.value = true
  try { await store.login(email.value, password.value); await waitInitialData(); toast.success('Selamat datang, Super Admin!') } catch (e: unknown) { err.value = e instanceof Error ? e.message : String(e); toast.error(err.value) } finally { isLoggingIn.value = false }
}
async function loadList() {
  if (!store.isSuperAdmin) return
  try { tokens.value = await listAdminTokens() } catch {/* list failed — keep empty */}
}
const isRefreshingT = ref(false)
async function onRefreshT() {
  if (isRefreshingT.value) return
  isRefreshingT.value = true
  try { tokens.value = await listAdminTokens(); toast.success('Token disinkron dari Firestore') }
  catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
  finally { isRefreshingT.value = false }
}
async function onCreate() {
  genLabelInvalid.value = !genLabel.value.trim()
  genTokenInvalid.value = !genToken.value.trim()
  if (genLabelInvalid.value || genTokenInvalid.value) { toast.error('Form required'); return }
  if (!genToken.value.startsWith('sk-')) { genTokenInvalid.value = true; toast.error('Token harus sk-*'); return }
  try {
    await createAdminToken({ label: genLabel.value.trim(), raw: genToken.value.trim(), validFrom: genFrom.value || new Date().toISOString().slice(0,10), validUntil: genUntil.value || new Date(Date.now()+30*864e5).toISOString().slice(0,10), createdBy: store.user!.uid })
    toast.success('Token dibuat')
    genToken.value = generateRawToken(); await loadList()
  } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
}
async function copyRaw(raw: string) { await navigator.clipboard.writeText(raw); toast.success('Token copied!') }
async function onRevoke(hash: string) {
  try { await revokeAdminToken(hash); toast.success('Token revoked'); await loadList() }
  catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
}
async function onDeleteToken(hash: string) {
  const tok = tokens.value.find((x) => x.hash === hash)
  if (!tok || tok.status === 'active') { toast.error('Revoke dulu sebelum hapus'); return }
  try { await deleteAdminToken(hash); toast.success('Token dihapus'); deleteId.value = null; await loadList() }
  catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
}
function flagsK(k: KeringananDoc) { return ([1,2,3,4].flatMap((n) => [(k as unknown as Record<string, boolean>)[`pokokTunggakan${n}`] ? `P${n}` : null, (k as unknown as Record<string, boolean>)[`dendaTunggakan${n}`] ? `D${n}` : null]).filter(Boolean).join(' ') || '—') }
function startEditK(k: KeringananDoc) { editId.value = k.id; editLabelInvalid.value = false; editForm.value = { label: k.label, mulai: k.mulai, akhir: k.akhir, hariTambahan: normalizeHariTambahan(k.hariTambahan), pokokTunggakan1: k.pokokTunggakan1, dendaTunggakan1: k.dendaTunggakan1, pokokTunggakan2: k.pokokTunggakan2, dendaTunggakan2: k.dendaTunggakan2, pokokTunggakan3: k.pokokTunggakan3, dendaTunggakan3: k.dendaTunggakan3, pokokTunggakan4: k.pokokTunggakan4, dendaTunggakan4: k.dendaTunggakan4 } }
async function onSASave() {
  if (!editId.value) return
  editLabelInvalid.value = !editForm.value.label.trim()
  if (editLabelInvalid.value) { toast.error('Form required'); return }
  try {
    await updateKeringanan(editId.value, { label: editForm.value.label, mulai: editForm.value.mulai, akhir: editForm.value.akhir, hariTambahan: normalizeHariTambahan(editForm.value.hariTambahan), pokokTunggakan1: editForm.value.pokokTunggakan1, dendaTunggakan1: editForm.value.dendaTunggakan1, pokokTunggakan2: editForm.value.pokokTunggakan2, dendaTunggakan2: editForm.value.dendaTunggakan2, pokokTunggakan3: editForm.value.pokokTunggakan3, dendaTunggakan3: editForm.value.dendaTunggakan3, pokokTunggakan4: editForm.value.pokokTunggakan4, dendaTunggakan4: editForm.value.dendaTunggakan4, updatedBy: store.user?.uid ?? 'super-admin' } as unknown as Parameters<typeof updateKeringanan>[1])
    adminStore.setKeringananList(adminStore.keringananList.map((k) => k.id === editId.value ? { ...k, label: editForm.value.label, mulai: editForm.value.mulai, akhir: editForm.value.akhir, hariTambahan: normalizeHariTambahan(editForm.value.hariTambahan), pokokTunggakan1: editForm.value.pokokTunggakan1, dendaTunggakan1: editForm.value.dendaTunggakan1, pokokTunggakan2: editForm.value.pokokTunggakan2, dendaTunggakan2: editForm.value.dendaTunggakan2, pokokTunggakan3: editForm.value.pokokTunggakan3, dendaTunggakan3: editForm.value.dendaTunggakan3, pokokTunggakan4: editForm.value.pokokTunggakan4, dendaTunggakan4: editForm.value.dendaTunggakan4 } : k))
    toast.success('Keringanan tersimpan')
    editId.value = null
  } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
}
async function onSADelete(id: string) {
  try { await deleteKeringanan(id); adminStore.setKeringananList(adminStore.keringananList.filter((k) => k.id !== id)); toast.success('Keringanan dihapus') }
  catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)) }
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
