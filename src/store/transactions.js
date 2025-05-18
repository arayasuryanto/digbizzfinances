import api from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default {
  state: {
    transactions: [],
    transaction: null,
    loading: false,
    error: null,
    balance: 0,
    summary: {
      income: {
        categories: [],
        total: 0
      },
      expense: {
        categories: [],
        total: 0
      }
    },
    pagination: {
      page: 1,
      limit: 100,
      totalPages: 1,
      totalItems: 0
    }
  },
  
  mutations: {
    SET_TRANSACTIONS(state, transactions) {
      state.transactions = transactions;
    },
    
    SET_TRANSACTION(state, transaction) {
      state.transaction = transaction;
    },
    
    ADD_TRANSACTION(state, transaction) {
      state.transactions.unshift(transaction);
    },
    
    UPDATE_TRANSACTION(state, updatedTransaction) {
      const index = state.transactions.findIndex(t => t._id === updatedTransaction._id);
      if (index !== -1) {
        state.transactions.splice(index, 1, updatedTransaction);
      }
    },
    
    DELETE_TRANSACTION(state, id) {
      state.transactions = state.transactions.filter(t => t._id !== id);
    },
    
    SET_BALANCE(state, balance) {
      state.balance = balance;
    },
    
    SET_SUMMARY(state, summary) {
      state.summary = summary;
    },
    
    SET_PAGINATION(state, pagination) {
      state.pagination = pagination;
    },
    
    TRANSACTIONS_LOADING(state, status) {
      state.loading = status;
    },
    
    TRANSACTIONS_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    async fetchTransactions({ commit }, params = {}) {
      commit('TRANSACTIONS_LOADING', true);
      
      try {
        const response = await api.transactions.getAll(params);
        const { data, count, pagination } = response.data;
        
        commit('SET_TRANSACTIONS', data);
        commit('SET_PAGINATION', pagination);
        commit('TRANSACTIONS_LOADING', false);
        
        return data;
      } catch (error) {
        commit('TRANSACTIONS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('TRANSACTIONS_LOADING', false);
        throw error;
      }
    },
    
    async fetchTransaction({ commit }, id) {
      commit('TRANSACTIONS_LOADING', true);
      
      try {
        const response = await api.transactions.get(id);
        const { data } = response.data;
        
        commit('SET_TRANSACTION', data);
        commit('TRANSACTIONS_LOADING', false);
        
        return data;
      } catch (error) {
        commit('TRANSACTIONS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('TRANSACTIONS_LOADING', false);
        throw error;
      }
    },
    
    async createTransaction({ commit }, transaction) {
      commit('TRANSACTIONS_LOADING', true);
      
      try {
        // Format date if not already formatted
        if (transaction.date && !transaction.formatted_date) {
          transaction.formatted_date = format(new Date(transaction.date), 'dd MMMM yyyy', { locale: id });
        }
        
        const response = await api.transactions.create(transaction);
        const { data, balance } = response.data;
        
        commit('ADD_TRANSACTION', data);
        commit('SET_BALANCE', balance);
        commit('TRANSACTIONS_LOADING', false);
        
        return data;
      } catch (error) {
        commit('TRANSACTIONS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('TRANSACTIONS_LOADING', false);
        throw error;
      }
    },
    
    async updateTransaction({ commit }, { id, transaction }) {
      commit('TRANSACTIONS_LOADING', true);
      
      try {
        const response = await api.transactions.update(id, transaction);
        const { data, balance } = response.data;
        
        commit('UPDATE_TRANSACTION', data);
        commit('SET_BALANCE', balance);
        commit('TRANSACTIONS_LOADING', false);
        
        return data;
      } catch (error) {
        commit('TRANSACTIONS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('TRANSACTIONS_LOADING', false);
        throw error;
      }
    },
    
    async deleteTransaction({ commit }, id) {
      commit('TRANSACTIONS_LOADING', true);
      
      try {
        const response = await api.transactions.delete(id);
        const { balance } = response.data;
        
        commit('DELETE_TRANSACTION', id);
        commit('SET_BALANCE', balance);
        commit('TRANSACTIONS_LOADING', false);
        
        return { success: true };
      } catch (error) {
        commit('TRANSACTIONS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('TRANSACTIONS_LOADING', false);
        throw error;
      }
    },
    
    async fetchTransactionsSummary({ commit }, params = {}) {
      commit('TRANSACTIONS_LOADING', true);
      
      try {
        const response = await api.transactions.getSummary(params);
        const { data } = response.data;
        
        commit('SET_SUMMARY', data);
        commit('SET_BALANCE', data.balance);
        commit('TRANSACTIONS_LOADING', false);
        
        return data;
      } catch (error) {
        commit('TRANSACTIONS_ERROR', error.response ? error.response.data.error : 'Network error');
        commit('TRANSACTIONS_LOADING', false);
        throw error;
      }
    }
  },
  
  getters: {
    allTransactions: state => state.transactions,
    transactionById: state => id => state.transactions.find(t => t._id === id),
    sortedTransactions: state => [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    transactionsLoading: state => state.loading,
    transactionsError: state => state.error,
    totalIncome: state => state.summary.income.total,
    totalExpenses: state => state.summary.expense.total,
    currentBalance: state => state.balance
  }
};