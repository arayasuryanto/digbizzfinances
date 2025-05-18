// Vuex module for handling network status

export default {
  state: {
    online: navigator.onLine,
    apiConnected: true,
    lastError: null,
    loading: false
  },
  
  mutations: {
    SET_NETWORK_STATUS(state, { online, apiConnected }) {
      state.online = online;
      state.apiConnected = apiConnected;
    },
    
    SET_NETWORK_ERROR(state, error) {
      state.lastError = error;
    },
    
    SET_LOADING(state, status) {
      state.loading = status;
    },
    
    CLEAR_NETWORK_ERROR(state) {
      state.lastError = null;
    }
  },
  
  actions: {
    setNetworkStatus({ commit }, status) {
      commit('SET_NETWORK_STATUS', status);
    },
    
    setNetworkError({ commit }, error) {
      commit('SET_NETWORK_ERROR', error);
    },
    
    clearNetworkError({ commit }) {
      commit('CLEAR_NETWORK_ERROR');
    },
    
    setLoading({ commit }, status) {
      commit('SET_LOADING', status);
    }
  },
  
  getters: {
    isOnline: state => state.online,
    isApiConnected: state => state.apiConnected,
    networkError: state => state.lastError,
    isLoading: state => state.loading,
    networkAvailable: state => state.online && state.apiConnected
  }
};