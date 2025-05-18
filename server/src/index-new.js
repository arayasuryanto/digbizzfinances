/**
 * New server implementation with strict MongoDB connection
 */
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Load env vars
dotenv.config();

// Import route files
const authRoutes = require('./routes/auth-strict');
const businessRoutes = require('./routes/business-strict');
const transactionsRoutes = require('./routes/transactions-strict');
const messagesRoutes = require('./routes/messages-strict');

// Import mongoose models
require('./models/User-strict');
require('./models/Transaction-strict');
require('./models/Message-strict');

// Create express app
const app = express();

// Body parser middleware
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Finance Chat API' });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/messages', messagesRoutes);

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('URI:', process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connected');
    
    // Start server after successful database connection
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);  // Exit with failure if we can't connect to MongoDB
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});