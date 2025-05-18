/**
 * Test script for minimal authentication server
 */
const axios = require('axios');

// Base URL for the API
const API_URL = 'http://localhost:5002/api';

// Test data
const testUser = {
  name: 'Test User ' + Date.now(),
  phone: 'test' + Date.now(),
  password: 'password123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper function to log with colors
const log = {
  info: (msg) => console.log(colors.blue + '➡️ ' + msg + colors.reset),
  success: (msg) => console.log(colors.green + '✅ ' + msg + colors.reset),
  error: (msg) => console.log(colors.red + '❌ ' + msg + colors.reset),
  warning: (msg) => console.log(colors.yellow + '⚠️ ' + msg + colors.reset),
  step: (msg) => console.log(colors.magenta + '\n== ' + msg + ' ==' + colors.reset)
};

// Test functions
async function testRegistration() {
  log.step('TESTING REGISTRATION');
  
  try {
    log.info(`Registering user with phone: ${testUser.phone}`);
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    
    if (response.data.success && response.data.token && response.data.user) {
      log.success('Registration successful!');
      log.info(`User ID: ${response.data.user.id}`);
      log.info(`Token: ${response.data.token.substring(0, 20)}...`);
      return response.data;
    } else {
      log.error('Registration response format incorrect');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    log.error('Registration failed with error:');
    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
    return null;
  }
}

async function testLogin(phone, password) {
  log.step('TESTING LOGIN');
  
  try {
    log.info(`Logging in with phone: ${phone}`);
    const response = await axios.post(`${API_URL}/auth/login`, { phone, password });
    
    if (response.data.success && response.data.token && response.data.user) {
      log.success('Login successful!');
      log.info(`User ID: ${response.data.user.id}`);
      log.info(`Token: ${response.data.token.substring(0, 20)}...`);
      return response.data;
    } else {
      log.error('Login response format incorrect');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    log.error('Login failed with error:');
    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
    return null;
  }
}

async function testGetProfile(token) {
  log.step('TESTING GET PROFILE');
  
  try {
    log.info('Getting user profile');
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data) {
      log.success('Get profile successful!');
      log.info(`User name: ${response.data.data.name}`);
      log.info(`User phone: ${response.data.data.phone}`);
      return response.data;
    } else {
      log.error('Get profile response format incorrect');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    log.error('Get profile failed with error:');
    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
    return null;
  }
}

// Run the tests
async function runTests() {
  log.info('Starting authentication tests...');
  
  // Test registration
  const registrationData = await testRegistration();
  if (!registrationData) {
    log.error('Registration test failed, cannot continue');
    return;
  }
  
  // Test login
  const loginData = await testLogin(testUser.phone, testUser.password);
  if (!loginData) {
    log.error('Login test failed, cannot continue');
    return;
  }
  
  // Test get profile
  const profileData = await testGetProfile(loginData.token);
  if (!profileData) {
    log.error('Get profile test failed');
    return;
  }
  
  log.step('ALL TESTS COMPLETED SUCCESSFULLY');
  log.success('The authentication system is working correctly!');
  log.success('You can now use these credentials to log in:');
  log.info(`Phone: ${testUser.phone}`);
  log.info(`Password: ${testUser.password}`);
}

// Run the tests
runTests().catch(error => {
  log.error('Unhandled error in tests:');
  console.error(error);
});