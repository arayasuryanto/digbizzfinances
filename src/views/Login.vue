<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-section">
        <img src="/logo.png" alt="Logo" class="auth-logo"/>
      </div>
      
      <h2>Masuk ke Akun Anda</h2>
      
      <form @submit.prevent="login" class="auth-form">
        <div class="form-group">
          <label for="phone">Nomor Telepon</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="phone" 
            placeholder="Masukkan nomor telepon Anda"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">Kata Sandi</label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              placeholder="Masukkan kata sandi"
              required
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Sembunyikan' : 'Tampilkan' }}
            </button>
          </div>
        </div>
        
        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe"/>
            <label for="remember">Ingat saya</label>
          </div>
          <router-link to="/forgot-password" class="forgot-password">
            Lupa kata sandi?
          </router-link>
        </div>
        
        <button type="submit" class="auth-button" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Masuk</span>
        </button>
      </form>
      
      <div class="auth-divider">
        <span>atau</span>
      </div>
      
      <div class="social-auth-container">
        <button class="social-auth-button">
          <span class="google-icon">G</span>
          Masuk dengan Google
        </button>
      </div>
      
      <div class="auth-footer">
        Belum memiliki akun? 
        <router-link to="/signup" class="auth-link">Daftar</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      phone: '',
      password: '',
      rememberMe: false,
      showPassword: false,
      isLoading: false
    }
  },
  methods: {
    async login() {
      // Basic validation
      if (!this.phone) {
        alert('Please enter your phone number');
        return;
      }
      
      if (!this.password) {
        alert('Please enter your password');
        return;
      }
      
      this.isLoading = true;
      
      try {
        console.log('Starting login process');
        
        // Clear any existing auth data to prevent conflicts
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Use Vuex store action to login
        const response = await this.$store.dispatch('login', {
          phone: this.phone,
          password: this.password,
          rememberMe: this.rememberMe
        });
        
        // Getting user data from the response
        const userData = response?.data?.user || {};
        console.log('Login response received:', userData);
        
        // Quick verification of token presence
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token not saved to localStorage after login');
          throw new Error('Authentication failed - no token received');
        }
        
        // Check hasSetupAccount flag to determine where to redirect
        // Also check custom localStorage keys
        const userId = userData.id;
        const namespacedKey = userId ? `finance-chat-account-setup-${userId}` : null;
        const hasSetupFromLocalStorage = namespacedKey ? 
          localStorage.getItem(namespacedKey) === 'true' : false;
          
        const hasSetupAccount = userData.hasSetupAccount || hasSetupFromLocalStorage;
        console.log('Account setup status:', hasSetupAccount ? 'Setup complete' : 'Setup needed');
        
        if (hasSetupAccount) {
          console.log('Redirecting to dashboard - account already set up');
          this.$router.push('/');
        } else {
          console.log('Redirecting to business type selection - account needs setup');
          this.$router.push('/business-type');
        }
      } catch (error) {
        console.error('Login failed:', error);
        
        let errorMessage = 'Login failed';
        
        // Try to get the error message from the response
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Show error message to user
        alert(errorMessage);
        
        // Clear any partial auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--light-gray);
  padding: 2rem 1rem;
}

.auth-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  transition: transform 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.auth-logo {
  height: 120px;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}

.auth-logo:hover {
  transform: scale(1.05);
}

h2 {
  font-size: 1.5rem;
  color: var(--text-dark);
  margin-bottom: 1.5rem;
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-dark);
}

input[type="email"],
input[type="password"],
input[type="text"],
input[type="tel"] {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-gray);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: var(--text-dark);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.forgot-password {
  color: var(--text-gray);
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: var(--primary-dark);
}

.auth-button {
  background-color: var(--primary-color);
  color: var(--text-dark);
  border: none;
  border-radius: 8px;
  padding: 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
}

.auth-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
}

.auth-button:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
  transform: none;
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: var(--text-gray);
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.auth-divider span {
  padding: 0 10px;
  font-size: 0.85rem;
}

.social-auth-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.social-auth-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.85rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
  color: var(--text-dark);
  max-width: 80%;
}

.social-auth-button:hover {
  background-color: var(--light-gray);
  transform: translateY(-2px);
}

.google-icon {
  width: 24px;
  height: 24px;
  background-color: #4285F4;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-gray);
}

.auth-link {
  color: var(--primary-dark);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.auth-link:hover {
  text-decoration: underline;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--text-dark);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
  
  .auth-logo {
    height: 60px;
  }
  
  h2 {
    font-size: 1.3rem;
  }
}
</style>