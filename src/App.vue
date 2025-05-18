<template>
  <div class="app-container">
    <header v-if="isAuthenticated">
      <div class="logo-container">
        <h1 class="logo">
          <img src="/logo.png" alt="Digbizz Logo" class="logo-image"/>
        </h1>
      </div>
      <nav>
        <router-link to="/" class="nav-link">Beranda</router-link>
        <router-link to="/conversation" class="nav-link">Percakapan</router-link>
        <router-link to="/reports" class="nav-link">Laporan</router-link>
        <router-link to="/settings" class="nav-link">Pengaturan</router-link>
        <button @click="logout" class="logout-button">Keluar</button>
      </nav>
    </header>
    <main :class="{ 'auth-layout': !isAuthenticated }">
      <router-view />
    </main>
    <footer v-if="isAuthenticated">
      <p>© {{ currentYear }} Digbizz UMKM Doctor - Asisten Keuangan Konversasional Anda</p>
    </footer>
    
    <!-- AI Assistant Chat (only shown when authenticated) -->
    <AiAssistant v-if="isAuthenticated" />
    
    <!-- Network status indicator -->
    <NetworkStatus />
  </div>
</template>

<script>
import AiAssistant from './components/AiAssistant.vue';
import NetworkStatus from './components/NetworkStatus.vue';

export default {
  name: 'App',
  components: {
    AiAssistant,
    NetworkStatus
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.auth.isAuthenticated;
    },
    currentYear() {
      return new Date().getFullYear();
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('logout');
      this.$router.push('/login');
    }
  },
  created() {
    // Initialize the app and verify authentication status
    this.$store.dispatch('initializeApp');
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #FFD700; /* Warm yellow */
  --primary-dark: #E6B800; /* Darker yellow for hover states */
  --white: #FFFFFF;
  --light-gray: #F8F9FA;
  --text-dark: #343A40;
  --text-gray: #6C757D;
  --border-color: #E9ECEF;
  --income-color: #28A745;
  --expense-color: #DC3545;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-dark);
  background-color: var(--light-gray);
  height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: var(--primary-color);
  color: var(--text-dark);
  padding: 0.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-height: 90px;
}

.logo-container {
  display: flex;
  align-items: center;
  height: 90px;
  padding: 3px 0;
  margin-left: 120px;
  overflow: visible;
  position: relative;
}

.logo {
  margin: 0;
  height: 90px;
  display: flex;
  align-items: center;
  margin-right: 20px;
  color: var(--text-dark);
  position: relative;
}

.logo-image {
  height: 100px;
  width: auto;
  object-fit: contain;
  max-width: 100%;
  transition: transform 0.3s ease;
  position: relative;
  top: -5px;
}

.logo-image:hover {
  transform: scale(1.05);
}

.logo-text {
  font-size: 1.8rem;
  font-weight: bold;
}

nav {
  display: flex;
  gap: 1rem;
  margin-right: 10px;
  align-items: center;
}

.nav-link {
  color: var(--text-dark);
  text-decoration: none;
  padding: 0.7rem 1.4rem;
  border-radius: 0.5rem;
  transition: all 0.3s;
  font-weight: 500;
  font-size: 1.05rem;
  margin-left: 0.5rem;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
}

.router-link-active {
  background-color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logout-button {
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--text-dark);
  border: none;
  border-radius: 0.5rem;
  padding: 0.7rem 1.4rem;
  font-weight: 500;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 0.5rem;
}

.logout-button:hover {
  background-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
}

main {
  flex: 1;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

main.auth-layout {
  max-width: 100%;
  padding: 0;
}

footer {
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-gray);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

/* Global button styles */
button {
  background-color: var(--primary-color);
  color: var(--text-dark);
  border: none;
  font-weight: 500;
}

button:hover {
  background-color: var(--primary-dark);
}

/* Responsive styles */
@media (max-width: 768px) {
  header {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    min-height: auto;
  }
  
  .logo-container {
    margin-left: 0;
    height: 70px;
    justify-content: center;
  }
  
  .logo {
    height: 70px;
    justify-content: center;
    margin-right: 0;
  }
  
  .logo-image {
    height: 70px;
    top: 0;
  }
  
  nav {
    width: 100%;
    justify-content: center;
    margin-right: 0;
    margin-top: 5px;
    flex-wrap: wrap;
  }
  
  .nav-link, .logout-button {
    padding: 0.65rem 1.15rem;
    font-size: 1rem;
    margin: 0 0.25rem 0.25rem 0.25rem;
  }
  
  main {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  header {
    padding: 0.5rem;
  }
  
  .logo-container {
    height: 60px;
  }
  
  .logo {
    height: 60px;
  }
  
  .logo-image {
    height: 60px;
  }
  
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
  }
  
  .nav-link, .logout-button {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
    margin: 0.15rem;
    flex: 0 0 auto;
    min-width: 80px;
    text-align: center;
  }
  
  main {
    padding: 0.5rem;
  }
  
  footer {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
}
@media (max-width: 360px) {
  .nav-link, .logout-button {
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
    min-width: 70px;
  }
  
  .logo-container {
    height: 50px;
  }
  
  .logo {
    height: 50px;
  }
  
  .logo-image {
    height: 50px;
  }
}
</style>