// This is a registration function to help with user account setup
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// GET route to check function status
app.get('/.netlify/functions/register', (req, res) => {
  res.json({ message: 'Registration service ready' });
});

// POST route to create first admin user
app.post('/.netlify/functions/register', async (req, res) => {
  const { token, username, email, phone, password } = req.body;

  // Quick security check - requires a special setup token
  // This is not highly secure but adds a basic barrier to random registrations
  if (token !== process.env.SETUP_TOKEN) {
    return res.status(401).json({ success: false, message: 'Invalid setup token' });
  }

  if (!username || !password || !phone) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    await client.connect();
    const db = client.db();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ phone });
    
    if (existingUser) {
      await client.close();
      return res.status(400).json({ success: false, message: 'User already exists with this phone number' });
    }
    
    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = {
      name: username,
      phone,
      email: email || '',
      password: hashedPassword,
      hasSetupAccount: true,
      balance: 0,
      business: {
        type: 'personal',
        name: '',
        businessOwner: '',
        transactionCategories: {
          income: [],
          expense: []
        }
      },
      isAdmin: true,
      createdAt: new Date()
    };
    
    await db.collection('users').insertOne(user);
    
    await client.close();
    
    res.status(201).json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: {
        name: user.name,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export the serverless function
module.exports.handler = serverless(app);