# Quick Deployment Guide for DigBizz Finances

Simple steps for deploying to https://digbizzfinances.netlify.app

## Build and Deploy

```bash
# One-step build and deploy
npm run deploy:digbizz
```

This command will:
1. Build your application
2. Deploy it directly to your Netlify site

## Environment Variables Setup

After deployment, set these environment variables at:
https://app.netlify.com/sites/digbizzfinances/settings/environment

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://arayas:zevgim-7mikze-tivTux@araya-first-mongodb.vsc6mri.mongodb.net/finance-chat?retryWrites=true&w=majority&appName=araya-first-mongodb` |
| `JWT_SECRET` | `digbizz_finance_chat_jwt_secret_production` |
| `JWT_EXPIRE` | `30d` |
| `NODE_ENV` | `production` |
| `SETUP_TOKEN` | `digbizz_setup_token_123456` |


## Create Admin User

After setting environment variables, create the admin user with Postman:

**POST** to: `https://digbizzfinances.netlify.app/.netlify/functions/register`

**Body**:
```json
{
  "token": "digbizz_setup_token_123456",
  "username": "Admin",
  "phone": "1234567890",
  "email": "admin@example.com", 
  "password": "your_secure_password"
}
```

## Accessing Your Site

Go to: https://digbizzfinances.netlify.app

Login with the admin credentials you created.