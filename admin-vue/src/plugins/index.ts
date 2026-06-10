import type { App } from 'vue'
import { router } from '../router'
import { setupDirectives } from './directives'
import { setupErrorHandler } from './errorHandler'
import { setupGlobalComponents } from './globalComponents'

export function setupAppPlugins(app: App) {
  app.use(router)
  setupGlobalComponents(app)
  setupDirectives(app)
  setupErrorHandler(app)
}
