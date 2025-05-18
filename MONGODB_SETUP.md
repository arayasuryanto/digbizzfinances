# MongoDB Atlas Setup Guide

This guide walks you through setting up a MongoDB Atlas cluster for the Finance Chat application.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and click "Try Free"
2. Register a new account or sign in with an existing account
3. Choose the free tier option (M0 Sandbox)

## Step 2: Create a Cluster

1. Select "Build a Cluster" and choose the free tier
2. Choose your preferred cloud provider (AWS, Google Cloud, or Azure)
3. Select a region closest to your users for optimal performance
4. Leave all default settings and click "Create Cluster"
5. Wait for the cluster to be created (usually takes 1-3 minutes)

## Step 3: Create a Database User

1. In the left sidebar, click on "Database Access" under Security
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Create a username and a secure password (save these credentials)
5. Set privileges to "Read and Write to Any Database"
6. Click "Add User"

## Step 4: Configure Network Access

1. In the left sidebar, click on "Network Access" under Security
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (not secure for production)
4. For production, add your Netlify function IP ranges
5. Click "Confirm"

## Step 5: Get Your Connection String

1. Go back to your Clusters overview page
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as your driver and choose the latest version
5. Copy the connection string (it will look like `mongodb+srv://username:<password>@clustername.mongodb.net/test?retryWrites=true&w=majority`)
6. Replace `<password>` with your database user password
7. Replace `test` with `finance-chat` (or your preferred database name)

## Step 6: Set Environment Variables

Add your connection string to the appropriate environment variables:

### For Local Development

Edit the `/server/.env` file:

```
MONGODB_URI=mongodb+srv://username:password@clustername.mongodb.net/finance-chat?retryWrites=true&w=majority
```

### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Add the environment variable:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB Atlas connection string

## Step 7: Verify Connection

Run the server locally to verify the connection works:

```
npm run server:dev
```

You should see a console message: "MongoDB Connected: clustername.mongodb.net"

## Common Issues

### Connection Timeout

- Check your IP whitelist settings
- Ensure your connection string is correct
- Check your network firewall settings

### Authentication Failed

- Verify your username and password
- Check that you've replaced `<password>` in the connection string
- Make sure the user has the correct privileges

### Database Not Found

- Make sure you've specified the correct database name in your connection string
- The database will be created automatically when your first document is inserted