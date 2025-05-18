# Deployment Checklist

Use this checklist to ensure your application is ready for production deployment.

## Before Pushing to GitHub

- [ ] All development and debug code is removed
- [ ] No hard-coded API keys or sensitive data in code
- [ ] Environment variables are properly configured
- [ ] Tests pass (if applicable)
- [ ] Application builds without errors: `npm run build`
- [ ] Frontend routes are working correctly
- [ ] API endpoints are working correctly
- [ ] MongoDB connection is configured properly
- [ ] Authentication flow is working
- [ ] CORS settings are configured correctly

## MongoDB Atlas Setup

- [ ] MongoDB Atlas cluster is created
- [ ] Database user with proper permissions is created
- [ ] Network access is properly configured
- [ ] Connection string is noted for use in environment variables
- [ ] Database indexes are created (optional, will be created automatically)

## Netlify Configuration

- [ ] `netlify.toml` is configured correctly
- [ ] Build settings are correct: 
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] Netlify Functions directory is set to `netlify/functions`
- [ ] Environment variables are added to Netlify:
  - `MONGODB_URI`: MongoDB Atlas connection string
  - `JWT_SECRET`: Secure random string for JWT tokens
  - `JWT_EXPIRE`: Token expiration time (e.g., "30d")
  - `NODE_ENV`: Set to "production"
  - `SETUP_TOKEN`: Secure token for initial admin setup

## After Deployment

- [ ] Verify site loads correctly at Netlify URL
- [ ] Check that API endpoints are working
- [ ] Create initial admin user using the register function
- [ ] Test user registration and login
- [ ] Test transaction creation and management
- [ ] Test reports and data visualization
- [ ] Check mobile responsiveness
- [ ] Verify that proper error handling works
- [ ] Test network disconnection handling

## Custom Domain (Optional)

- [ ] Configure custom domain in Netlify
- [ ] Set up HTTPS and SSL certificate
- [ ] Verify DNS settings
- [ ] Test site with custom domain

## Monitoring and Analytics

- [ ] Set up Netlify analytics (or alternate analytics)
- [ ] Configure error monitoring (optional)
- [ ] Test notification systems (if applicable)

## Final Steps

- [ ] Create backup of local development environment
- [ ] Document any manual deployment steps
- [ ] Share access credentials with team members (if applicable)
- [ ] Create backup plan for database data

## Running the Deployment

```bash
# Final build test
npm run build

# Deploy to Netlify
npm run deploy
```

After deployment, set up the initial admin user by making a POST request to:
`https://your-site.netlify.app/.netlify/functions/register`

For detailed instructions, refer to:
- [MONGODB_SETUP.md](MONGODB_SETUP.md)
- [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md)
- [BACKEND_SETUP.md](BACKEND_SETUP.md)