#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
  if [ "$1" = "success" ]; then
    echo -e "${GREEN}✓ $2${NC}"
  elif [ "$1" = "warning" ]; then
    echo -e "${YELLOW}⚠ $2${NC}"
  elif [ "$1" = "error" ]; then
    echo -e "${RED}✗ $2${NC}"
  else
    echo -e "$2"
  fi
}

print_header() {
  echo -e "\n${GREEN}===${NC} $1 ${GREEN}===${NC}\n"
}

# Check for required files
print_header "Checking required files"

# Check if .env.production exists
if [ -f ".env.production" ]; then
  print_status "success" "Found .env.production"
else
  print_status "error" "Missing .env.production file"
  exit 1
fi

# Check netlify.toml
if [ -f "netlify.toml" ]; then
  print_status "success" "Found netlify.toml"
else
  print_status "error" "Missing netlify.toml file"
  exit 1
fi

# Check netlify function
if [ -f "netlify/functions/api.js" ]; then
  print_status "success" "Found Netlify function"
else
  print_status "error" "Missing Netlify function (netlify/functions/api.js)"
  exit 1
fi

# Install dependencies if needed
print_header "Checking dependencies"

if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "netlify/node_modules" ]; then
  print_status "warning" "Some dependencies may not be installed"
  read -p "Run npm run install:all? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run install:all
  fi
else
  print_status "success" "Dependencies appear to be installed"
fi

# Build test
print_header "Testing build process"
print_status "warning" "This will run a test build"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if npm run build; then
    print_status "success" "Build successful"
  else
    print_status "error" "Build failed"
    exit 1
  fi
else
  print_status "warning" "Build test skipped"
fi

# Netlify CLI check
print_header "Checking Netlify CLI"
if command -v netlify &> /dev/null; then
  print_status "success" "Netlify CLI found"
  
  # Check if logged in
  if netlify status | grep -q "Logged in"; then
    print_status "success" "Logged in to Netlify"
  else
    print_status "warning" "Not logged in to Netlify"
    read -p "Log in now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      netlify login
    fi
  fi
else
  print_status "warning" "Netlify CLI not found"
  read -p "Install Netlify CLI globally? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g netlify-cli
    netlify login
  fi
fi

# MongoDB check
print_header "Checking MongoDB connection"
print_status "warning" "This will try to connect to your MongoDB database"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Create a temporary script to test MongoDB connection
  cat > test-mongodb.js << 'EOL'
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  console.error('MongoDB connection string not found in server/.env');
  process.exit(1);
}

async function testConnection() {
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connection successful');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
EOL

  # Run the test script
  if node test-mongodb.js; then
    print_status "success" "MongoDB connection successful"
  else
    print_status "error" "MongoDB connection failed"
    print_status "warning" "Please check your MongoDB connection string in server/.env"
  fi
  
  # Clean up
  rm test-mongodb.js
else
  print_status "warning" "MongoDB connection test skipped"
fi

# Deployment instructions
print_header "Deployment Instructions"
echo "To deploy to Netlify, follow these steps:"
echo ""
echo "1. Push your changes to GitHub"
echo "2. Connect your repository to Netlify"
echo "3. Configure the build settings:"
echo "   - Build command: npm run build"
echo "   - Publish directory: dist"
echo "4. Add environment variables in Netlify dashboard:"
echo "   - MONGODB_URI: your MongoDB connection string"
echo "   - JWT_SECRET: a secure random string"
echo "   - JWT_EXPIRE: 30d"
echo "   - NODE_ENV: production"
echo ""
echo "For detailed instructions, see NETLIFY_DEPLOYMENT.md"
echo ""

print_status "success" "Preparation complete! Your app is ready to deploy."