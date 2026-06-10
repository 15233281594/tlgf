import type { App } from 'vue'

export function setupErrorHandler(app: App) {
  app.config.errorHandler = (error, _instance, info) => {
    console.error('[TLGF Admin Error]', {
      error,
      info
    })
  }
}
