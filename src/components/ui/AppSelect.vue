<template>
  <SelectRoot :model-value="modelValue" @update:model-value="onUpdate">
    <SelectTrigger
      :id="id"
      :aria-label="id ? undefined : placeholder"
      class="mt-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm transition-all outline-none hover:border-brand focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 data-[placeholder]:text-mu [&:not([data-placeholder])]:text-ink"
    >
      <SelectValue :placeholder="placeholder" class="truncate" />
      <SelectIcon as-child>
        <ChevronDown class="size-4 shrink-0 opacity-60" aria-hidden="true" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="z-50 max-h-72 w-[var(--reka-select-trigger-width)] min-w-32 overflow-hidden rounded-2xl border border-line bg-surface p-1 text-ink shadow-[var(--shadow-pop)] animate-popover"
      >
        <SelectViewport class="p-1">
          <SelectItem
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            class="relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-brand-soft focus-visible:bg-brand-soft data-[state=checked]:font-semibold"
          >
            <SelectItemText class="truncate">{{ opt.label }}</SelectItemText>
            <SelectItemIndicator class="ml-auto pl-2">
              <Check class="size-4 shrink-0" aria-hidden="true" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

export interface AppSelectOption {
  value: string
  label: string
}

withDefaults(
  defineProps<{
    modelValue: string
    options: AppSelectOption[]
    placeholder?: string
    id?: string
  }>(),
  { placeholder: 'Pilih…' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onUpdate(v: unknown) {
  if (typeof v === 'string') emit('update:modelValue', v)
}
</script>
