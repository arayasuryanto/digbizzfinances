/**
 * Direct MongoDB connection without fallbacks
 */
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Longer timeout
      connectTimeoutMS: 30000
    });
    
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error(error.stack);
    process.exit(1); // Exit with failure - no fallbacks!
  }
};

module.exports = connectDB;