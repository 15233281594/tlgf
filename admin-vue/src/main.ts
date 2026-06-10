import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { setupAppPlugins } from "./plugins";

const app = createApp(App);

setupAppPlugins(app);

app.mount("#app");
