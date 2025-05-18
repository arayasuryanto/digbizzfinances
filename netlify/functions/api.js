const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('../../server/src/routes/auth');
const businessRoutes = require('../../server/src/routes/business');
const transactionsRoutes = require('../../server/src/routes/transactions');
const messagesRoutes = require('../../server/src/routes/messages');
const errorHandler = require('../../server/src/middleware/error');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Create a properly formatted MongoDB connection string with database name
    let mongoUri = process.env.MONGODB_URI || 'mongodb+srv://arayas:zevgim-7mikze-tivTux@araya-first-mongodb.vsc6mri.mongodb.net/?retryWrites=true&w=majority&appName=araya-first-mongodb';
    
    // Ensure we have a database name in the connection string
    if (!mongoUri.includes('/finance-chat?')) {
      // Add the database name before query parameters if it doesn't exist
      mongoUri = mongoUri.replace('/?', '/finance-chat?');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // In a serverless function, we don't exit the process on errors
    // process.exit(1);
  }
};

// Connect to database during cold starts
connectDB();

// API routes
app.use('/.netlify/functions/api/auth', authRoutes);
app.use('/.netlify/functions/api/business', businessRoutes);
app.use('/.netlify/functions/api/transactions', transactionsRoutes);
app.use('/.netlify/functions/api/messages', messagesRoutes);

// Base route
app.get('/.netlify/functions/api', (req, res) => {
  res.json({ message: 'Welcome to Finance Chat API' });
});

// Error handling middleware
app.use(errorHandler);

// Export the serverless function
module.exports.handler = serverless(app);