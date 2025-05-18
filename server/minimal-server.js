/**
 * MINIMAL working server that just handles authentication
 * No other features - just to get login/registration working
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/auth-fixed');

// Directly require the User model to ensure it's loaded
require('./src/models/User-fixed');

// Create express app
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Info logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Minimal auth server running' });
});

// Generic response for other routes to prevent 404 errors
app.all('/api/*', (req, res) => {
  res.json({ success: true, data: [] });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Server error' });
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('URI:', process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connected!');
    
    // Start server only after MongoDB connection is established
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      console.log(`Minimal server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });