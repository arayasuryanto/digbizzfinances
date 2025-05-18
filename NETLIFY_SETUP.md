# Netlify Setup Guide for Finance Chat

This is a simplified guide for deploying the Finance Chat application to Netlify using your MongoDB Atlas connection.

## Step 1: Initial Netlify Setup

Run these commands to set up and deploy to Netlify:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Log in to your Netlify account
netlify login

# Initialize Netlify in your project
npm run deploy:init

# Build and deploy to production
npm run deploy:prod
```

## Step 2: Environment Variables

After deployment, configure these environment variables in the Netlify dashboard:

1. Go to Site settings > Build & deploy > Environment
2. Add the following environment variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://arayassuryanto:<db_password>@araya-first-mongodb.vsc6mri.mongodb.net/finance-chat?retryWrites=true&w=majority&appName=araya-first-mongodb` |
| `JWT_SECRET` | `your_secure_random_token` |
| `JWT_EXPIRE` | `30d` |
| `NODE_ENV` | `production` |
| `SETUP_TOKEN` | `your_secure_setup_token` |

**Note:** Replace `<db_password>` with your actual MongoDB password.

## Step 3: Create Admin User

After setting up the environment variables, create the first admin user:

1. Use a tool like Postman or curl to send a POST request:

```
POST https://your-netlify-site.netlify.app/.netlify/functions/register
```

With JSON body:
```json
{
  "token": "your_setup_token",
  "username": "Admin",
  "phone": "1234567890",
  "email": "admin@example.com",
  "password": "secure_password"
}
```

2. This creates your first user, which you can use to log in to the application.

## Step 4: Verify Deployment

1. Visit your Netlify site URL
2. Log in with the admin user you created
3. Verify that you can create and view transactions

## Troubleshooting

If you encounter issues:

1. Check Netlify function logs in the Netlify dashboard
2. Verify that environment variables are set correctly
3. Make sure your MongoDB Atlas IP whitelist allows connections from anywhere (for Netlify Functions)

## Updating the App

To update your app after making changes:

```bash
# Build and deploy to production
npm run deploy:prod
```