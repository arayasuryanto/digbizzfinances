import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { tokenRefresher } from './utils/tokenRefresher'

// Initialize the token refresher service to prevent random logouts
tokenRefresher.init();

// Create and mount Vue app
createApp(App).use(store).use(router).mount('#app')
