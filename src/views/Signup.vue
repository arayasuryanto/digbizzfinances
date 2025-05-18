<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-section">
        <img src="/logo.png" alt="Logo" class="auth-logo"/>
      </div>
      
      <h2>Buat Akun Baru</h2>
      
      <form @submit.prevent="signup" class="auth-form">
        <div class="form-group">
          <label for="fullName">Nama Lengkap</label>
          <input 
            type="text" 
            id="fullName" 
            v-model="fullName" 
            placeholder="Masukkan nama lengkap Anda"
            required
          />
        </div>
        
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
          <div class="password-strength" v-if="password.length > 0">
            <div 
              class="strength-bar" 
              :style="{ width: `${passwordStrength * 25}%` }"
              :class="getStrengthClass()"
            ></div>
            <span>{{ getStrengthText() }}</span>
          </div>
        </div>
        
        <div class="form-group terms">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="terms" v-model="agreeToTerms" required/>
            <label for="terms">
              Saya setuju dengan <a href="#" class="auth-link">Syarat dan Ketentuan</a> serta <a href="#" class="auth-link">Kebijakan Privasi</a>
            </label>
          </div>
        </div>
        
        <button type="submit" class="auth-button" :disabled="isLoading || !agreeToTerms">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Daftar</span>
        </button>
      </form>
      
      <div class="auth-divider">
        <span>atau</span>
      </div>
      
      <div class="social-auth-container">
        <button class="social-auth-button">
          <span class="google-icon">G</span>
          Daftar dengan Google
        </button>
      </div>
      
      <div class="auth-footer">
        Sudah memiliki akun? 
        <router-link to="/login" class="auth-link">Masuk</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Signup',
  data() {
    return {
      fullName: '',
      phone: '',
      password: '',
      showPassword: false,
      agreeToTerms: false,
      isLoading: false
    }
  },
  computed: {
    passwordStrength() {
      let strength = 0;
      
      // Length check
      if (this.password.length >= 8) strength++;
      
      // Contains uppercase
      if (/[A-Z]/.test(this.password)) strength++;
      
      // Contains number
      if (/[0-9]/.test(this.password)) strength++;
      
      // Contains special char
      if (/[^A-Za-z0-9]/.test(this.password)) strength++;
      
      return strength;
    }
  },
  methods: {
    getStrengthClass() {
      const strength = this.passwordStrength;
      if (strength <= 1) return 'weak';
      if (strength === 2) return 'medium';
      if (strength === 3) return 'good';
      return 'strong';
    },
    getStrengthText() {
      const strength = this.passwordStrength;
      if (strength <= 1) return 'Lemah';
      if (strength === 2) return 'Sedang';
      if (strength === 3) return 'Baik';
      return 'Kuat';
    },
    async signup() {
      // Basic validation
      if (!this.fullName) {
        alert('Please enter your full name');
        return;
      }
      
      if (!this.phone) {
        alert('Please enter your phone number');
        return;
      }
      
      if (!this.password) {
        alert('Please enter a password');
        return;
      }
      
      if (this.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
      
      if (!this.agreeToTerms) {
        alert('You must agree to the terms and conditions');
        return;
      }
      
      this.isLoading = true;
      
      try {
        // Use Vuex store action for signup
        const user = await this.$store.dispatch('signup', {
          name: this.fullName,
          phone: this.phone,
          password: this.password
        });
        
        console.log('User registered:', user);
        
        // After signup, route to business type selection
        this.$router.push('/business-type');
      } catch (error) {
        console.error('Signup failed:', error);
        
        let errorMessage = 'An error occurred during registration';
        
        // Try to get the error message from the response
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Show error message to user
        alert('Registration failed: ' + errorMessage);
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

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  height: 4px;
  border-radius: 2px;
  margin-bottom: 0.25rem;
  transition: width 0.3s;
}

.strength-bar.weak {
  background-color: #dc3545;
}

.strength-bar.medium {
  background-color: #ffc107;
}

.strength-bar.good {
  background-color: #17a2b8;
}

.strength-bar.strong {
  background-color: #28a745;
}

.password-strength span {
  font-size: 0.75rem;
  color: var(--text-gray);
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.checkbox-wrapper input[type="checkbox"] {
  margin-top: 0.25rem;
}

.terms label {
  font-size: 0.85rem;
  line-height: 1.5;
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
  
  .terms label {
    font-size: 0.75rem;
  }
}
</style>