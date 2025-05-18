# Netlify Deployment Guide

This guide walks you through deploying the Finance Chat application to Netlify.

## Prerequisites

- A GitHub repository with your project code
- A MongoDB Atlas cluster (see [MONGODB_SETUP.md](MONGODB_SETUP.md))
- A Netlify account

## Step 1: Connect Your Repository to Netlify

1. Log in to [Netlify](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your Finance Chat repository
6. Configure build settings:
   - Branch to deploy: `main` (or your preferred branch)
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Deploy site"

## Step 2: Configure Environment Variables

1. Go to your site dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Click "Edit variables" and add the following:

| Key | Value | Description |
|-----|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-secret-key` | A secure random string for JWT tokens |
| `JWT_EXPIRE` | `30d` | JWT expiration time |
| `NODE_ENV` | `production` | Environment mode |

For generating a secure JWT secret, you can use:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Enable Netlify Functions

The project is already configured to use Netlify Functions through the `netlify.toml` file. Make sure you have the following settings enabled:

1. Go to Functions in your site dashboard
2. Check that Functions are enabled
3. Verify the Functions directory is set to `netlify/functions`

## Step 4: Deploy Your Site

1. Trigger a new deploy by going to "Deploys" in your site dashboard
2. Click "Trigger deploy" > "Deploy site"
3. Wait for the build and deployment to complete

## Step 5: Test Your Deployment

1. Check the deployment logs for any errors
2. Visit your deployed site URL
3. Test the following functionality:
   - User registration and login
   - Transaction creation
   - Viewing reports

## Step 6: Custom Domain (Optional)

1. Go to "Domain settings" in your site dashboard
2. Click "Add custom domain"
3. Follow the instructions to configure your domain

## Step 7: HTTPS and SSL

Netlify automatically configures SSL for your site. Check the following:

1. Go to "Domain settings" > "HTTPS"
2. Verify that HTTPS is enabled
3. Check the status of your SSL certificate

## Troubleshooting Netlify Deployments

### Build Failures

- Check your build logs for errors
- Verify that your package.json scripts are correct
- Make sure all dependencies are installed

### Function Errors

- Check function logs in the "Functions" section
- Verify environment variables are set correctly
- Check MongoDB connection string for errors

### CORS Issues

- Verify CORS settings in your Express setup
- Check that the API URL in your frontend code is correct

## Monitoring and Analytics

Netlify provides basic analytics for your site:

1. Go to "Analytics" in your site dashboard
2. Monitor page views, unique visitors, and bandwidth usage

For more detailed analytics, consider adding Google Analytics or similar services.

## Continuous Deployment

Netlify automatically deploys changes when you push to your repository. To manage deployments:

1. Go to "Deploys" in your site dashboard
2. Use "Deploy settings" to configure branch deployments
3. Set up deploy contexts in your `netlify.toml` file

## Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify Build Hooks](https://docs.netlify.com/configure-builds/build-hooks/)
- [Netlify Identity](https://docs.netlify.com/visitor-access/identity/)