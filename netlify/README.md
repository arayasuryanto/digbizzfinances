# Finance Chat Netlify Deployment

This directory contains the Netlify Functions configuration for the Finance Chat backend API.

## Functions

- **api.js** - The main serverless function that handles all API requests
- **register.js** - A special function for initial user setup

## Environment Variables

Make sure to set these environment variables in the Netlify dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-chat
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d
NODE_ENV=production
SETUP_TOKEN=your_secure_setup_token_for_first_admin_registration
```

## Setting Up the First Admin User

After deploying to Netlify, you can set up the first admin user by making a POST request to the registration function:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_setup_token",
    "username": "Admin",
    "phone": "1234567890",
    "email": "admin@example.com",
    "password": "securepassword123"
  }'
```

Or use a tool like Postman or Insomnia to make the request.

## Function URLs

- Main API: `https://your-site.netlify.app/.netlify/functions/api`
- Registration: `https://your-site.netlify.app/.netlify/functions/register`

## API Routes

All API routes follow this pattern:

- Auth: `/.netlify/functions/api/auth/...`
- Business: `/.netlify/functions/api/business/...`
- Transactions: `/.netlify/functions/api/transactions/...`
- Messages: `/.netlify/functions/api/messages/...`

## Development

For local development:

1. Create a `.env` file in the root directory with the required environment variables
2. Run `npm run netlify:dev` to start the Netlify development server

## Troubleshooting

- Check Netlify Function logs in the Netlify dashboard
- Verify MongoDB connection string is correct
- Check that all environment variables are properly set

For more detailed information, see the main deployment guide: [NETLIFY_DEPLOYMENT.md](../NETLIFY_DEPLOYMENT.md)