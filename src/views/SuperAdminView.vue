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
      <input v-model="email" type="email" placeholder="Email" required class="w-full rounded-2xl border border-line px-4 py-3" />
      <input v-model="password" type="password" placeholder="Password" required class="w-full rounded-2xl border border-line px-4 py-3" />
      <button type="submit" class="w-full rounded-2xl bg-brand-strong px-4 py-3 font-semibold text-white">Login</button>
      <p v-if="err" class="text-sm text-danger">{{ err }}</p>
    </form>

    <div v-else class="mt-4 space-y-6">
      <button type="button" class="rounded-full border border-line px-4 py-2 text-sm" @click="store.logout()">Logout ({{ store.user.email }})</button>

      <div v-if="store.isSuperAdmin" class="space-y-4">
        <h2 class="font-semibold text-ink">Generate Token Admin</h2>
        <div class="space-y-2">
          <input v-model="genLabel" placeholder="Label admin (required) e.g. Admin Samsat Bandung — Budi" class="w-full rounded-2xl border border-line px-4 py-3 text-sm" />
          <input v-model="genToken" placeholder="Token sk-* (auto)" class="w-full rounded-2xl border border-line px-4 py-3 font-mono text-sm" />
          <div class="flex gap-2">
            <input v-model="genFrom" type="date" class="flex-1 rounded-2xl border border-line px-3 py-2 text-sm" />
            <input v-model="genUntil" type="date" class="flex-1 rounded-2xl border border-line px-3 py-2 text-sm" />
          </div>
          <div class="flex gap-2">
            <button type="button" class="rounded-2xl border border-line px-4 py-2 text-sm" @click="genToken = generateRawToken()">Random sk-*</button>
            <button type="button" class="flex-1 rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white" :disabled="!genLabel || !genToken" @click="onCreate">Buat Token</button>
          </div>
          <p v-if="genErr" class="text-sm text-danger">{{ genErr }}</p>
          <p v-if="genOk" class="text-sm text-green-700">{{ genOk }}</p>
        </div>

        <h3 class="font-semibold text-ink">Daftar Token</h3>
        <button type="button" class="rounded-full border border-line px-4 py-2 text-xs" @click="loadList">Muat ulang</button>
        <ul class="space-y-2">
          <li v-for="t in tokens" :key="t.hash" class="rounded-2xl border border-line p-3 text-sm">
            <p class="font-semibold">{{ t.label }} — {{ t.status }}</p>
            <p class="font-mono text-xs break-all">{{ t.hash.slice(0,16) }}… ({{ t.validFrom }} → {{ t.validUntil }})</p>
            <div class="mt-2 flex gap-2">
              <button type="button" class="rounded-full bg-surface border border-line px-3 py-1 text-xs" @click="copyRaw(t.tokenRaw)">Copy raw</button>
              <button v-if="t.status==='active'" type="button" class="rounded-full border border-line px-3 py-1 text-xs text-danger" @click="onRevoke(t.hash)">Revoke</button>
            </div>
          </li>
        </ul>

        <h3 class="font-semibold text-ink">Kelola Keringanan (semua admin)</h3>
        <p class="text-xs text-mu">Super admin bisa edit/hapus semua keringanan tanpa perlu token admin.</p>
        <ul class="space-y-2 text-sm">
          <li v-for="k in adminStore.keringananList" :key="k.id" class="rounded-2xl border border-line p-3">
            <p class="font-semibold">{{ k.label }} ({{ k.mulai }}→{{ k.akhir }}) <span class="text-xs font-normal text-mu">owner {{ k.createdBy.slice(0,8) }}…</span></p>
            <p class="text-xs text-mu">{{ flagsK(k) }}</p>
            <div class="mt-2 flex gap-2">
              <button type="button" class="rounded-full border border-line px-3 py-1 text-xs" @click="startEditK(k)">Edit</button>
              <button type="button" class="rounded-full border border-line px-3 py-1 text-xs text-danger" @click="onSADelete(k.id)">Hapus</button>
            </div>
            <div v-if="editId===k.id" class="mt-3 space-y-2 rounded-2xl bg-app p-3">
              <input v-model="editForm.label" class="w-full rounded-2xl border border-line px-3 py-2 text-sm" />
              <div class="flex gap-2">
                <input v-model="editForm.mulai" type="date" class="flex-1 rounded-2xl border border-line px-3 py-2 text-sm" />
                <input v-model="editForm.akhir" type="date" class="flex-1 rounded-2xl border border-line px-3 py-2 text-sm" />
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <label v-for="n in 4" :key="'ep'+n" class="flex items-center gap-2"><input type="checkbox" v-model="(editForm as unknown as Record<string, boolean>)[`pokokTunggakan${n}`]" /> Pokok {{ n }}</label>
                <label v-for="n in 4" :key="'ed'+n" class="flex items-center gap-2"><input type="checkbox" v-model="(editForm as unknown as Record<string, boolean>)[`dendaTunggakan${n}`]" /> Denda {{ n }}</label>
              </div>
              <div class="flex gap-2">
                <button type="button" class="flex-1 rounded-2xl bg-brand-strong px-4 py-2 text-xs font-semibold text-white" @click="onSASave">Simpan</button>
                <button type="button" class="rounded-2xl border border-line px-4 py-2 text-xs" @click="editId=null">Batal</button>
              </div>
              <p v-if="editErr" class="text-xs text-danger">{{ editErr }}</p>
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
import { useSuperAdminStore } from '../stores/superAdminStore'
import { generateRawToken, createAdminToken, listAdminTokens, revokeAdminToken, type AdminTokenDoc } from '../services/adminTokenService'
import { useAdminStore } from '../stores/adminStore'
import { deleteKeringanan, updateKeringanan } from '../services/keringananService'
import type { KeringananDoc } from '../domain/keringanan'

