<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const pageSizeOptions = [10, 20, 30, 50]

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const safePage = computed(() => Math.min(Math.max(props.page, 1), totalPages.value))
const startRecord = computed(() => (props.total ? (safePage.value - 1) * props.pageSize + 1 : 0))
const endRecord = computed(() => Math.min(safePage.value * props.pageSize, props.total))

const pageNumbers = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, safePage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  const normalizedStart = Math.max(1, end - 4)

  for (let page = normalizedStart; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

function changePage(page: number) {
  emit('update:page', Math.min(Math.max(page, 1), totalPages.value))
}

function changePageSize(event: Event) {
  const nextPageSize = Number((event.target as HTMLSelectElement).value)
  emit('update:pageSize', nextPageSize)
  emit('update:page', 1)
}
</script>

<template>
  <footer class="pagination-bar">
    <div class="pagination-meta">
      <span>共 {{ total }} 条</span>
      <span v-if="total">第 {{ startRecord }}-{{ endRecord }} 条</span>
    </div>

    <div class="pagination-controls">
      <label>
        每页
        <select :value="pageSize" @change="changePageSize">
          <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }} 条</option>
        </select>
      </label>

      <button type="button" :disabled="safePage <= 1" title="上一页" @click="changePage(safePage - 1)">
        <ChevronLeft :size="16" />
      </button>

      <button
        v-for="pageNumber in pageNumbers"
        :key="pageNumber"
        class="page-button"
        :class="{ active: pageNumber === safePage }"
        type="button"
        @click="changePage(pageNumber)"
      >
        {{ pageNumber }}
      </button>

      <button type="button" :disabled="safePage >= totalPages" title="下一页" @click="changePage(safePage + 1)">
        <ChevronRight :size="16" />
      </button>
    </div>
  </footer>
</template>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 16px;
  color: var(--muted);
  font-size: 13px;
}

.pagination-meta,
.pagination-controls,
.pagination-controls label,
.pagination-controls button {
  display: inline-flex;
  align-items: center;
}

.pagination-meta,
.pagination-controls {
  gap: 10px;
}

.pagination-controls {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.pagination-controls label {
  gap: 8px;
  font-weight: 800;
}

.pagination-controls select,
.pagination-controls button {
  min-height: 34px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: #344054;
  background: #fff;
}

.pagination-controls select {
  padding: 0 30px 0 10px;
  outline: none;
}

.pagination-controls button {
  min-width: 34px;
  justify-content: center;
  padding: 0 10px;
  font-weight: 800;
}

.pagination-controls button:hover:not(:disabled),
.pagination-controls button.active {
  border-color: rgba(216, 168, 77, 0.56);
  color: #7a5616;
  background: #fff8e8;
}

.pagination-controls button:disabled {
  color: #98a2b3;
  background: #f5f7fb;
}

@media (max-width: 720px) {
  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .pagination-controls {
    justify-content: flex-start;
  }
}
</style>
