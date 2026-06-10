import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'

function requestInterceptor(config: InternalAxiosRequestConfig) {
  if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
}

function requestErrorInterceptor(error: AxiosError) {
  return Promise.reject(error)
}

function responseInterceptor(response: AxiosResponse) {
  return response
}

function responseErrorInterceptor(error: AxiosError) {
  return Promise.reject(error)
}

export function setupHttpInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
  instance.interceptors.response.use(responseInterceptor, responseErrorInterceptor)
}
