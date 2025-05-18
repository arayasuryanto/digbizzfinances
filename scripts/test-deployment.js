#!/usr/bin/env node

// This script tests the deployed API endpoints

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Log with colors
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Ask for input
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Test API endpoints
async function testApi() {
  log('=== Finance Chat API Test ===', 'blue');
  
  // Get site URL
  const siteUrl = await ask('Enter your Netlify site URL (e.g., https://your-site.netlify.app): ');
  const baseUrl = `${siteUrl.trim()}/.netlify/functions/api`;
  
  log(`\nTesting API at: ${baseUrl}`, 'yellow');
  
  // Test endpoints
  try {
    // Test basic endpoint
    log('\nTesting base endpoint...', 'yellow');
    const { data: baseData } = await axios.get(baseUrl);
    log(`✓ Base endpoint response: ${JSON.stringify(baseData)}`, 'green');
    
    // Test auth endpoint with invalid credentials
    log('\nTesting auth endpoint with invalid credentials (should fail)...', 'yellow');
    try {
      await axios.post(`${baseUrl}/auth/login`, {
        phone: '1234567890',
        password: 'wrongpassword'
      });
      log('✗ Auth endpoint did not reject invalid credentials', 'red');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log('✓ Auth endpoint correctly rejected invalid credentials', 'green');
      } else {
        throw error;
      }
    }
    
    // Create an admin user if needed
    const createAdmin = await ask('\nDo you want to create an admin user? (y/n): ');
    if (createAdmin.toLowerCase() === 'y') {
      const setupToken = await ask('Enter your SETUP_TOKEN: ');
      const username = await ask('Enter admin username: ');
      const phone = await ask('Enter admin phone: ');
      const password = await ask('Enter admin password: ');
      const email = await ask('Enter admin email (optional): ');
      
      log('\nCreating admin user...', 'yellow');
      try {
        const { data: registerData } = await axios.post(`${siteUrl.trim()}/.netlify/functions/register`, {
          token: setupToken,
          username,
          phone,
          password,
          email: email || undefined
        });
        log(`✓ Admin user created: ${JSON.stringify(registerData)}`, 'green');
      } catch (error) {
        log(`✗ Failed to create admin user: ${error.response?.data?.message || error.message}`, 'red');
      }
    }
    
    // Try logging in with created credentials
    const tryLogin = await ask('\nDo you want to test login with credentials? (y/n): ');
    if (tryLogin.toLowerCase() === 'y') {
      const phone = await ask('Enter phone: ');
      const password = await ask('Enter password: ');
      
      log('\nTesting login...', 'yellow');
      try {
        const { data: loginData } = await axios.post(`${baseUrl}/auth/login`, {
          phone,
          password
        });
        log(`✓ Login successful! User: ${loginData.user.name}`, 'green');
        log(`✓ JWT Token received (save this for testing protected endpoints): ${loginData.token}`, 'green');
      } catch (error) {
        log(`✗ Login failed: ${error.response?.data?.error || error.message}`, 'red');
      }
    }
    
    log('\nTest completed!', 'blue');
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  } finally {
    rl.close();
  }
}

// Run the tests
testApi().catch(error => {
  console.error('Unhandled error:', error);
  rl.close();
});