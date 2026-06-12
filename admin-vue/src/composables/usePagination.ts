import { computed, ref, watch, type Ref } from 'vue'

export function usePagination<T>(items: Readonly<Ref<T[]>>, initialPageSize = 10) {
  const page = ref(1)
  const pageSize = ref(initialPageSize)
  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const safePage = computed(() => Math.min(Math.max(page.value, 1), totalPages.value))
  const pagedItems = computed(() => {
    const start = (safePage.value - 1) * pageSize.value

    return items.value.slice(start, start + pageSize.value)
  })

  watch([total, pageSize], () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  })

  return {
    page,
    pageSize,
    total,
    pagedItems
  }
}
