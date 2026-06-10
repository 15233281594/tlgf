import axios from 'axios'
import { env } from '../config/env'
import { getApiErrorMessage } from './httpError'
import { setupHttpInterceptors } from './httpInterceptors'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  withCredentials: true
})

setupHttpInterceptors(apiClient)

export async function request<T>(promise: Promise<{ data: T }>) {
  try {
    const response = await promise
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
