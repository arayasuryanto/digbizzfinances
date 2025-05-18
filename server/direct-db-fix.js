/**
 * Direct MongoDB database fix script
 * This script directly connects to MongoDB and fixes any issues with data storage
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define schemas
const UserSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  hasSetupAccount: Boolean,
  business: {
    type: { type: String, enum: ['personal', 'food', 'service', 'product', null] },
    name: String,
    businessOwner: String,
    transactionCategories: {
      income: [String],
      expense: [String]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['income', 'expense'] },
  amount: Number,
  category: String,
  text: String,
  date: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender: { type: String, enum: ['user', 'assistant'] },
  text: String,
  timestamp: { type: Date, default: Date.now }
});

// Define models
const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Message = mongoose.model('Message', MessageSchema);

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('URI:', process.env.MONGODB_URI);

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully!');
    
    await runMenu();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}

async function runMenu() {
  console.log('\n=== MONGODB DIRECT ACCESS MENU ===');
  console.log('1. Check existing users');
  console.log('2. Create test user with data');
  console.log('3. Check transactions');
  console.log('4. Check messages');
  console.log('5. Fix client data');
  console.log('6. Exit');
  
  rl.question('\nSelect an option (1-6): ', async (answer) => {
    switch (answer) {
      case '1':
        await checkUsers();
        break;
      case '2':
        await createTestUser();
        break;
      case '3':
        await checkTransactions();
        break;
      case '4':
        await checkMessages();
        break;
      case '5':
        await fixClientData();
        break;
      case '6':
        console.log('Exiting...');
        await mongoose.disconnect();
        rl.close();
        return;
      default:
        console.log('Invalid option, please try again.');
    }
    
    await runMenu();
  });
}

async function checkUsers() {
  try {
    const users = await User.find().select('+password');
    console.log(`\nFound ${users.length} users in the database:`);
    
    for (const user of users) {
      console.log(`- User ID: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Has password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`  Has setup account: ${user.hasSetupAccount ? 'Yes' : 'No'}`);
      console.log(`  Business type: ${user.business?.type || 'Not set'}`);
      console.log(`  Business name: ${user.business?.name || 'Not set'}`);
      console.log('  ----');
    }
  } catch (error) {
    console.error('Error checking users:', error.message);
  }
}

async function createTestUser() {
  try {
    // First check if test user exists
    const existingUser = await User.findOne({ phone: '123456789' });
    
    if (existingUser) {
      console.log('\nTest user already exists with ID:', existingUser._id);
      
      // Create some test transactions and messages
      await createTestDataForUser(existingUser._id);
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create new test user
    const user = new User({
      name: 'Test User',
      phone: '123456789',
      password: hashedPassword,
      hasSetupAccount: true,
      business: {
        type: 'personal',
        name: 'Personal Account',
        businessOwner: 'Test User',
        transactionCategories: {
          income: ['Salary', 'Bonus', 'Interest'],
          expense: ['Food', 'Transport', 'Bills']
        }
      }
    });
    
    await user.save();
    console.log('\nCreated test user with ID:', user._id);
    
    // Create some test transactions and messages
    await createTestDataForUser(user._id);
  } catch (error) {
    console.error('Error creating test user:', error.message);
  }
}

async function createTestDataForUser(userId) {
  try {
    // Create some test transactions
    const transactions = [
      {
        user: userId,
        type: 'income',
        amount: 1000000,
        category: 'Salary',
        text: 'Monthly salary'
      },
      {
        user: userId,
        type: 'expense',
        amount: 200000,
        category: 'Food',
        text: 'Grocery shopping'
      },
      {
        user: userId,
        type: 'expense',
        amount: 300000,
        category: 'Transport',
        text: 'Gasoline'
      }
    ];
    
    // Check if transactions already exist
    const existingTransactionsCount = await Transaction.countDocuments({ user: userId });
    
    if (existingTransactionsCount > 0) {
      console.log(`User already has ${existingTransactionsCount} transactions. Skipping transaction creation.`);
    } else {
      const result = await Transaction.insertMany(transactions);
      console.log(`Created ${result.length} test transactions for user`);
    }
    
    // Create some test messages
    const messages = [
      {
        user: userId,
        sender: 'user',
        text: 'Hi, I need help managing my finances'
      },
      {
        user: userId,
        sender: 'assistant',
        text: 'Hello! I can help you track your expenses and income'
      },
      {
        user: userId,
        sender: 'user',
        text: 'Great, I spent Rp 200,000 on groceries yesterday'
      }
    ];
    
    // Check if messages already exist
    const existingMessagesCount = await Message.countDocuments({ user: userId });
    
    if (existingMessagesCount > 0) {
      console.log(`User already has ${existingMessagesCount} messages. Skipping message creation.`);
    } else {
      const result = await Message.insertMany(messages);
      console.log(`Created ${result.length} test messages for user`);
    }
  } catch (error) {
    console.error('Error creating test data:', error.message);
  }
}

async function checkTransactions() {
  try {
    // Ask for user phone
    rl.question('\nEnter user phone to check transactions (or press Enter for all): ', async (phone) => {
      let query = {};
      
      if (phone) {
        const user = await User.findOne({ phone });
        if (!user) {
          console.log(`No user found with phone: ${phone}`);
          return;
        }
        query.user = user._id;
      }
      
      const transactions = await Transaction.find(query);
      console.log(`\nFound ${transactions.length} transactions:`);
      
      for (const transaction of transactions) {
        console.log(`- Transaction ID: ${transaction._id}`);
        console.log(`  User ID: ${transaction.user}`);
        console.log(`  Type: ${transaction.type}`);
        console.log(`  Amount: ${transaction.amount}`);
        console.log(`  Category: ${transaction.category}`);
        console.log(`  Text: ${transaction.text}`);
        console.log(`  Date: ${transaction.date}`);
        console.log('  ----');
      }
    });
  } catch (error) {
    console.error('Error checking transactions:', error.message);
  }
}

async function checkMessages() {
  try {
    // Ask for user phone
    rl.question('\nEnter user phone to check messages (or press Enter for all): ', async (phone) => {
      let query = {};
      
      if (phone) {
        const user = await User.findOne({ phone });
        if (!user) {
          console.log(`No user found with phone: ${phone}`);
          return;
        }
        query.user = user._id;
      }
      
      const messages = await Message.find(query);
      console.log(`\nFound ${messages.length} messages:`);
      
      for (const message of messages) {
        console.log(`- Message ID: ${message._id}`);
        console.log(`  User ID: ${message.user}`);
        console.log(`  Sender: ${message.sender}`);
        console.log(`  Text: ${message.text}`);
        console.log(`  Timestamp: ${message.timestamp}`);
        console.log('  ----');
      }
    });
  } catch (error) {
    console.error('Error checking messages:', error.message);
  }
}

async function fixClientData() {
  console.log('\nFixing client data...');
  try {
    // 1. Make sure all users have hasSetupAccount set correctly
    const usersFixed = await User.updateMany(
      { hasSetupAccount: null, 'business.type': { $ne: null } },
      { $set: { hasSetupAccount: true } }
    );
    
    console.log(`Updated ${usersFixed.modifiedCount} users to have correct hasSetupAccount value`);
    
    // 2. Ensure all transactions have a date
    const transactionsFixed = await Transaction.updateMany(
      { date: null },
      { $set: { date: new Date() } }
    );
    
    console.log(`Updated ${transactionsFixed.modifiedCount} transactions to have a date`);
    
    // 3. Ensure all messages have a timestamp
    const messagesFixed = await Message.updateMany(
      { timestamp: null },
      { $set: { timestamp: new Date() } }
    );
    
    console.log(`Updated ${messagesFixed.modifiedCount} messages to have a timestamp`);
    
    console.log('\nFixed client data!');
  } catch (error) {
    console.error('Error fixing client data:', error.message);
  }
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});