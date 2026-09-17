<script setup lang="ts">
import { ref, provide } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import { Toaster } from 'vue-sonner'
import { useKeringanan } from './composables/useKeringanan'

const sidebarOpen = ref(false)
provide('sidebarOpen', sidebarOpen)
useKeringanan()
function openSidebar() { sidebarOpen.value = true }
provide('openSidebar', openSidebar)
</script>

<template>
  <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
  <RouterView />
  <Toaster position="bottom-right" richColors />
</template>
