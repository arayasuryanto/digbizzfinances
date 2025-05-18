const fs = require('fs');
const path = require('path');

// Define storage directory
const STORAGE_DIR = path.join(__dirname, '../../data');

// Make sure storage directory exists
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Error creating storage directory:', err);
}

// File paths
const FILES = {
  users: path.join(STORAGE_DIR, 'users.json'),
  messages: path.join(STORAGE_DIR, 'messages.json'),
  transactions: path.join(STORAGE_DIR, 'transactions.json')
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

// Initialize on startup
const init = () => {
  console.log('Initializing local storage persistence...');
  
  // Load data from files to global objects
  global.mockUsers = loadData(FILES.users);
  global.mockMessages = loadData(FILES.messages);
  global.mockTransactions = loadData(FILES.transactions);
  
  console.log(`Loaded ${Object.keys(global.mockUsers || {}).length} users from local storage`);
  console.log(`Loaded ${Object.keys(global.mockMessages || {}).length} messages from local storage`);
  console.log(`Loaded ${Object.keys(global.mockTransactions || {}).length} transactions from local storage`);
  
  // Set up periodic save to persist in-memory data to files
  setInterval(() => {
    saveAllData();
  }, 60000); // Save every minute
};

// Save all global objects to files
const saveAllData = () => {
  if (global.mockUsers && Object.keys(global.mockUsers).length > 0) {
    saveData(FILES.users, global.mockUsers);
  }
  
  if (global.mockMessages && Object.keys(global.mockMessages).length > 0) {
    saveData(FILES.messages, global.mockMessages);
  }
  
  if (global.mockTransactions && Object.keys(global.mockTransactions).length > 0) {
    saveData(FILES.transactions, global.mockTransactions);
  }
};

module.exports = {
  init,
  saveAllData,
  loadData,
  saveData,
  FILES
};