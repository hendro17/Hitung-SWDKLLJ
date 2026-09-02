<template>
  <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
  <RouterView />
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import { useKeringanan } from './composables/useKeringanan'

const sidebarOpen = ref(false)
provide('sidebarOpen', sidebarOpen)
useKeringanan()
function openSidebar() { sidebarOpen.value = true }
provide('openSidebar', openSidebar)
</script>
