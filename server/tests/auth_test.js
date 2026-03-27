const axios = require('axios');

async function runTests() {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log('--- Auth Middleware Security Test ---');

  // Test 1: Missing Token
  try {
    console.log('Test 1: Missing Token...');
    await axios.get(`${baseUrl}/auth/sync`);
  } catch (err) {
    console.log(`Result: ${err.response.status} - ${err.response.data.error}`);
  }

  // Test 2: Invalid Token
  try {
    console.log('\nTest 2: Invalid Token...');
    await axios.get(`${baseUrl}/auth/sync`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });
  } catch (err) {
    console.log(`Result: ${err.response.status} - ${err.response.data.error}`);
  }

  console.log('\nNote: To test verified/unverified tokens, valid Firebase ID tokens are required.');
}

// runTests(); 
// Manual verification with a real token is recommended.
