<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button type="button" :id="id" :class="cn(buttonVariants({ empty: !modelValue }))">
        <span class="truncate">{{ displayText }}</span>
        <CalendarIcon class="size-4 shrink-0 opacity-60" aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        side="bottom"
        align="start"
        class="z-50 w-auto rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-pop)] animate-popover"
      >
        <CalendarRoot
          v-slot="{ grid, weekDays }"
          v-model="calValue"
          v-model:placeholder="placeholderBinding"
          weekday-format="short"
          locale="id-ID"
          class="select-none"
        >
          <CalendarHeader class="flex items-center gap-1">
            <CalendarPrev
              class="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-brand-soft active:scale-95"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft class="size-4" aria-hidden="true" />
            </CalendarPrev>
            <SelectRoot :model-value="selMonth" @update:model-value="onMonthUpdate">
              <SelectTrigger
                aria-label="Pilih bulan"
                class="flex h-8 min-w-0 flex-1 cursor-pointer items-center justify-between gap-1 rounded-xl border border-line bg-surface px-2 text-sm text-ink outline-none transition-all hover:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                <SelectValue class="truncate" />
                <ChevronDown class="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
              </SelectTrigger>
              <SelectPortal>
                <SelectContent
                  position="popper"
                  :side-offset="4"
                  class="z-50 max-h-60 w-[var(--reka-select-trigger-width)] min-w-32 overflow-hidden rounded-xl border border-line bg-surface p-1 text-ink shadow-[var(--shadow-pop)] animate-popover"
                >
                  <SelectViewport class="p-1">
                    <SelectItem
                      v-for="opt in monthOptions"
                      :key="opt.value"
                      :value="opt.value"
                      class="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-brand-soft focus-visible:bg-brand-soft data-[state=checked]:font-semibold"
                    >
                      <SelectItemText class="truncate">{{ opt.label }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
            <SelectRoot :model-value="selYear" @update:model-value="onYearUpdate">
              <SelectTrigger
                aria-label="Pilih tahun"
                class="flex h-8 w-20 flex-none cursor-pointer items-center justify-between gap-1 rounded-xl border border-line bg-surface px-2 text-sm text-ink outline-none transition-all hover:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                <SelectValue class="truncate" />
                <ChevronDown class="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
              </SelectTrigger>
              <SelectPortal>
                <SelectContent
                  position="popper"
                  :side-offset="4"
                  class="z-50 max-h-60 w-[var(--reka-select-trigger-width)] min-w-20 overflow-hidden rounded-xl border border-line bg-surface p-1 text-ink shadow-[var(--shadow-pop)] animate-popover"
                >
                  <SelectViewport class="p-1">
                    <SelectItem
                      v-for="opt in yearOptions"
                      :key="opt.value"
                      :value="opt.value"
                      class="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-brand-soft focus-visible:bg-brand-soft data-[state=checked]:font-semibold"
                    >
                      <SelectItemText class="truncate">{{ opt.label }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
            <CalendarNext
              class="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-brand-soft active:scale-95"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight class="size-4" aria-hidden="true" />
            </CalendarNext>
          </CalendarHeader>
          <div class="mt-2 flex flex-col gap-4">
            <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse">
              <CalendarGridHead>
                <CalendarGridRow class="flex">
                  <CalendarHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="w-8 rounded-md text-center text-xs font-medium text-mu"
                  >
                    {{ day }}
                  </CalendarHeadCell>
                </CalendarGridRow>
              </CalendarGridHead>
              <CalendarGridBody>
                <CalendarGridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="`minggu-${index}`"
                  class="flex"
                >
                  <CalendarCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                    class="p-0 text-center"
                  >
                    <CalendarCellTrigger
                      :day="weekDate"
                      :month="month.value"
                      class="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-sm transition-all outline-none hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-95 data-[selected]:bg-brand-strong data-[selected]:font-semibold data-[selected]:text-white data-[selected]:hover:bg-brand-strong data-[disabled]:pointer-events-none data-[disabled]:opacity-30 data-[outside-view]:opacity-40 data-[today]:font-bold data-[today]:underline data-[today]:decoration-brand data-[today]:underline-offset-4"
                    />
                  </CalendarCell>
                </CalendarGridRow>
              </CalendarGridBody>
            </CalendarGrid>
          </div>
        </CalendarRoot>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { cva } from 'class-variance-authority'
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import {
  CalendarDate,
  type DateValue,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date'
import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    id?: string
  }>(),
  { placeholder: 'Pilih tanggal' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

// Tampil "17 September 2026", value tetap YYYY-MM-DD.
const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder
  try {
    const d = parseDate(props.modelValue).toDate(getLocalTimeZone())
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  } catch {
    return props.modelValue
  }
})

const buttonVariants = cva(
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-surface px-3 py-2 text-sm transition-all outline-none hover:border-brand focus:border-brand focus:ring-2 focus:ring-brand/30 active:scale-[0.99]',
  {
    variants: {
      empty: {
        true: 'border-line text-mu',
        false: 'border-line text-ink',
      },
    },
    defaultVariants: { empty: true },
  },
)

function toCalendarDate(v: string): CalendarDate | undefined {
  if (!v) return undefined
  try {
    return parseDate(v)
  } catch {
    return undefined
  }
}

const calValue = computed<CalendarDate | undefined>({
  get: () => toCalendarDate(props.modelValue),
  set: (v) => {
    if (v instanceof CalendarDate) {
      emit('update:modelValue', v.toString())
      open.value = false
    }
  },
})

// Placeholder = bulan yang sedang ditampilkan kalender. Select bulan/tahun
// menggeser placeholder sehingga lompat tahun cepat (pola shadcn-vue
// `layout="month-and-year"` yang belum ada di reka-ui versi ini).
function toPlainDate(v: DateValue): CalendarDate {
  return new CalendarDate(v.year, v.month, v.day)
}

const placeholder = ref<CalendarDate>(
  toCalendarDate(props.modelValue) ?? toPlainDate(today(getLocalTimeZone())),
)

// Two-way binding kalender: select bulan/tahun menulis ke sini, navigasi
// panah di dalam kalender juga menulis balik lewat v-model:placeholder —
// cast `as DateValue` hanya untuk memuaskan inferensi prop generik reka-ui.
const placeholderBinding = computed({
  get: () => placeholder.value as DateValue,
  set: (v: DateValue) => {
    placeholder.value = toPlainDate(v)
  },
})

const monthOptions = computed(() => {
  const base = placeholder.value.set({ day: 1 })
  const fmt = new Intl.DateTimeFormat('id-ID', { month: 'long' })
  return Array.from({ length: 12 }, (_, i) => {
    const d = base.set({ month: i + 1 })
    return { value: String(d.month), label: fmt.format(d.toDate(getLocalTimeZone())) }
  })
})

const yearOptions = computed(() => {
  const cur = placeholder.value.year
  const start = cur - 100
  const end = cur + 20
  const out: { value: string; label: string }[] = []
  for (let y = end; y >= start; y--) out.push({ value: String(y), label: String(y) })
  return out
})

const selMonth = computed(() => String(placeholder.value.month))
const selYear = computed(() => String(placeholder.value.year))

function onMonthUpdate(v: unknown) {
  if (typeof v !== 'string') return
  placeholder.value = placeholder.value.set({ month: Number(v) })
}

function onYearUpdate(v: unknown) {
  if (typeof v !== 'string') return
  placeholder.value = placeholder.value.set({ year: Number(v) })
}

</script>
