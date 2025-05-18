# Manual Deployment Guide for DigBizz Finances

Follow these steps to deploy your Finance Chat application to Netlify at https://digbizzfinances.netlify.app

## Step 1: Build the Application Locally

First, build the application locally:

```bash
# Install dependencies 
npm install

# Build the application
npm run build
```

## Step 2: Deploy to Netlify

Deploy the built application to Netlify:

```bash
# Deploy to Netlify (preview)
npm run deploy

# Deploy to production
npm run deploy:prod
```

If you're consistently getting build errors on Netlify, you can try the manual deploy approach:

```bash
# Build locally then deploy the built files
npm run build
netlify deploy --prod --dir=dist
```

## Step 3: Configure Netlify Environment Variables

After deployment, configure these environment variables in the Netlify dashboard:

1. Go to: https://app.netlify.com/sites/digbizzfinances/settings/environment
2. Add the following environment variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://arayas:zevgim-7mikze-tivTux@araya-first-mongodb.vsc6mri.mongodb.net/finance-chat?retryWrites=true&w=majority&appName=araya-first-mongodb` |
| `JWT_SECRET` | `digbizz_finance_chat_jwt_secret_production` |
| `JWT_EXPIRE` | `30d` |
| `NODE_ENV` | `production` |
| `SETUP_TOKEN` | `digbizz_setup_token_123456` |


## Step 4: Create Admin User

After setting environment variables, create your first admin user:

1. Use Postman or curl to send a POST request to:
   ```
   https://digbizzfinances.netlify.app/.netlify/functions/register
   ```

2. With this JSON body:
   ```json
   {
     "token": "digbizz_setup_token_123456",
     "username": "Admin",
     "phone": "1234567890",
     "email": "admin@example.com",
     "password": "your_secure_password"
   }
   ```

## Step 5: Test Your Deployment

Use the testing script to verify your deployment:

```bash
npm run test:api
```

When prompted, enter:
- Netlify site URL: `https://digbizzfinances.netlify.app`
- Follow the prompts to test login with your admin credentials

## Troubleshooting

If you encounter issues:

1. **Build Errors**
   Run a manual deployment:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

2. **Function Errors**
   - Check Netlify Function logs in the dashboard
   - Try running functions locally: `netlify dev`

3. **MongoDB Connection Issues**
   - Ensure your MongoDB Atlas cluster allows connections from anywhere
   - Double-check your MongoDB connection string
   - Verify database name is correctly set to `finance-chat`

4. **Deployment Issues**
   - Try using the Netlify UI to manually upload the `dist` folder
   - Go to Deploys > Deploy manually > Drag and drop the `dist` directory

## Updating Your Application

After making changes:

```bash
# Build and deploy to production
npm run deploy:full
```