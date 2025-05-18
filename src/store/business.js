import api from '../services/api';

export default {
  state: {
    business: {
      type: null,  // 'personal', 'food', 'service', 'product'
      name: '',
      businessOwner: '',
      transactionCategories: {
        income: [],
        expense: []
      }
    },
    hasSetupAccount: false,
    loading: false,
    error: null
  },
  
  mutations: {
    SET_BUSINESS(state, business) {
      state.business = business;
    },
    
    SET_ACCOUNT_SETUP_STATUS(state, status) {
      state.hasSetupAccount = status;
    },
    
    BUSINESS_LOADING(state, status) {
      state.loading = status;
    },
    
    BUSINESS_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    async fetchBusinessInfo({ commit }) {
      commit('BUSINESS_LOADING', true);
      
      try {
        const response = await api.business.get();
        const { data, hasSetupAccount } = response.data;
        
        commit('SET_BUSINESS', data);
        commit('SET_ACCOUNT_SETUP_STATUS', hasSetupAccount);
        commit('BUSINESS_LOADING', false);
        
        return data;
      } catch (error) {
        commit('BUSINESS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('BUSINESS_LOADING', false);
        throw error;
      }
    },
    
    async setupBusiness({ commit }, businessData) {
      commit('BUSINESS_LOADING', true);
      
      try {
        const response = await api.business.setup(businessData);
        const { data } = response.data;
        
        commit('SET_BUSINESS', data.business);
        commit('SET_ACCOUNT_SETUP_STATUS', true);
        
        // Also update localStorage for added reliability
        localStorage.setItem('hasSetupAccount', 'true');
        
        // Get user ID for namespaced localStorage key
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.id) {
              const namespacedKey = `finance-chat-account-setup-${user.id}`;
              localStorage.setItem(namespacedKey, 'true');
              
              // Also update the user object
              user.hasSetupAccount = true;
              localStorage.setItem('user', JSON.stringify(user));
            }
          } catch (e) {
            console.error('Error updating user in localStorage:', e);
          }
        }
        
        commit('BUSINESS_LOADING', false);
        return data;
      } catch (error) {
        commit('BUSINESS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('BUSINESS_LOADING', false);
        throw error;
      }
    },
    
    async updateBusiness({ commit }, businessData) {
      commit('BUSINESS_LOADING', true);
      
      try {
        const response = await api.business.update(businessData);
        const { data } = response.data;
        
        commit('SET_BUSINESS', data);
        commit('BUSINESS_LOADING', false);
        
        return data;
      } catch (error) {
        commit('BUSINESS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('BUSINESS_LOADING', false);
        throw error;
      }
    }
  },
  
  getters: {
    businessInfo: state => state.business,
    hasSetupAccount: state => state.hasSetupAccount,
    businessLoading: state => state.loading,
    businessError: state => state.error,
    businessType: state => state.business.type
  }
};