# MongoDB Setup Instructions for Finance Chat App

To make the Finance Chat app work with MongoDB for persistent data storage across sessions, follow these instructions:

## Step 1: Set Up MongoDB Atlas Account (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and click "Try Free"
2. Create a new account or sign in with an existing account
3. Choose the free tier option (M0 Sandbox)
4. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
5. Choose a region closest to your users
6. Name your cluster (e.g., "finance-chat")
7. Click "Create Cluster" and wait for it to be created (usually takes 1-3 minutes)

## Step 2: Create a Database User

1. In the left sidebar, click on "Database Access" under Security
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Create a username and a secure password (save these credentials!)
5. Set privileges to "Read and Write to Any Database"
6. Click "Add User"

## Step 3: Configure Network Access

1. In the left sidebar, click on "Network Access" under Security
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (not secure for production)
4. Click "Confirm"

## Step 4: Get Your Connection String

1. Go back to your Clusters overview page (click "Database" in the left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as your driver and choose the latest version
5. Copy the connection string (it will look like `mongodb+srv://username:<password>@clustername.mongodb.net/test?retryWrites=true&w=majority`)
6. Replace `<password>` with your database user password
7. Replace `test` with `finance-chat` (this will be your database name)

## Step 5: Configure Your Application

1. Edit the `/server/.env` file in your Finance Chat app
2. Replace the existing MONGODB_URI with your connection string:

```
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/finance-chat?retryWrites=true&w=majority
```

## Step 6: Start Your Server

1. Run the server with:
```
cd server
npm run start
```

2. You should see a message: "MongoDB Connected: yourcluster.mongodb.net"

## Step 7: Test Data Persistence

1. Register a new account in the Finance Chat app
2. Set up a business and add some transactions
3. Log out and log back in
4. Verify that your account and transaction data are still there

## Troubleshooting

### Connection Errors

If you see an error like "Error connecting to MongoDB: ...":

1. Check that your connection string is correct in the `.env` file
2. Verify that your username and password are correct
3. Make sure that your IP address is allowed in the Network Access settings
4. Check that your MongoDB Atlas cluster is running

### Data Not Persisting

If your data is not persisting between sessions:

1. Verify that MongoDB is connected (look for "MongoDB Connected" in the server logs)
2. Check that the server is using MongoDB and not the localStorage fallback
3. Make sure you're using the same account credentials when logging back in

### For Production Deployments

When deploying to production:

1. Don't allow access from anywhere in Network Access settings
2. Add only your production server's IP address
3. Set up proper environment variables on your hosting platform

For deployment-specific instructions, see `DEPLOYMENT_CHECKLIST.md`.