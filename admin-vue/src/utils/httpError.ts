import axios from 'axios'

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || '请求失败'
  }

  return error instanceof Error ? error.message : '请求失败'
}
