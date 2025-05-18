<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-section">
        <img src="/logo.png" alt="Logo" class="auth-logo"/>
      </div>
      
      <h2>Lupa Kata Sandi</h2>
      
      <div v-if="!emailSent">
        <p class="instructions">
          Masukkan nomor telepon yang terdaftar dan kami akan mengirimkan kode untuk mengatur ulang kata sandi Anda.
        </p>
        
        <form @submit.prevent="sendResetLink" class="auth-form">
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
          
          <button type="submit" class="auth-button" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner"></span>
            <span v-else>Kirim Kode</span>
          </button>
        </form>
      </div>
      
      <div v-else class="success-message">
        <div class="success-icon">✓</div>
        <h3>Kode Terkirim!</h3>
        <p>
          Kami telah mengirimkan kode untuk mengatur ulang kata sandi ke nomor telepon Anda. 
          Silakan periksa pesan masuk Anda.
        </p>
        <p class="email-note">
          Tidak menerima kode? 
          <button @click="emailSent = false; isLoading = false" class="text-button">
            Kirim ulang
          </button>
        </p>
      </div>
      
      <div class="auth-footer">
        <router-link to="/login" class="auth-link">
          ← Kembali ke halaman Masuk
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForgotPassword',
  data() {
    return {
      phone: '',
      isLoading: false,
      emailSent: false
    }
  },
  methods: {
    sendResetLink() {
      this.isLoading = true;
      
      // Simulate sending reset link
      setTimeout(() => {
        this.emailSent = true;
        this.isLoading = false;
      }, 1500);
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
  margin-bottom: 1rem;
  text-align: center;
}

.instructions {
  text-align: center;
  color: var(--text-gray);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
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

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.success-message h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: var(--text-dark);
}

.success-message p {
  color: var(--text-gray);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.email-note {
  font-size: 0.85rem;
}

.text-button {
  background: none;
  border: none;
  color: var(--primary-dark);
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.text-button:hover {
  color: var(--text-dark);
  text-decoration: underline;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
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
  
  .instructions {
    font-size: 0.9rem;
  }
}
</style>