const store = useSuperAdminStore()
const adminStore = useAdminStore()
const email = ref(''); const password = ref(''); const err = ref('')
const genLabel = ref(''); const genToken = ref(generateRawToken())
const genFrom = ref(''); const genUntil = ref('')
const genErr = ref(''); const genOk = ref('')
const tokens = ref<AdminTokenDoc[]>([])
const editId = ref<string | null>(null)
const editForm = ref({ label: '', mulai: '', akhir: '', pokokTunggakan1: false, dendaTunggakan1: false, pokokTunggakan2: false, dendaTunggakan2: false, pokokTunggakan3: false, dendaTunggakan3: false, pokokTunggakan4: false, dendaTunggakan4: false })
const editErr = ref('')

onMounted(() => { store.initAuth(); loadList() })

async function onLogin() {
  err.value = ''
  try { await store.login(email.value, password.value); await loadList() } catch (e: unknown) { err.value = e instanceof Error ? e.message : String(e) }
}
async function loadList() {
  if (!store.isSuperAdmin) return
  try { tokens.value = await listAdminTokens() } catch {/* list failed — keep empty */}
}
async function onCreate() {
  genErr.value = ''; genOk.value = ''
  if (!genLabel.value.trim()) { genErr.value = 'Label required'; return }
  if (!genToken.value.startsWith('sk-')) { genErr.value = 'Token harus sk-*'; return }
  try {
    await createAdminToken({ label: genLabel.value.trim(), raw: genToken.value.trim(), validFrom: genFrom.value || new Date().toISOString().slice(0,10), validUntil: genUntil.value || new Date(Date.now()+30*864e5).toISOString().slice(0,10), createdBy: store.user!.uid })
    genOk.value = 'Token dibuat'; genToken.value = generateRawToken(); await loadList()
  } catch (e: unknown) { genErr.value = e instanceof Error ? e.message : String(e) }
}
async function copyRaw(raw: string) { await navigator.clipboard.writeText(raw) }
async function onRevoke(hash: string) { await revokeAdminToken(hash); await loadList() }
function flagsK(k: KeringananDoc) { return ([1,2,3,4].flatMap((n) => [(k as unknown as Record<string, boolean>)[`pokokTunggakan${n}`] ? `P${n}` : null, (k as unknown as Record<string, boolean>)[`dendaTunggakan${n}`] ? `D${n}` : null]).filter(Boolean).join(' ') || '—') }
function startEditK(k: KeringananDoc) { editId.value = k.id; editForm.value = { label: k.label, mulai: k.mulai, akhir: k.akhir, pokokTunggakan1: k.pokokTunggakan1, dendaTunggakan1: k.dendaTunggakan1, pokokTunggakan2: k.pokokTunggakan2, dendaTunggakan2: k.dendaTunggakan2, pokokTunggakan3: k.pokokTunggakan3, dendaTunggakan3: k.dendaTunggakan3, pokokTunggakan4: k.pokokTunggakan4, dendaTunggakan4: k.dendaTunggakan4 }; editErr.value = '' }
async function onSASave() {
  if (!editId.value) return
  editErr.value = ''
  try {
    await updateKeringanan(editId.value, { label: editForm.value.label, mulai: editForm.value.mulai, akhir: editForm.value.akhir, pokokTunggakan1: editForm.value.pokokTunggakan1, dendaTunggakan1: editForm.value.dendaTunggakan1, pokokTunggakan2: editForm.value.pokokTunggakan2, dendaTunggakan2: editForm.value.dendaTunggakan2, pokokTunggakan3: editForm.value.pokokTunggakan3, dendaTunggakan3: editForm.value.dendaTunggakan3, pokokTunggakan4: editForm.value.pokokTunggakan4, dendaTunggakan4: editForm.value.dendaTunggakan4, updatedBy: store.user?.uid ?? 'super-admin' } as unknown as Parameters<typeof updateKeringanan>[1])
    editId.value = null
  } catch (e: unknown) { editErr.value = e instanceof Error ? e.message : String(e) }
}
async function onSADelete(id: string) { await deleteKeringanan(id) }
</script>
