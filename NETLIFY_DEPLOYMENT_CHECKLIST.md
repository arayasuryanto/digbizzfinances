# Netlify Deployment Checklist

Follow these steps to deploy Finance Chat to Netlify:

## Pre-Deployment Checklist

- [ ] MongoDB Atlas is set up
- [ ] MongoDB connection string is available: 
  ```
  mongodb+srv://arayassuryanto:<db_password>@araya-first-mongodb.vsc6mri.mongodb.net/finance-chat?retryWrites=true&w=majority&appName=araya-first-mongodb
  ```
- [ ] Replace `<db_password>` with your actual MongoDB Atlas password
- [ ] All dependencies are installed: `npm run install:all`
- [ ] Application builds successfully: `npm run build`

## Deployment Steps

1. **Install Netlify CLI** (if not already installed)
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Netlify in your project**
   ```bash
   npm run deploy:init
   ```
   This will link your project to a new or existing Netlify site.

4. **Deploy to Netlify**
   ```bash
   npm run deploy:prod
   ```
   This will build your site and deploy it to Netlify.

## Post-Deployment Setup

1. **Set Environment Variables in Netlify**
   - Go to Netlify dashboard > Your site > Site settings > Build & deploy > Environment
   - Add these variables:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | `mongodb+srv://arayassuryanto:<db_password>@araya-first-mongodb.vsc6mri.mongodb.net/finance-chat?retryWrites=true&w=majority&appName=araya-first-mongodb` |
   | `JWT_SECRET` | `your_secure_random_token` |
   | `JWT_EXPIRE` | `30d` |
   | `NODE_ENV` | `production` |
   | `SETUP_TOKEN` | `your_secure_setup_token` |

2. **Trigger a new build** (to apply environment variables)
   - Go to Netlify dashboard > Your site > Deploys
   - Click "Trigger deploy" > "Deploy site"

3. **Create Admin User**
   ```bash
   npm run test:api
   ```
   Follow the prompts to create an admin user.

## Verification Steps

1. **Test the deployed API**
   ```bash
   npm run test:api
   ```
   This will test API endpoints and verify your deployment.

2. **Access your site**
   - Go to your Netlify site URL (e.g., https://your-site.netlify.app)
   - Login with the admin credentials you created
   - Verify you can create and view transactions

## Troubleshooting

If you encounter issues:

1. **Check function logs**
   - Go to Netlify dashboard > Your site > Functions
   - View logs for the API function

2. **Verify environment variables**
   - Double-check that all environment variables are set correctly
   - Make sure MongoDB URI has the correct password

3. **Test MongoDB connection**
   - Try connecting to your MongoDB Atlas from your local machine to verify credentials

4. **Check Network Access in MongoDB Atlas**
   - Ensure Atlas allows connections from anywhere (for Netlify Functions)
   - Go to MongoDB Atlas > Network Access > Add IP Address > Allow Access from Anywhere