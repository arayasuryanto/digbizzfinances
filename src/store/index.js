import { createStore } from 'vuex'
import { 
  categorizeTransaction, 
  extractAmount, 
  extractDate, 
  processTransaction,
  CATEGORIES,
  SUBCATEGORIES,
  CATEGORY_TRANSLATIONS
} from '../utils/transactionParser'
import { 
  saveTransactions, 
  loadTransactions, 
  saveMessages, 
  loadMessages, 
  saveBalance,
  loadBalance,
  saveBusinessInfo,
  loadBusinessInfo,
  saveAccountSetupStatus,
  clearAllData
} from '../utils/storage'
import { apiClient } from '../services/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { syncUserData } from '../utils/syncUtils'

// Import modules
import authModule from './auth'
import businessModule from './business'
import transactionsModule from './transactions'
import messagesModule from './messages'
import networkModule from './network'

// Format currency in Indonesian Rupiah
const formatRupiah = (value) => {
  // Always use positive value for formatting
  const absValue = Math.abs(value);
  
  // Format without any decimal places and with dot as thousands separator
  return 'Rp' + absValue.toLocaleString('id-ID');
}

// Export for use in components
export { formatRupiah };

export default createStore({
  state: {
    transactions: loadTransactions(),
    messages: loadMessages(),
    balance: loadBalance(),
    loading: false,
    auth: {
      isAuthenticated: localStorage.getItem('token') ? true : false,
      user: JSON.parse(localStorage.getItem('user')) || {
        id: '',
        name: '',
        phone: ''
      }
    },
    business: loadBusinessInfo() || {
      type: null, // 'personal', 'food', 'service', 'product'
      name: '',
      businessOwner: '',
      transactionCategories: {
        income: [],
        expense: []
      }
    },
    hasSetupAccount: JSON.parse(localStorage.getItem('user'))?.hasSetupAccount || false
  },
  getters: {
    sortedTransactions: (state) => {
      return [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    totalIncome: (state) => {
      return state.transactions
        .filter(t => t.type === 'income')
        .reduce((total, t) => total + t.amount, 0);
    },
    totalExpenses: (state) => {
      return state.transactions
        .filter(t => t.type === 'expense')
        .reduce((total, t) => total + t.amount, 0);
    },
    categoryTotals: (state) => {
      const totals = {};
      
      // Initialize all categories with 0
      [...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE].forEach(cat => {
        totals[cat] = 0;
      });
      
      // Sum up amounts by category
      state.transactions.forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      });
      
      return totals;
    },
    subcategoryTotals: (state) => {
      const totals = {};
      
      // Initialize all subcategories
      Object.entries(SUBCATEGORIES).forEach(([category, subcats]) => {
        totals[category] = {};
        subcats.forEach(subcat => {
          totals[category][subcat] = 0;
        });
      });
      
      // Sum up amounts by subcategory
      state.transactions.forEach(t => {
        if (t.subCategories && t.subCategories.length > 0) {
          t.subCategories.forEach(subcat => {
            if (SUBCATEGORIES[t.category] && SUBCATEGORIES[t.category].includes(subcat)) {
              totals[t.category][subcat] = (totals[t.category][subcat] || 0) + t.amount;
            }
          });
        }
      });
      
      return totals;
    },
    transactionsNeedingReview: (state) => {
      return state.transactions.filter(t => t.needs_review === true);
    }
  },
  mutations: {
    SET_AUTH(state, status) {
      state.auth.isAuthenticated = status;
      localStorage.setItem('isAuthenticated', status);
    },
    SET_USER(state, user) {
      state.auth.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    SET_ACCOUNT_TYPE(state, type) {
      state.business.type = type;
      if (type === 'personal') {
        // Set default categories for personal
        state.business.transactionCategories = {
          income: ['Gaji', 'Bonus', 'Hadiah', 'Investasi', 'Lainnya'],
          expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Pendidikan', 'Kesehatan', 'Lainnya']
        };
      }
      saveBusinessInfo(state.business);
    },
    SET_BUSINESS_INFO(state, businessInfo) {
      state.business = { ...state.business, ...businessInfo };
      saveBusinessInfo(state.business);
    },
    SET_ACCOUNT_SETUP_STATUS(state, status) {
      state.hasSetupAccount = status;
      saveAccountSetupStatus(status);
    },
    ADD_TRANSACTION(state, transaction) {
      state.transactions.push(transaction);
      
      // Update balance
      if (transaction.type === 'income') {
        state.balance += transaction.amount;
      } else {
        state.balance -= transaction.amount;
      }
      
      // Persist data
      saveTransactions(state.transactions);
      saveBalance(state.balance);
    },
    UPDATE_TRANSACTION(state, updatedTransaction) {
      // Find index of transaction to update
      const index = state.transactions.findIndex(t => t.id === updatedTransaction.id);
      
      if (index !== -1) {
        // Get the old transaction to adjust balance
        const oldTransaction = state.transactions[index];
        
        // Adjust balance (remove old transaction effect)
        if (oldTransaction.type === 'income') {
          state.balance -= oldTransaction.amount;
        } else {
          state.balance += oldTransaction.amount;
        }
        
        // Add new transaction effect to balance
        if (updatedTransaction.type === 'income') {
          state.balance += updatedTransaction.amount;
        } else {
          state.balance -= updatedTransaction.amount;
        }
        
        // Update the transaction
        state.transactions.splice(index, 1, updatedTransaction);
        
        // Persist data
        saveTransactions(state.transactions);
        saveBalance(state.balance);
      }
    },
    DELETE_TRANSACTION(state, transactionId) {
      // Find transaction in array
      const index = state.transactions.findIndex(t => t.id === transactionId);
      
      if (index !== -1) {
        // Get transaction before deleting
        const transaction = state.transactions[index];
        
        // Adjust balance
        if (transaction.type === 'income') {
          state.balance -= transaction.amount;
        } else {
          state.balance += transaction.amount;
        }
        
        // Remove transaction
        state.transactions.splice(index, 1);
        
        // Persist data
        saveTransactions(state.transactions);
        saveBalance(state.balance);
      }
    },
    ADD_MESSAGE(state, message) {
      state.messages.push(message);
      
      // Persist messages
      saveMessages(state.messages);
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    CLEAR_DATA(state) {
      state.transactions = [];
      state.messages = [];
      state.balance = 0;
      
      // Clear localStorage
      saveTransactions([]);
      saveMessages([]);
      saveBalance(0);
    }
  },
  actions: {
    async login({ commit }, credentials) {
      commit('SET_LOADING', true);
      
      try {
        // Try to make actual API call to authenticate
        try {
          const response = await apiClient.post('/auth/login', {
            phone: credentials.phone,
            password: credentials.password
          });
          
          const { token, user } = response.data;
          
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update state
          commit('SET_AUTH', true);
          commit('SET_USER', user);
          
          // Load user's data
          commit('SET_ACCOUNT_SETUP_STATUS', user.hasSetupAccount);
          
          if (user.business) {
            commit('SET_BUSINESS_INFO', user.business);
          }
          
          // Sync user data from server
          await syncUserData();
          
          commit('SET_LOADING', false);
          return user;
        } catch (apiError) {
          console.warn('API connection failed, using localStorage fallback:', apiError);
          
          // Check if user exists in localStorage by phone
          const localUsers = localStorage.getItem('local_users');
          const users = localUsers ? JSON.parse(localUsers) : [];
          const existingUser = users.find(u => u.phone === credentials.phone);
          
          if (existingUser && existingUser.password === credentials.password) {
            // User found with matching password, log them in
            const user = { ...existingUser };
            delete user.password; // Don't store password in state
            
            // Store token and user data
            localStorage.setItem('token', existingUser.token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update state
            commit('SET_AUTH', true);
            commit('SET_USER', user);
            commit('SET_ACCOUNT_SETUP_STATUS', user.hasSetupAccount);
            
            if (user.business) {
              commit('SET_BUSINESS_INFO', user.business);
            }
            
            commit('SET_LOADING', false);
            return user;
          } else {
            // User not found or password doesn't match
            throw new Error('Invalid credentials');
          }
        }
      } catch (error) {
        console.error('Login failed:', error);
        commit('SET_LOADING', false);
        throw error;
      }
    },
    
    async signup({ commit }, userData) {
      commit('SET_LOADING', true);
      
      try {
        // Try to make actual API call to register a new user
        try {
          const response = await apiClient.post('/auth/register', {
            name: userData.name || userData.fullName,
            phone: userData.phone,
            password: userData.password
          });
          
          const { token, user } = response.data;
          
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update state
          commit('SET_AUTH', true);
          commit('SET_USER', user);
          
          commit('SET_LOADING', false);
          return user;
        } catch (apiError) {
          console.warn('API connection failed, using localStorage fallback:', apiError);
          
          // FALLBACK: If the API is unreachable, use localStorage for user storage
          // Generate a mock user ID and token
          const userId = 'user_' + Date.now();
          const mockToken = 'mock_token_' + userId;
          
          // Create a user object
          const user = {
            id: userId,
            name: userData.name || userData.fullName,
            phone: userData.phone,
            hasSetupAccount: false,
            balance: 0,
            business: null
          };
          
          // Store the user in a local users array with password for future logins
          const localUsers = localStorage.getItem('local_users');
          const users = localUsers ? JSON.parse(localUsers) : [];
          
          // Check if a user with this phone already exists
          const existingUserIndex = users.findIndex(u => u.phone === userData.phone);
          if (existingUserIndex !== -1) {
            // Remove the existing user
            users.splice(existingUserIndex, 1);
          }
          
          // Add the new user
          users.push({
            ...user,
            password: userData.password,
            token: mockToken
          });
          
          // Save the updated users array
          localStorage.setItem('local_users', JSON.stringify(users));
          
          // Save current user data and token to localStorage
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update state
          commit('SET_AUTH', true);
          commit('SET_USER', user);
          
          commit('SET_LOADING', false);
          return user;
        }
      } catch (error) {
        console.error('Signup failed:', error);
        commit('SET_LOADING', false);
        throw error;
      }
    },
    
    async logout({ commit }) {
      try {
        // Try to call the logout API if user is already logged in
        if (localStorage.getItem('token')) {
          try {
            await apiClient.post('/auth/logout');
          } catch (error) {
            console.warn('Error during server logout, continuing with local logout:', error);
          }
        }
      } catch (error) {
        console.warn('Error during logout process:', error);
      } finally {
        // Always clear all user-specific data
        clearAllData();
        
        // Reset auth state
        commit('SET_AUTH', false);
        commit('SET_USER', null);
        commit('SET_ACCOUNT_SETUP_STATUS', false);
        
        // Remove token and user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    
    setAccountType({ commit, state }, type) {
      // Update the business type
      commit('SET_ACCOUNT_TYPE', type);
      
      if (type === 'personal') {
        // For personal accounts, we're done with setup
        commit('SET_ACCOUNT_SETUP_STATUS', true);
        
        // Set up default personal account categories
        if (!state.business.transactionCategories || 
            !state.business.transactionCategories.income.length ||
            !state.business.transactionCategories.expense.length) {
          commit('SET_BUSINESS_INFO', {
            ...state.business,
            transactionCategories: {
              income: ['Gaji', 'Bonus', 'Hadiah', 'Investasi', 'Lainnya'],
              expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Pendidikan', 'Kesehatan', 'Lainnya']
            }
          });
        }
        
        // Make sure user object in localStorage is updated
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.hasSetupAccount = true;
            if (!user.business) {
              user.business = {
                type: 'personal',
                name: user.name || 'Personal Account',
                businessOwner: user.name || 'User',
                transactionCategories: {
                  income: ['Gaji', 'Bonus', 'Hadiah', 'Investasi', 'Lainnya'],
                  expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Pendidikan', 'Kesehatan', 'Lainnya']
                }
              };
            }
            localStorage.setItem('user', JSON.stringify(user));
            
            // Also update in local_users if present
            const localUsers = localStorage.getItem('local_users');
            if (localUsers) {
              const users = JSON.parse(localUsers);
              const userIndex = users.findIndex(u => u.id === user.id);
              if (userIndex !== -1) {
                users[userIndex].hasSetupAccount = true;
                users[userIndex].business = user.business;
                localStorage.setItem('local_users', JSON.stringify(users));
              }
            }
            
            // Set namespaced storage key
            if (user.id) {
              const namespacedKey = `finance-chat-account-setup-${user.id}`;
              localStorage.setItem(namespacedKey, 'true');
            }
          }
        } catch (error) {
          console.error('Error updating user data in localStorage:', error);
        }
        
        // Also set global flag in localStorage directly to ensure it's saved
        localStorage.setItem('hasSetupAccount', 'true');
      }
      
      return Promise.resolve();
    },
    
    setupBusiness({ commit }, businessInfo) {
      return new Promise((resolve) => {
        // Create the business object
        const business = {
          type: businessInfo.category,
          name: businessInfo.name,
          businessOwner: businessInfo.businessOwner || '',
          transactionCategories: businessInfo.transactionCategories
        };
        
        try {
          // Update business info in store
          commit('SET_BUSINESS_INFO', business);
          
          // Mark account setup as complete in store
          commit('SET_ACCOUNT_SETUP_STATUS', true);
          
          // Make sure user object in localStorage is updated
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              user.hasSetupAccount = true;
              user.business = business;
              localStorage.setItem('user', JSON.stringify(user));
              
              // Update in local_users if present
              const localUsers = localStorage.getItem('local_users');
              if (localUsers) {
                const users = JSON.parse(localUsers);
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                  users[userIndex].hasSetupAccount = true;
                  users[userIndex].business = business;
                  localStorage.setItem('local_users', JSON.stringify(users));
                }
              }
              
              // Set namespaced storage key for account setup status
              if (user.id) {
                const namespacedKey = `finance-chat-account-setup-${user.id}`;
                localStorage.setItem(namespacedKey, 'true');
              }
            } catch (e) {
              console.error('Error updating user in localStorage:', e);
            }
          }
          
          // Set global flag in localStorage directly to ensure it's saved
          localStorage.setItem('hasSetupAccount', 'true');
          
          // Simulate a short delay for better UX
          setTimeout(() => {
            resolve(true);
          }, 300);
        } catch (error) {
          console.error('Error in setupBusiness:', error);
          // Still resolve but log the error
          resolve(false);
        }
      });
    },
    
    async processMessage({ commit, state, rootState }, messageText) {
      commit('SET_LOADING', true);
      
      // Create user message
      const userMessage = {
        id: Date.now(),
        sender: 'user',
        text: messageText,
        timestamp: new Date()
      };
      
      // Add user message locally
      commit('ADD_MESSAGE', userMessage);
      
      try {
        // Process the transaction text using improved parser function
        const transaction = processTransaction(messageText);
        
        // Add user ID to transaction if authenticated
        if (state.auth.isAuthenticated && state.auth.user && state.auth.user.id) {
          transaction.user = state.auth.user.id;
        }
        
        // Add the transaction locally
        commit('ADD_TRANSACTION', transaction);
        
        // If user is authenticated, save to the server as well
        if (state.auth.isAuthenticated && transaction.amount > 0) {
          try {
            await apiClient.post('/transactions', transaction);
          } catch (error) {
            console.error('Error saving transaction to server:', error);
            // Continue with local transaction even if server save fails
          }
        }
        
        // Generate response message with confidence feedback
        let responseText = '';
        
        if (transaction.amount === 0) {
          const categoryTrans = CATEGORY_TRANSLATIONS[transaction.category] || transaction.category;
          responseText = `Saya dapat mengenali bahwa ini adalah ${categoryTrans} (${transaction.type === 'income' ? 'pemasukan' : 'pengeluaran'}) pada ${format(transaction.date, 'dd MMMM yyyy', { locale: id })}, tetapi tidak dapat menentukan jumlah transaksinya. 
          
Mohon tulis ulang dengan format yang lebih jelas, contoh:
"${transaction.type === 'income' ? 'Penjualan' : 'Pembelian'} ${categoryTrans} Rp350.000"
atau
"${transaction.type === 'income' ? 'Terima pembayaran' : 'Bayar'} untuk ${categoryTrans} 200rb"`;
        } else {
          const formattedAmount = formatRupiah(transaction.amount);
          let balanceSign = '';
          if (state.balance < 0) {
            balanceSign = '-';
          }
          
          // Add subcategory info if available
          let subcategoryText = '';
          if (transaction.subCategories && transaction.subCategories.length > 0) {
            const subCatLabels = transaction.subCategories.map(sub => {
              // Format subcategory for display
              return sub.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            });
            subcategoryText = ` (${subCatLabels.join(', ')})`;
          }
          
          // Add confidence level indication
          let confidenceText = '';
          if (transaction.confidence < 0.6) {
            confidenceText = ' Saya tidak sepenuhnya yakin dengan kategori ini. Mohon koreksi jika diperlukan.';
          } else if (transaction.confidence < 0.8) {
            confidenceText = ' Saya cukup yakin dengan kategori ini.';
          }
          
          if (transaction.type === 'income') {
            responseText = `Saya telah mencatat pemasukan ${formattedAmount} sebagai ${transaction.category}${subcategoryText} pada ${format(transaction.date, 'dd MMMM yyyy', { locale: id })}.${confidenceText} Saldo Anda saat ini adalah ${balanceSign}${formatRupiah(state.balance)}.`;
          } else {
            responseText = `Saya telah mencatat pengeluaran ${formattedAmount} untuk ${transaction.category}${subcategoryText} pada ${format(transaction.date, 'dd MMMM yyyy', { locale: id })}.${confidenceText} Saldo Anda saat ini adalah ${balanceSign}${formatRupiah(state.balance)}.`;
          }
        }
        
        // Create assistant response
        const assistantMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: responseText,
          timestamp: new Date(),
          relatedTransaction: transaction.id
        };
        
        // Add assistant response locally
        commit('ADD_MESSAGE', assistantMessage);
        
        // If user is authenticated, save messages to server
        if (state.auth.isAuthenticated) {
          try {
            // Save both messages in a batch
            await apiClient.post('/messages/batch', { 
              messages: [
                { ...userMessage, user: state.auth.user.id },
                { ...assistantMessage, user: state.auth.user.id }
              ] 
            });
          } catch (error) {
            console.error('Error saving messages to server:', error);
            // Continue even if server save fails
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Add error response
        commit('ADD_MESSAGE', {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'Maaf, terjadi kesalahan dalam memproses transaksi Anda. Silakan coba lagi.',
          timestamp: new Date()
        });
      } finally {
        commit('SET_LOADING', false);
      }
    },
    updateTransaction({ commit }, transaction) {
      commit('UPDATE_TRANSACTION', transaction);
    },
    deleteTransaction({ commit }, transactionId) {
      commit('DELETE_TRANSACTION', transactionId);
    },
    clearAllData({ commit }) {
      commit('CLEAR_DATA');
    },

    async initializeApp({ commit, state }) {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (token && user) {
        try {
          // Verify token is still valid
          const response = await apiClient.get('/auth/me');
          
          if (response.data && response.data.success) {
            // User is authenticated, sync data
            commit('SET_AUTH', true);
            commit('SET_USER', response.data.data);
            commit('SET_ACCOUNT_SETUP_STATUS', response.data.data.hasSetupAccount);
            
            if (response.data.data.business) {
              commit('SET_BUSINESS_INFO', response.data.data.business);
            }
            
            // Sync user data from server
            await syncUserData();
          } else {
            // Token invalid, log out
            commit('SET_AUTH', false);
            commit('SET_USER', null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error verifying auth token:', error);
          
          // If we get 401, token is invalid - log out
          if (error.response && error.response.status === 401) {
            commit('SET_AUTH', false);
            commit('SET_USER', null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } else {
        // No token, make sure auth state reflects that
        commit('SET_AUTH', false);
        commit('SET_USER', null);
      }
    }
  }
})
