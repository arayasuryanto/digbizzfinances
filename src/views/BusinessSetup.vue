<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-section">
        <img src="/logo.png" alt="Logo" class="auth-logo"/>
      </div>
      
      <h2>Selamat Datang di Bisnis Anda</h2>
      
      <form @submit.prevent="saveBusiness" class="auth-form">
        <div class="form-group">
          <label for="businessName">Nama Bisnis</label>
          <input 
            type="text" 
            id="businessName" 
            v-model="businessName" 
            placeholder="Masukkan nama bisnis Anda"
            required
          />
        </div>
        
        <div class="form-group">
          <label>Kategori Bisnis</label>
          <div class="business-categories">
            <button 
              type="button"
              class="category-button" 
              :class="{ selected: businessCategory === 'food' }"
              @click="selectCategory('food')"
            >
              <span class="icon">🍽️</span>
              <span class="label">Makanan &amp; Minuman</span>
            </button>
            
            <button 
              type="button"
              class="category-button" 
              :class="{ selected: businessCategory === 'service' }"
              @click="selectCategory('service')"
            >
              <span class="icon">🛠️</span>
              <span class="label">Jasa</span>
            </button>
            
            <button 
              type="button"
              class="category-button" 
              :class="{ selected: businessCategory === 'product' }"
              @click="selectCategory('product')"
            >
              <span class="icon">📦</span>
              <span class="label">Produk Lainnya</span>
            </button>
          </div>
          <div class="category-error" v-if="showCategoryError">
            Silakan pilih kategori bisnis
          </div>
        </div>
        
        <button type="submit" class="auth-button" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Simpan &amp; Lanjutkan</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BusinessSetup',
  data() {
    return {
      businessName: '',
      businessCategory: null,
      showCategoryError: false,
      isLoading: false
    }
  },
  methods: {
    selectCategory(category) {
      this.businessCategory = category;
      this.showCategoryError = false;
    },
    saveBusiness() {
      if (!this.businessName) {
        alert('Please enter your business name');
        return;
      }

      if (!this.businessCategory) {
        this.showCategoryError = true;
        return;
      }
      
      this.isLoading = true;
      
      try {
        // Get the transaction categories for this business type
        const categories = this.getCategoriesForBusinessType(this.businessCategory);
        
        // Get the user's name and ID
        const user = this.$store.state.auth.user;
        const userName = user ? user.name : '';
        
        // First update the user object in localStorage to mark setup as complete
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            userData.hasSetupAccount = true;
            userData.business = {
              type: this.businessCategory,
              name: this.businessName,
              businessOwner: userName,
              transactionCategories: categories
            };
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Also update any local users registry
            const localUsers = localStorage.getItem('local_users');
            if (localUsers) {
              const users = JSON.parse(localUsers);
              const userIndex = users.findIndex(u => u.id === userData.id);
              if (userIndex !== -1) {
                users[userIndex].hasSetupAccount = true;
                users[userIndex].business = userData.business;
                localStorage.setItem('local_users', JSON.stringify(users));
              }
            }
          } catch (e) {
            console.error('Error updating user in localStorage:', e);
          }
        }
        
        // Save to Vuex store
        this.$store.dispatch('setupBusiness', {
          name: this.businessName,
          businessOwner: userName,
          category: this.businessCategory,
          transactionCategories: categories
        }).then(() => {
          console.log('Business setup completed');
          
          // Mark the account as set up in multiple places to ensure it works
          this.$store.commit('SET_ACCOUNT_SETUP_STATUS', true);
          localStorage.setItem('hasSetupAccount', 'true');
          
          if (user && user.id) {
            const namespacedKey = `finance-chat-account-setup-${user.id}`;
            localStorage.setItem(namespacedKey, 'true');
          }
          
          // Wait a moment for state to update, then redirect
          setTimeout(() => {
            console.log('Redirecting to dashboard...');
            // Go to the dashboard page
            this.$router.push('/');
          }, 500);
        }).catch(error => {
          console.error('Error during business setup:', error);
          alert('Error saving business information. Please try again.');
          this.isLoading = false;
        });
      } catch (error) {
        console.error('Error in business setup:', error);
        alert('An error occurred during business setup. Please try again.');
        this.isLoading = false;
      }
    },
    getCategoriesForBusinessType(type) {
      switch(type) {
        case 'food':
          return {
            income: [
              'Penjualan Makanan/Minuman',
              'Pesanan Online'
            ],
            expense: [
              'Bahan Baku',
              'Kemasan/Plastik/Cup',
              'Alat Masak/Peralatan Dapur',
              'Gaji',
              'Ongkir',
              'Biaya Tempat/Sewa'
            ]
          };
        case 'service':
          return {
            income: [
              'Pendapatan Layanan',
              'Tip/Uang Tambahan'
            ],
            expense: [
              'Alat & Bahan Operasional',
              'Gaji',
              'Ongkir',
              'Biaya Tempat/Sewa'
            ]
          };
        case 'product':
          return {
            income: [
              'Penjualan Produk',
              'Komisi/Fee Reseller'
            ],
            expense: [
              'Stok Barang',
              'Ongkir',
              'Biaya Platform',
              'Gaji',
              'Biaya Tempat/Sewa'
            ]
          };
        default:
          return {
            income: [],
            expense: []
          };
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
  max-width: 480px;
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

input[type="text"] {
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

.business-categories {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.category-button {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.category-button:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.category-button.selected {
  border-color: var(--primary-color);
  background-color: rgba(255, 215, 0, 0.1);
}

.category-button .icon {
  font-size: 1.75rem;
}

.category-button .label {
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  color: var(--text-dark);
}

.category-error {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.5rem;
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
    height: 80px;
  }
  
  h2 {
    font-size: 1.3rem;
  }
  
  .business-categories {
    flex-direction: column;
  }
  
  .category-button {
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;
    padding: 0.75rem;
  }
  
  .category-button .icon {
    margin-right: 1rem;
  }
}
</style>