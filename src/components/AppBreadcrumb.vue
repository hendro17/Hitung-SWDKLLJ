<template>
  <nav aria-label="Breadcrumb" class="mx-auto max-w-[30rem] px-4 pt-3 text-xs text-mu">
    <ol class="flex items-center gap-1">
      <li><RouterLink to="/" class="hover:text-ink hover:underline">Beranda</RouterLink></li>
      <li v-for="(c,i) in crumbs" :key="i" class="flex items-center gap-1">
        <span>/</span>
        <RouterLink v-if="c.to" :to="c.to" class="hover:text-ink hover:underline">{{ c.label }}</RouterLink>
        <span v-else class="text-ink font-semibold">{{ c.label }}</span>
      </li>
    </ol>
  </nav>
</template>
<script setup lang="ts">
defineProps<{ crumbs: { label: string; to?: string }[] }>()
</script>
