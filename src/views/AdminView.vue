<template>
  <AppBreadcrumb :crumbs="[{ label: 'Admin' }]" />
  <div class="mx-auto max-w-[30rem] p-4">
    <div class="mb-2"><RouterLink to="/" class="text-xs text-brand hover:underline">← Beranda</RouterLink></div>
    <h1 class="text-xl font-bold text-ink">Admin — Setup Keringanan</h1>

    <!-- Token login -->
    <div v-if="!admin.isAuthenticated" class="mt-4 space-y-3">
      <p class="text-sm text-mu">Paste token sk-* untuk login.</p>
      <input v-model="tokenInput" placeholder="sk-..." class="w-full rounded-2xl border border-line px-4 py-3 font-mono text-sm" />
      <button type="button" class="w-full rounded-2xl bg-brand-strong px-4 py-3 font-semibold text-white" @click="onVerify">Verifikasi</button>
      <p v-if="err" class="text-sm text-danger">{{ err }}</p>
    </div>

    <div v-else class="mt-4 space-y-4">
      <p class="text-sm text-ink">Login sebagai {{ admin.sessionLabel }} <button type="button" class="ml-2 rounded-full border border-line px-3 py-1 text-xs" @click="admin.resetSession()">Logout</button></p>

      <div class="rounded-2xl border border-line p-4 space-y-3">
        <input v-model="form.label" placeholder="Label provisi required" class="w-full rounded-2xl border border-line px-3 py-2 text-sm" />
        <div class="flex gap-2">
          <input v-model="form.mulai" type="date" class="flex-1 rounded-2xl border border-line px-3 py-2 text-sm" />
          <input v-model="form.akhir" type="date" class="flex-1 rounded-2xl border border-line px-3 py-2 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <label v-for="k in 4" :key="'p'+k" class="flex items-center gap-2"><input type="checkbox" v-model="(form as unknown as Record<string, boolean>)[`pokokTunggakan${k}`]" /> Pokok {{ k }}</label>
          <label v-for="k in 4" :key="'d'+k" class="flex items-center gap-2"><input type="checkbox" v-model="(form as unknown as Record<string, boolean>)[`dendaTunggakan${k}`]" /> Denda {{ k }}</label>
        </div>
        <button type="button" class="w-full rounded-2xl bg-brand-strong px-4 py-3 text-sm font-semibold text-white" :disabled="!form.label" @click="onSave">Simpan Keringanan</button>
        <p v-if="saveMsg" class="text-sm" :class="saveErr ? 'text-danger' : 'text-green-700'">{{ saveMsg }}</p>
      </div>

      <h3 class="font-semibold text-ink">Keringanan milik saya</h3>
      <ul class="space-y-2 text-sm">
        <li v-for="k in myList" :key="k.id" class="rounded-2xl border border-line p-3">
          <p class="font-semibold">{{ k.label }} ({{ k.mulai }}→{{ k.akhir }})</p>
          <p class="text-xs text-mu">{{ flags(k) }}</p>
          <div class="mt-2 flex gap-2">
            <button type="button" class="rounded-full border border-line px-3 py-1 text-xs" @click="startEdit(k)">Edit</button>
            <button type="button" class="rounded-full border border-line px-3 py-1 text-xs text-danger" @click="onDelete(k.id)">Hapus</button>
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
              <button type="button" class="flex-1 rounded-2xl bg-brand-strong px-4 py-2 text-xs font-semibold text-white" @click="onUpdate">Simpan</button>
              <button type="button" class="rounded-2xl border border-line px-4 py-2 text-xs" @click="editId=null">Batal</button>
            </div>
            <p v-if="saveMsg" class="text-xs" :class="saveErr ? 'text-danger' : 'text-green-700'">{{ saveMsg }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'
import { useAdminStore } from '../stores/adminStore'
import { verifyAdminToken } from '../services/adminTokenService'
import { upsertKeringanan, deleteKeringanan, updateKeringanan } from '../services/keringananService'
import { sha256Hex } from '../services/firebase'
import type { KeringananDoc } from '../domain/keringanan'

const admin = useAdminStore()
const tokenInput = ref(''); const err = ref('')
const form = reactive({ label: '', mulai: '', akhir: '', pokokTunggakan1: false, dendaTunggakan1: false, pokokTunggakan2: false, dendaTunggakan2: false, pokokTunggakan3: false, dendaTunggakan3: false, pokokTunggakan4: false, dendaTunggakan4: false })
const saveMsg = ref(''); const saveErr = ref(false)

const myList = computed(() => admin.keringananList.filter((k) => k.createdBy === admin.sessionHash))
const editId = ref<string | null>(null)
const editForm = reactive({ label: '', mulai: '', akhir: '', pokokTunggakan1: false, dendaTunggakan1: false, pokokTunggakan2: false, dendaTunggakan2: false, pokokTunggakan3: false, dendaTunggakan3: false, pokokTunggakan4: false, dendaTunggakan4: false })

function flags(k: KeringananDoc) { return [1,2,3,4].flatMap((n) => [(k as unknown as Record<string, boolean>)[`pokokTunggakan${n}`] ? `P${n}` : null, (k as unknown as Record<string, boolean>)[`dendaTunggakan${n}`] ? `D${n}` : null]).filter(Boolean).join(' ') || '—' }

async function onVerify() {
  err.value = ''
  const raw = tokenInput.value.trim()
  if (!raw.startsWith('sk-')) { err.value = 'Token harus sk-*'; return }
  try {
    const { valid, doc } = await verifyAdminToken(raw)
    if (!valid || !doc) { err.value = 'Token tidak valid / expired / revoked'; return }
    const hash = await sha256Hex(raw)
    admin.setSession(hash, doc.validUntil, doc.label)
  } catch (e: unknown) { err.value = e instanceof Error ? e.message : String(e) }
}

async function onSave() {
  saveMsg.value = ''; saveErr.value = false
  if (!form.label.trim()) { saveMsg.value = 'Label required'; saveErr.value = true; return }
  try {
    await upsertKeringanan({ id: crypto.randomUUID(), label: form.label.trim(), mulai: form.mulai || new Date().toISOString().slice(0,10), akhir: form.akhir || new Date(Date.now()+30*864e5).toISOString().slice(0,10), pokokTunggakan1: form.pokokTunggakan1, dendaTunggakan1: form.dendaTunggakan1, pokokTunggakan2: form.pokokTunggakan2, dendaTunggakan2: form.dendaTunggakan2, pokokTunggakan3: form.pokokTunggakan3, dendaTunggakan3: form.dendaTunggakan3, pokokTunggakan4: form.pokokTunggakan4, dendaTunggakan4: form.dendaTunggakan4, createdBy: admin.sessionHash! })
    saveMsg.value = 'Tersimpan'
  } catch (e: unknown) { saveMsg.value = e instanceof Error ? e.message : String(e); saveErr.value = true }
}

function startEdit(k: KeringananDoc) { editId.value = k.id; Object.assign(editForm, { label: k.label, mulai: k.mulai, akhir: k.akhir, pokokTunggakan1: k.pokokTunggakan1, dendaTunggakan1: k.dendaTunggakan1, pokokTunggakan2: k.pokokTunggakan2, dendaTunggakan2: k.dendaTunggakan2, pokokTunggakan3: k.pokokTunggakan3, dendaTunggakan3: k.dendaTunggakan3, pokokTunggakan4: k.pokokTunggakan4, dendaTunggakan4: k.dendaTunggakan4 }) }
async function onUpdate() {
  if (!editId.value) return
  saveMsg.value = ''; saveErr.value = false
  try {
    await updateKeringanan(editId.value, { label: editForm.label, mulai: editForm.mulai, akhir: editForm.akhir, pokokTunggakan1: editForm.pokokTunggakan1, dendaTunggakan1: editForm.dendaTunggakan1, pokokTunggakan2: editForm.pokokTunggakan2, dendaTunggakan2: editForm.dendaTunggakan2, pokokTunggakan3: editForm.pokokTunggakan3, dendaTunggakan3: editForm.dendaTunggakan3, pokokTunggakan4: editForm.pokokTunggakan4, dendaTunggakan4: editForm.dendaTunggakan4, updatedBy: admin.sessionHash! } as unknown as Parameters<typeof updateKeringanan>[1])
    saveMsg.value = 'Tersimpan'; editId.value = null
  } catch (e: unknown) { saveMsg.value = e instanceof Error ? e.message : String(e); saveErr.value = true }
}
async function onDelete(id: string) { await deleteKeringanan(id) }
</script>
