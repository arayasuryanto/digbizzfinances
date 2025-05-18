/**
 * Helper functions for interacting with localStorage
 */

// Function to get the current user ID for data namespacing
function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user && user.id ? user.id : 'no-user';
}

// Create namespaced storage keys by user ID
function getNamespacedKey(key) {
  const userId = getCurrentUserId();
  return `${key}-${userId}`;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance-chat-transactions',
  MESSAGES: 'finance-chat-messages',
  BALANCE: 'finance-chat-balance',
  BUSINESS_INFO: 'finance-chat-business-info',
  ACCOUNT_SETUP: 'finance-chat-account-setup'
};

/**
 * Save transactions to localStorage
 * @param {Array} transactions - Array of transaction objects
 */
export function saveTransactions(transactions) {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.TRANSACTIONS);
    localStorage.setItem(namespacedKey, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
  }
}

/**
 * Load transactions from localStorage
 * @returns {Array} Array of transaction objects or empty array if none found
 */
export function loadTransactions() {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.TRANSACTIONS);
    const data = localStorage.getItem(namespacedKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading transactions from localStorage:', error);
    return [];
  }
}

/**
 * Save messages to localStorage
 * @param {Array} messages - Array of message objects
 */
export function saveMessages(messages) {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.MESSAGES);
    localStorage.setItem(namespacedKey, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages to localStorage:', error);
  }
}

/**
 * Load messages from localStorage
 * @returns {Array} Array of message objects or empty array if none found
 */
export function loadMessages() {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.MESSAGES);
    const data = localStorage.getItem(namespacedKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading messages from localStorage:', error);
    return [];
  }
}

/**
 * Save balance to localStorage
 * @param {number} balance - Current balance
 */
export function saveBalance(balance) {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.BALANCE);
    localStorage.setItem(namespacedKey, balance.toString());
  } catch (error) {
    console.error('Error saving balance to localStorage:', error);
  }
}

/**
 * Load balance from localStorage
 * @returns {number} Current balance or 0 if none found
 */
export function loadBalance() {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.BALANCE);
    const data = localStorage.getItem(namespacedKey);
    return data ? parseFloat(data) : 0;
  } catch (error) {
    console.error('Error loading balance from localStorage:', error);
    return 0;
  }
}

/**
 * Save business info to localStorage
 * @param {Object} businessInfo - Business configuration
 */
export function saveBusinessInfo(businessInfo) {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.BUSINESS_INFO);
    localStorage.setItem(namespacedKey, JSON.stringify(businessInfo));
  } catch (error) {
    console.error('Error saving business info to localStorage:', error);
  }
}

/**
 * Load business info from localStorage
 * @returns {Object|null} Business info or null if none found
 */
export function loadBusinessInfo() {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.BUSINESS_INFO);
    const data = localStorage.getItem(namespacedKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading business info from localStorage:', error);
    return null;
  }
}

/**
 * Save account setup status to localStorage
 * @param {boolean} status - Whether account setup is complete
 */
export function saveAccountSetupStatus(status) {
  try {
    const namespacedKey = getNamespacedKey(STORAGE_KEYS.ACCOUNT_SETUP);
    localStorage.setItem(namespacedKey, status.toString());
  } catch (error) {
    console.error('Error saving account setup status to localStorage:', error);
  }
}

/**
 * Clear all stored data for the current user
 */
export function clearAllData() {
  try {
    const userId = getCurrentUserId();
    if (userId === 'no-user') return; // Don't clear anything if no user is logged in
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const namespacedKey = getNamespacedKey(key);
      localStorage.removeItem(namespacedKey);
    });
  } catch (error) {
    console.error('Error clearing data from localStorage:', error);
  }
}
