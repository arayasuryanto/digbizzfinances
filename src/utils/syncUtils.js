/**
 * Utilities for syncing local and server data
 */
import { apiClient } from '../services/api';
import {
  loadTransactions,
  saveTransactions,
  loadMessages,
  saveMessages,
  loadBalance,
  saveBalance,
  loadBusinessInfo,
  saveBusinessInfo
} from './storage';

/**
 * Sync all user data from server
 * @returns {Promise<Object>} sync results
 */
export async function syncUserData() {
  const results = {
    transactions: false,
    messages: false,
    business: false
  };

  try {
    // Try to connect to the API
    try {
      // Get transactions from server
      const transactionResponse = await apiClient.get('/transactions');
      if (transactionResponse.data && transactionResponse.data.success) {
        saveTransactions(transactionResponse.data.data || []);
        results.transactions = true;
      }
    } catch (error) {
      console.warn('Error syncing transactions from server - operating in offline mode:', error);
      // If we're in offline mode, we'll use the locally stored data
      results.transactions = true;
    }

    try {
      // Get messages from server
      const messagesResponse = await apiClient.get('/messages');
      if (messagesResponse.data && messagesResponse.data.success) {
        saveMessages(messagesResponse.data.data || []);
        results.messages = true;
      }
    } catch (error) {
      console.warn('Error syncing messages from server - operating in offline mode:', error);
      // If we're in offline mode, we'll use the locally stored data
      results.messages = true;
    }

    try {
      // Get business info from server
      const businessResponse = await apiClient.get('/business');
      if (businessResponse.data && businessResponse.data.success) {
        saveBusinessInfo(businessResponse.data.data || null);
        results.business = true;
      }
    } catch (error) {
      console.warn('Error syncing business info from server - operating in offline mode:', error);
      // If we're in offline mode, we'll use the locally stored data
      results.business = true;
    }
  } catch (error) {
    console.error('Error during data synchronization:', error);
  }

  return results;
}

/**
 * Sync local transactions to server (for offline mode)
 * @returns {Promise<Object>} sync results
 */
export async function syncLocalTransactionsToServer() {
  const results = {
    success: false,
    count: 0
  };

  try {
    // Get local transactions
    const transactions = loadTransactions();
    
    // Filter out transactions that don't have an ID (those are already on the server)
    const unsyncedTransactions = transactions.filter(t => !t._id);
    
    if (unsyncedTransactions.length === 0) {
      results.success = true;
      return results;
    }
    
    // Batch create transactions on server
    const response = await apiClient.post('/transactions/batch', { 
      transactions: unsyncedTransactions 
    });
    
    if (response.data && response.data.success) {
      // Update local transactions with server IDs
      const updatedTransactions = transactions.map(t => {
        const serverTransaction = response.data.data.find(st => 
          st.text === t.text && 
          st.amount === t.amount && 
          new Date(st.date).getTime() === new Date(t.date).getTime()
        );
        
        if (serverTransaction && !t._id) {
          return { ...t, _id: serverTransaction._id };
        }
        
        return t;
      });
      
      saveTransactions(updatedTransactions);
      results.success = true;
      results.count = response.data.data.length;
    }
  } catch (error) {
    console.error('Error syncing local transactions to server:', error);
  }
  
  return results;
}

/**
 * Sync local messages to server (for offline mode)
 * @returns {Promise<Object>} sync results
 */
export async function syncLocalMessagesToServer() {
  const results = {
    success: false,
    count: 0
  };

  try {
    // Get local messages
    const messages = loadMessages();
    
    // Filter out messages that don't have an ID (those are already on the server)
    const unsyncedMessages = messages.filter(m => !m._id);
    
    if (unsyncedMessages.length === 0) {
      results.success = true;
      return results;
    }
    
    // Batch create messages on server
    const response = await apiClient.post('/messages/batch', { 
      messages: unsyncedMessages 
    });
    
    if (response.data && response.data.success) {
      // Update local messages with server IDs
      const updatedMessages = messages.map(m => {
        const serverMessage = response.data.data.find(sm => 
          sm.text === m.text && 
          sm.sender === m.sender && 
          new Date(sm.timestamp).getTime() === new Date(m.timestamp).getTime()
        );
        
        if (serverMessage && !m._id) {
          return { ...m, _id: serverMessage._id };
        }
        
        return m;
      });
      
      saveMessages(updatedMessages);
      results.success = true;
      results.count = response.data.data.length;
    }
  } catch (error) {
    console.error('Error syncing local messages to server:', error);
  }
  
  return results;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Basic validation of token format
  if (token) {
    try {
      // Verify token has correct format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format detected in isAuthenticated');
        return false;
      }
      
      // Also verify we have user data
      if (user) {
        try {
          const userObj = JSON.parse(user);
          if (userObj && userObj.id) {
            // We have both a valid token and user data
            return true;
          }
        } catch (e) {
          console.error('Error parsing user data in isAuthenticated:', e);
        }
      }
      
      // If we have a valid token format but no valid user data,
      // still return true to prevent unnecessary logouts
      return true;
    } catch (e) {
      console.error('Error validating token in isAuthenticated:', e);
    }
  }
  
  // If we don't have a token or it's invalid
  return false;
}