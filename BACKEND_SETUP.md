# Finance Chat Backend Setup

This guide explains how to set up the backend server, MongoDB database, and deployment configuration for the Finance Chat application.

## Prerequisites

- Node.js v14 or higher
- MongoDB (local or Atlas)
- Netlify account (for deployment)

## Local Development Setup

### 1. MongoDB Setup

#### Option A: Local MongoDB

1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/
2. Start MongoDB service: `mongod`
3. The default connection string for local development is: `mongodb://localhost:27017/finance-chat`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database user with read/write privileges
4. Whitelist your IP address
5. Get your connection string from the Atlas dashboard

### 2. Environment Variables

1. In the `/server` directory, create a `.env` file based on `.env.example`:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# Replace with your MongoDB connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# Generate a secure random string for JWT
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=30d

# CORS settings
CORS_ORIGIN=http://localhost:8080
```

### 3. Install Dependencies

Run the following command from the project root to install all dependencies:

```
npm run install:all
```

Alternatively, you can install each package separately:

```
# Install main project dependencies
npm install

# Install server dependencies
cd server && npm install

# Install Netlify function dependencies
cd ../netlify && npm install
```

### 4. Start Development Servers

To run both frontend and backend simultaneously:

```
npm run dev
```

This will start:
- Frontend server on http://localhost:8080
- Backend server on http://localhost:5000

## Project Structure

```
/finance-chat
  ├── /src                    # Frontend source code
  ├── /server                 # Backend code for local development
  │   ├── /src
  │   │   ├── /controllers    # API controllers
  │   │   ├── /models         # Mongoose models
  │   │   ├── /routes         # API routes
  │   │   ├── /middleware     # Express middleware
  │   │   ├── /config         # Configuration files
  │   │   ├── /utils          # Utility functions
  │   │   └── index.js        # Main server file
  ├── /netlify                # Netlify deployment files
  │   ├── /functions          # Serverless functions
  │   │   └── api.js          # API serverless function
  └── netlify.toml            # Netlify configuration
```

## API Endpoints

The API provides the following endpoints:

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/updatedetails` - Update user details

### Business

- `PUT /api/business/setup` - Setup business profile
- `PUT /api/business` - Update business profile
- `GET /api/business` - Get business profile

### Transactions

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get transactions summary

### Messages

- `GET /api/messages` - Get all messages
- `POST /api/messages` - Create new message
- `POST /api/messages/batch` - Create multiple messages
- `DELETE /api/messages` - Delete all messages

## Database Models

### User Model

```javascript
{
  name: String,
  phone: String,
  email: String,
  password: String,
  hasSetupAccount: Boolean,
  balance: Number,
  business: {
    type: String, // 'personal', 'food', 'service', 'product'
    name: String,
    businessOwner: String,
    transactionCategories: {
      income: [String],
      expense: [String]
    }
  },
  createdAt: Date
}
```

### Transaction Model

```javascript
{
  user: ObjectId,
  type: String, // 'income' or 'expense'
  amount: Number,
  category: String,
  subCategories: [String],
  text: String,
  date: Date,
  formatted_date: String,
  confidence: Number,
  needs_review: Boolean
}
```

### Message Model

```javascript
{
  user: ObjectId,
  sender: String, // 'user' or 'assistant'
  text: String,
  timestamp: Date,
  relatedTransaction: ObjectId
}
```

## Deployment to Netlify

### Frontend Deployment

1. Connect your GitHub repository to Netlify
2. Set the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Backend Deployment

For the serverless backend, Netlify Functions are used. The configuration is already set up in `netlify.toml`.

### Environment Variables on Netlify

Add the following environment variables in the Netlify dashboard:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string for JWT signing
- `JWT_EXPIRE` - JWT expiration period (e.g., "30d")
- `NODE_ENV` - Set to "production"

## Troubleshooting

### Database Connection Issues

- Verify MongoDB is running
- Check connection string format
- Ensure network access is allowed (IP whitelist on Atlas)

### API Not Working

- Check server logs for errors
- Verify correct API URLs in frontend code
- Check CORS configuration

### Deployment Issues

- Review Netlify build logs
- Verify environment variables are correctly set
- Test the API endpoints directly

## Maintenance

### Database Backups

For MongoDB Atlas:
- Automatic backups are configured by default
- For additional backup options, refer to Atlas documentation

### Monitoring

- Monitor API usage using Netlify Function logs
- Consider adding a monitoring service for production