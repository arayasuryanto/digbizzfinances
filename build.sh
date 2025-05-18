#!/bin/bash

# Exit on error
set -e

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the app
echo "Building the app..."
npm run build

# Install function dependencies
echo "Installing function dependencies..."
cd netlify/
npm install

echo "Build completed successfully!"