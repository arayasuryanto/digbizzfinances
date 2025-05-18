import api from '../services/api';

export default {
  state: {
    messages: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 50,
      totalPages: 1,
      totalItems: 0
    }
  },
  
  mutations: {
    SET_MESSAGES(state, messages) {
      state.messages = messages;
    },
    
    ADD_MESSAGE(state, message) {
      state.messages.push(message);
    },
    
    ADD_BATCH_MESSAGES(state, messages) {
      state.messages.push(...messages);
    },
    
    CLEAR_MESSAGES(state) {
      state.messages = [];
    },
    
    SET_PAGINATION(state, pagination) {
      state.pagination = pagination;
    },
    
    MESSAGES_LOADING(state, status) {
      state.loading = status;
    },
    
    MESSAGES_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    async fetchMessages({ commit }, params = {}) {
      commit('MESSAGES_LOADING', true);
      
      try {
        const response = await api.messages.getAll(params);
        const { data, pagination } = response.data;
        
        commit('SET_MESSAGES', data);
        commit('SET_PAGINATION', pagination);
        commit('MESSAGES_LOADING', false);
        
        return data;
      } catch (error) {
        commit('MESSAGES_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('MESSAGES_LOADING', false);
        throw error;
      }
    },
    
    async createMessage({ commit }, message) {
      try {
        const response = await api.messages.create(message);
        const { data } = response.data;
        
        commit('ADD_MESSAGE', data);
        
        return data;
      } catch (error) {
        commit('MESSAGES_ERROR', error.response ? error.response.data.error : 'Network error');
        throw error;
      }
    },
    
    async createBatchMessages({ commit }, messages) {
      try {
        const response = await api.messages.createBatch(messages);
        const { data } = response.data;
        
        commit('ADD_BATCH_MESSAGES', data);
        
        return data;
      } catch (error) {
        commit('MESSAGES_ERROR', error.response ? error.response.data.error : 'Network error');
        throw error;
      }
    },
    
    async clearMessages({ commit }) {
      try {
        await api.messages.deleteAll();
        
        commit('CLEAR_MESSAGES');
        
        return { success: true };
      } catch (error) {
        commit('MESSAGES_ERROR', error.response ? error.response.data.error : 'Network error');
        throw error;
      }
    },
    
    // Used for local message handling during conversation
    addLocalMessage({ commit }, message) {
      commit('ADD_MESSAGE', {
        ...message,
        _id: Date.now().toString(), // Temporary ID until synced with server
        timestamp: new Date()
      });
    }
  },
  
  getters: {
    allMessages: state => state.messages,
    messagesLoading: state => state.loading,
    messagesError: state => state.error,
    chronologicalMessages: state => [...state.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }
};