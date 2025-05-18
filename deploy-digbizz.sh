#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== DigBizz Finances Deployment Script ===${NC}"
echo -e "This script will build and deploy to https://digbizzfinances.netlify.app"
echo

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status | grep -q "Logged in"; then
    echo -e "${YELLOW}You are not logged in to Netlify. Please login:${NC}"
    netlify login
fi

# Build the application
echo -e "${GREEN}Building the application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Aborting deployment.${NC}"
    exit 1
fi

# Deploy to Netlify (manual path)
echo -e "${GREEN}Deploying to Netlify...${NC}"
netlify deploy --prod --dir=dist --site=digbizzfinances

echo
echo -e "${GREEN}=== Post-Deployment Steps ===${NC}"
echo "1. Set these environment variables in the Netlify dashboard:"
echo "   https://app.netlify.com/sites/digbizzfinances/settings/environment"
echo
echo "   - MONGODB_URI: mongodb+srv://arayas:zevgim-7mikze-tivTux@araya-first-mongodb.vsc6mri.mongodb.net/finance-chat?retryWrites=true&w=majority&appName=araya-first-mongodb"
echo "   - JWT_SECRET: digbizz_finance_chat_jwt_secret_production"
echo "   - JWT_EXPIRE: 30d"
echo "   - NODE_ENV: production"
echo "   - SETUP_TOKEN: digbizz_setup_token_123456"
echo
echo "2. Create the first admin user by sending a POST request to:"
echo "   https://digbizzfinances.netlify.app/.netlify/functions/register"
echo "   With this JSON body:"
echo '   {
     "token": "digbizz_setup_token_123456",
     "username": "Admin",
     "phone": "1234567890",
     "email": "admin@example.com",
     "password": "your_secure_password"
   }'
echo
echo -e "${GREEN}Deployment completed!${NC}"