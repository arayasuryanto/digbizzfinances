const mongoose = require('mongoose');

// Track database connection state
let isConnected = false;
let connectionCheckInterval = null;

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Give the server 10 seconds to try and connect
      connectTimeoutMS: 10000,         // Give up trying to connect after 10 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
    
    // Set up connection monitoring
    setupConnectionMonitoring();
    
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Using local storage fallback for data persistence');
    // Don't exit the process, allow the application to run in offline mode
    isConnected = false;
    
    // Set up retry mechanism
    setupRetryMechanism();
    
    return false;
  }
};

// Check connection status
const isConnectedToDB = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Set up monitoring to detect disconnection and reconnection
const setupConnectionMonitoring = () => {
  // Clear any existing interval
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  // Monitor connection state
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected!');
    isConnected = false;
    setupRetryMechanism();
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });
  
  mongoose.connection.on('connected', () => {
    console.log('MongoDB reconnected!');
    isConnected = true;
    
    // Sync any offline data to the database
    syncOfflineData();
  });
};

// Set up retry mechanism to reconnect to MongoDB
const setupRetryMechanism = () => {
  // Clear any existing interval
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  // Set up interval to attempt reconnection
  connectionCheckInterval = setInterval(async () => {
    if (!isConnectedToDB()) {
      console.log('Attempting to reconnect to MongoDB...');
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        
        console.log('MongoDB reconnected successfully!');
        isConnected = true;
        
        // Sync any offline data to the database
        syncOfflineData();
        
        // Clear the interval since we're connected
        clearInterval(connectionCheckInterval);
        connectionCheckInterval = null;
      } catch (error) {
        console.error(`Failed to reconnect to MongoDB: ${error.message}`);
        isConnected = false;
      }
    } else {
      // Clear the interval since we're connected
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
  }, 30000); // Try to reconnect every 30 seconds
};

// Sync offline data to database when connection is restored
const syncOfflineData = async () => {
  console.log('Syncing offline data to database...');
  
  try {
    // Make sure we have the latest data from files
    const localStoragePersistence = require('../utils/localStoragePersistence');
    
    // Check for any saved data in files that isn't in memory
    if (!global.mockMessages || Object.keys(global.mockMessages).length === 0) {
      global.mockMessages = localStoragePersistence.loadData(localStoragePersistence.FILES.messages);
    }
    
    if (!global.mockTransactions || Object.keys(global.mockTransactions).length === 0) {
      global.mockTransactions = localStoragePersistence.loadData(localStoragePersistence.FILES.transactions);
    }
    
    // Sync messages
    const messagesController = require('../controllers/messages');
    const messagesResult = await messagesController.syncMockMessagesToDatabase();
    console.log(`Messages sync result:`, messagesResult);
    
    // Sync transactions
    const transactionsController = require('../controllers/transactions');
    const transactionsResult = await transactionsController.syncMockTransactionsToDatabase();
    console.log(`Transactions sync result:`, transactionsResult);
    
    // Save the updated state to files
    localStoragePersistence.saveAllData();
    
    console.log('Offline data sync completed.');
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
};

// Export functions
module.exports = connectDB;
module.exports.mongoose = mongoose;
module.exports.isConnectedToDB = isConnectedToDB;
module.exports.syncOfflineData = syncOfflineData;