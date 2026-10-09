import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia()) // 状态管理：Pinia
app.use(router) // 路由：vue-router

app.mount('#app')
