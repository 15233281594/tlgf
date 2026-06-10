import type { App } from 'vue'
import LoadingView from '../components/LoadingView.vue'

export function setupGlobalComponents(app: App) {
  app.component('AppLoading', LoadingView)
}
