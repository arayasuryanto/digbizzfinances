#!/bin/bash

# Exit on error
set -e

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies including dev dependencies
echo "Installing dependencies..."
# Force installation of devDependencies even in production
export NODE_ENV=development
npm install

# Make sure Vue CLI service is installed
if ! [ -x "$(command -v vue-cli-service)" ]; then
  echo "Installing Vue CLI service..."
  npm install --save-dev @vue/cli-service
fi

# Build the app
echo "Building the app..."
npm run build

# Install function dependencies
echo "Installing function dependencies..."
cd netlify/
npm install

echo "Build completed successfully!"