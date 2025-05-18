# Netlify Deployment Guide for Finance Chat App

This guide walks you through deploying your Finance Chat application to Netlify, including both the frontend and the backend API.

## Prerequisites

1. A MongoDB Atlas account with a cluster set up (follow the instructions in `MONGODB_SETUP_INSTRUCTIONS.md`)
2. A [Netlify](https://www.netlify.com/) account (you can sign up for free)
3. The [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed (optional, but recommended)

## Step 1: Prepare Your Project for Deployment

### 1. Configure Environment Variables

Create a `.env` file in the root directory of your project with these variables:

```
VUE_APP_API_URL=/.netlify/functions/api
```

### 2. Update API Base URL

Ensure your frontend API client is using the correct base URL for production:

```javascript
// src/services/api.js
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5002/api',
  // ...
});
```

## Step 2: Set Up Netlify Functions

### 1. Create Netlify Function for API

We'll use Netlify Functions to proxy requests to our Express backend.

Make sure the following files exist:

1. `/netlify/functions/api.js` - This file proxies all API requests to your Express server

```javascript
// Check that this file exists and contains:
const proxy = require('http-proxy-middleware');
const serverless = require('serverless-http');
const express = require('express');
const app = express();

// Import your Express app
const backendApp = require('../../server/src');

// Use the app
app.use('/.netlify/functions/api', backendApp);

// Export handler for serverless
exports.handler = serverless(app);
```

## Step 3: Configure Netlify Settings

### 1. Add netlify.toml

Create or update `netlify.toml` in the root of your project:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "npm run serve"
  port = 8888
  targetPort = 8080
  publish = "dist"
  functionsPort = 9999

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Set Up Environment Variables in Netlify

When deploying, you'll need to add these environment variables in Netlify:

- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A secure secret for JWT tokens
- `JWT_EXPIRE` - JWT token expiration (e.g., "30d")
- `NODE_ENV` - Set to "production" for production deployments

## Step 4: Deploy to Netlify

### Option 1: Deploy via Netlify CLI (Recommended for Testing)

1. Install Netlify CLI if you haven't already:
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Initialize your site:
   ```
   netlify init
   ```

4. Deploy to Netlify:
   ```
   netlify deploy
   ```

5. For production deployment:
   ```
   netlify deploy --prod
   ```

### Option 2: Deploy via Netlify Web Interface

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Login to Netlify web interface
3. Click "New site from Git"
4. Choose your repository and branch
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add the environment variables in the site settings
7. Deploy the site

## Step 5: Verify Your Deployment

1. Check that your frontend is working correctly
2. Test the API endpoints through `/.netlify/functions/api/*`
3. Verify that user authentication and data persistence work properly

## Troubleshooting

### MongoDB Connection Issues

- Make sure your MongoDB Atlas IP whitelist includes Netlify's IPs or is set to allow access from anywhere
- Check Netlify Function logs for any MongoDB connection errors

### API Endpoint Issues

- Make sure your frontend is using the correct API URL (`/.netlify/functions/api`)
- Check Netlify Function logs for any errors
- Verify that your API routes are working correctly

### Deployment Failures

- Check Netlify build logs for any errors
- Ensure all required dependencies are included in your package.json files
- Verify that your build command and publish directory are set correctly

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)