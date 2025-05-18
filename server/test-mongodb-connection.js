/**
 * Test MongoDB connection
 * Run this script with: node test-mongodb-connection.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('MongoDB Connection Test');
console.log('======================');
console.log('Attempting to connect to MongoDB URI:', process.env.MONGODB_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
})
.then(connection => {
  console.log('✅ Connection successful!');
  console.log(`Connected to MongoDB Atlas at: ${connection.connection.host}`);
  console.log('Database:', connection.connection.name);
  
  // List all collections in the database
  return connection.connection.db.listCollections().toArray();
})
.then(collections => {
  console.log('\nCollections in database:');
  if (collections.length === 0) {
    console.log('- No collections found (this is normal for a new database)');
  } else {
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
  }
  console.log('\nYour MongoDB connection is working correctly!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed!');
  console.error('Error details:', err.message);
  
  if (err.message.includes('ENOTFOUND')) {
    console.error('\nPossible causes:');
    console.error('1. Your MongoDB Atlas cluster name is incorrect');
    console.error('2. Your internet connection is down');
  } 
  else if (err.message.includes('Authentication failed')) {
    console.error('\nPossible causes:');
    console.error('1. Your username or password is incorrect');
    console.error('2. You forgot to replace <password> with your actual password');
  }
  else if (err.message.includes('IP address is not whitelisted')) {
    console.error('\nPossible cause:');
    console.error('Your current IP address is not on the MongoDB Atlas whitelist');
    console.error('\nHow to fix:');
    console.error('1. Go to MongoDB Atlas dashboard');
    console.error('2. Click on "Network Access" in the left sidebar');
    console.error('3. Click "Add IP Address"');
    console.error('4. Click "Allow Access from Anywhere" or add your specific IP');
  }
  
  console.error('\nPlease check your MongoDB Atlas setup and try again.');
  process.exit(1);
});