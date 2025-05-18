import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { tokenRefresher } from './utils/tokenRefresher'
import { sessionKeepAlive } from './utils/sessionKeepAlive'

// Initialize the token refresher service to prevent random logouts
tokenRefresher.init();

// Start session keep-alive to prevent session loss
sessionKeepAlive.start();

// Create and mount Vue app
createApp(App).use(store).use(router).mount('#app')
