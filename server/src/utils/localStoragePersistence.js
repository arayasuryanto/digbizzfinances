const fs = require('fs');
const path = require('path');

// Define storage directory
const STORAGE_DIR = path.join(__dirname, '../../data');
const USER_DATA_DIR = path.join(STORAGE_DIR, 'users');

// Make sure storage directories exist
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Error creating storage directories:', err);
}

// File paths
const FILES = {
  users: path.join(STORAGE_DIR, 'users.json'),
  messages: path.join(STORAGE_DIR, 'messages.json'),
  transactions: path.join(STORAGE_DIR, 'transactions.json')
};

// Get user-specific file path
const getUserFilePath = (userId, dataType) => {
  return path.join(USER_DATA_DIR, `${userId}_${dataType}.json`);
};

// Load data from file
const loadData = (file) => {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (err) {
    console.error(`Error loading data from ${file}:`, err);
    return {};
  }
};

// Save data to file
const saveData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error saving data to ${file}:`, err);
    return false;
  }
};

// Load user-specific data
const loadUserData = (userId, dataType) => {
  const filePath = getUserFilePath(userId, dataType);
  return loadData(filePath);
};

// Save user-specific data
const saveUserData = (userId, dataType, data) => {
  const filePath = getUserFilePath(userId, dataType);
  return saveData(filePath, data);
};

// Initialize on startup
const init = () => {
  console.log('Initializing local storage persistence...');
  
  // Initialize the global object to hold user-specific data
  global.mockUsersData = {};
  
  // Load global user registry
  global.mockUsers = loadData(FILES.users);
  console.log(`Loaded ${Object.keys(global.mockUsers || {}).length} users from global registry`);
  
  // Initialize empty global objects for backward compatibility
  global.mockMessages = {};
  global.mockTransactions = {};
  
  // Load user-specific data for each user
  Object.keys(global.mockUsers || {}).forEach(userId => {
    try {
      // Initialize user data storage
      if (!global.mockUsersData[userId]) {
        global.mockUsersData[userId] = {
          messages: {},
          transactions: {}
        };
      }
      
      // Load user data from files
      global.mockUsersData[userId].messages = loadUserData(userId, 'messages');
      global.mockUsersData[userId].transactions = loadUserData(userId, 'transactions');
      
      // Migrate existing data if needed
      migrateUserData(userId, global.mockUsersData[userId].messages, global.mockUsersData[userId].transactions);
      
      console.log(`Loaded data for user ${userId}: ${Object.keys(global.mockUsersData[userId].messages).length} messages, ${Object.keys(global.mockUsersData[userId].transactions).length} transactions`);
    } catch (err) {
      console.error(`Error loading data for user ${userId}:`, err);
    }
  });
  
  // Set up periodic save to persist in-memory data to files
  setInterval(() => {
    saveAllData();
  }, 60000); // Save every minute
};

// Migrate existing data to user-specific files
const migrateUserData = (userId, userMessages, userTransactions) => {
  // Check if we need to migrate from legacy global storage
  if (Object.keys(userMessages).length === 0 && global.mockMessages) {
    // Find messages for this user
    const userMessagesFromGlobal = Object.values(global.mockMessages)
      .filter(msg => msg.user === userId)
      .reduce((acc, msg) => {
        acc[msg._id] = msg;
        return acc;
      }, {});
    
    if (Object.keys(userMessagesFromGlobal).length > 0) {
      console.log(`Migrating ${Object.keys(userMessagesFromGlobal).length} messages for user ${userId}`);
      saveUserData(userId, 'messages', userMessagesFromGlobal);
    }
  }
  
  if (Object.keys(userTransactions).length === 0 && global.mockTransactions) {
    // Find transactions for this user
    const userTransactionsFromGlobal = Object.values(global.mockTransactions)
      .filter(txn => txn.user === userId)
      .reduce((acc, txn) => {
        acc[txn._id] = txn;
        return acc;
      }, {});
    
    if (Object.keys(userTransactionsFromGlobal).length > 0) {
      console.log(`Migrating ${Object.keys(userTransactionsFromGlobal).length} transactions for user ${userId}`);
      saveUserData(userId, 'transactions', userTransactionsFromGlobal);
    }
  }
};

// Save all data
const saveAllData = () => {
  // Save users registry
  if (global.mockUsers && Object.keys(global.mockUsers).length > 0) {
    saveData(FILES.users, global.mockUsers);
    
    // Save each user's data separately
    Object.keys(global.mockUsers).forEach(userId => {
      // Get user's messages and transactions from the user-specific storage
      const userMessages = global.mockUsersData?.[userId]?.messages || {};
      const userTransactions = global.mockUsersData?.[userId]?.transactions || {};
      
      // Save only if there's data
      if (Object.keys(userMessages).length > 0) {
        saveUserData(userId, 'messages', userMessages);
      }
      
      if (Object.keys(userTransactions).length > 0) {
        saveUserData(userId, 'transactions', userTransactions);
      }
    });
  }
};

module.exports = {
  init,
  saveAllData,
  loadData,
  saveData,
  loadUserData,
  saveUserData,
  FILES,
  getUserFilePath
};