const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Initialize local storage persistence
const localStoragePersistence = require('./utils/localStoragePersistence');
localStoragePersistence.init();

// Connect to database - but don't stop server if it fails
connectDB()
  .then(connected => {
    if (connected) {
      console.log('MongoDB connection successful - using database storage');
    } else {
      console.log('MongoDB connection failed - using localStorage fallback');
    }
  })
  .catch(err => {
    console.error('Unexpected error in MongoDB connection:', err);
    console.log('Using localStorage fallback for data persistence');
  });

// Route files
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business');
const transactionsRoutes = require('./routes/transactions');
const messagesRoutes = require('./routes/messages');
const syncRoutes = require('./routes/sync');

const app = express();

// Body parser
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

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/sync', syncRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Finance Chat API' });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});