import api from '../services/api';

export default {
  state: {
    token: localStorage.getItem('token') || null,
    user: (() => {
      try {
        return JSON.parse(localStorage.getItem('user')) || null;
      } catch (e) {
        console.error('Error parsing user data in store:', e);
        return null;
      }
    })(),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null
  },
  
  mutations: {
    AUTH_START(state) {
      state.loading = true;
      state.error = null;
    },
    
    AUTH_SUCCESS(state, { token, user }) {
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    
    AUTH_ERROR(state, error) {
      state.loading = false;
      state.error = error;
    },
    
    LOGOUT(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      
      // Remove from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    UPDATE_USER(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
  
  actions: {
    async register({ commit }, userData) {
      commit('AUTH_START');
      
      try {
        const response = await api.auth.register(userData);
        const { token, user } = response.data;
        
        // Save hasSetupAccount value in localStorage with user ID prefix for extra reliability
        if (user && user.id) {
          const namespacedKey = `finance-chat-account-setup-${user.id}`;
          localStorage.setItem(namespacedKey, user.hasSetupAccount ? 'true' : 'false');
          
          // Also set the global hasSetupAccount flag
          localStorage.setItem('hasSetupAccount', user.hasSetupAccount ? 'true' : 'false');
        }
        
        commit('AUTH_SUCCESS', { token, user });
        return response;
      } catch (error) {
        commit('AUTH_ERROR', error.response ? error.response.data.error : 'Network error');
        throw error;
      }
    },
    
    async login({ commit }, credentials) {
      commit('AUTH_START');
      
      try {
        console.log('Sending login request to API');
        const response = await api.auth.login(credentials);
        
        if (!response || !response.data || !response.data.success) {
          throw new Error('Invalid response from server');
        }
        
        const { token, user } = response.data;
        
        if (!token) {
          throw new Error('No token received from server');
        }
        
        // Enhanced user data check and handling
        if (!user || !user.id) {
          console.error('Missing user data in login response');
          throw new Error('Invalid user data received');
        }
        
        // Save more details in localStorage for better data persistence
        const namespacedKey = `finance-chat-account-setup-${user.id}`;
        localStorage.setItem(namespacedKey, user.hasSetupAccount ? 'true' : 'false');
        localStorage.setItem('hasSetupAccount', user.hasSetupAccount ? 'true' : 'false');
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userPhone', user.phone);
        
        // Save auth data in store and localStorage
        commit('AUTH_SUCCESS', { token, user });
        
        console.log('Login successful, returning response');
        return response;
      } catch (error) {
        console.error('Login action error:', error);
        commit('AUTH_ERROR', error.response ? error.response.data.error : 'Network error');
        throw error;
      }
    },
    
    async getProfile({ commit }) {
      try {
        const response = await api.auth.getProfile();
        const { data } = response.data;
        
        commit('UPDATE_USER', data);
        return data;
      } catch (error) {
        // If we get a 401, the token is invalid - log the user out
        if (error.response && error.response.status === 401) {
          commit('LOGOUT');
        }
        throw error;
      }
    },
    
    async updateProfile({ commit }, userData) {
      const response = await api.auth.updateProfile(userData);
      const { data } = response.data;
      
      commit('UPDATE_USER', data);
      return data;
    },
    
    async logout({ commit }) {
      try {
        await api.auth.logout();
      } catch (error) {
        console.warn('Error during logout', error);
      }
      
      commit('LOGOUT');
    }
  },
  
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    authUser: state => state.user,
    authLoading: state => state.loading,
    authError: state => state.error
  }
};