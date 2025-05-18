<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-section">
        <img src="/logo.png" alt="Logo" class="auth-logo"/>
      </div>
      
      <h2>Pilih Jenis Akun</h2>
      
      <div class="business-type-selection">
        <button 
          class="business-type-button" 
          @click="selectType('personal')"
        >
          <span class="icon">👤</span>
          <span class="title">Pribadi</span>
          <span class="description">Untuk mengelola keuangan pribadi Anda</span>
        </button>
        
        <button 
          class="business-type-button" 
          @click="selectType('business')"
        >
          <span class="icon">🏢</span>
          <span class="title">Bisnis</span>
          <span class="description">Untuk mengelola keuangan bisnis Anda</span>
        </button>
      </div>
      
      <div class="auth-footer">
        <small>Anda dapat mengubah jenis akun di pengaturan nanti</small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BusinessTypeSelection',
  methods: {
    selectType(type) {
      if (type === 'personal') {
        // For personal accounts
        try {
          // Get the user's name from store
          const userName = this.$store.state.auth.user?.name || 'User';
          
          // First update the user object in localStorage to mark setup as complete
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              user.hasSetupAccount = true;
              localStorage.setItem('user', JSON.stringify(user));
            } catch (e) {
              console.error('Error updating user in localStorage:', e);
            }
          }
          
          // Then dispatch the account type action
          this.$store.dispatch('setAccountType', 'personal')
            .then(() => {
              console.log('Account type set to personal');
              
              // Set business info with user's name
              this.$store.commit('SET_BUSINESS_INFO', {
                type: 'personal',
                name: userName, // For personal accounts, name is the username
                businessOwner: userName,
                transactionCategories: {
                  income: ['Gaji', 'Bonus', 'Hadiah', 'Investasi', 'Lainnya'],
                  expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Pendidikan', 'Kesehatan', 'Lainnya']
                }
              });
              
              // Mark the account as set up in multiple places to ensure it works
              this.$store.commit('SET_ACCOUNT_SETUP_STATUS', true);
              localStorage.setItem('hasSetupAccount', 'true');
              
              // Get the user object for the namespaced key
              const userObj = JSON.parse(localStorage.getItem('user'));
              const namespacedKey = `finance-chat-account-setup-${userObj?.id || 'no-user'}`;
              localStorage.setItem(namespacedKey, 'true');
              
              // Wait a moment for state to update, then redirect
              setTimeout(() => {
                console.log('Redirecting to dashboard...');
                this.$router.push('/');
              }, 500);
            });
        } catch (error) {
          console.error('Error setting up personal account:', error);
          alert('Error setting up personal account. Please try again.');
        }
      } else {
        // Go to business setup for business accounts
        this.$router.push('/business-setup');
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

.business-type-selection {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.business-type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--light-gray);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.business-type-button:hover {
  transform: translateY(-3px);
  border-color: var(--primary-color);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.business-type-button .icon {
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.business-type-button .title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-dark);
}

.business-type-button .description {
  font-size: 0.9rem;
  color: var(--text-gray);
  text-align: center;
}

.auth-footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-gray);
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
  
  .business-type-button {
    padding: 1.25rem;
  }
  
  .business-type-button .icon {
    font-size: 2rem;
  }
  
  .business-type-button .title {
    font-size: 1.1rem;
  }
}
</style>