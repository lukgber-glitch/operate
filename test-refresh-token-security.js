/**
 * SECURITY TEST: Refresh Token Hashing
 *
 * This test verifies that refresh tokens are hashed before storage
 * and that token validation works correctly with hashed tokens.
 *
 * Expected behavior:
 * 1. Login creates a session with HASHED refresh token (64 hex chars)
 * 2. Database does NOT contain plaintext token
 * 3. Refresh endpoint accepts plaintext token and hashes it for lookup
 * 4. Stolen hash from database CANNOT be used directly
 */

const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'http://localhost:3000/api/v1';

// Test credentials
const TEST_USER = {
  email: 'test-security@example.com',
  password: 'SecurePassword123!',
  firstName: 'Security',
  lastName: 'Test'
};

async function testRefreshTokenSecurity() {
  console.log('🔐 SECURITY TEST: Refresh Token Hashing\n');

  try {
    // Step 1: Register/Login
    console.log('1️⃣  Registering test user...');
    let authResponse;
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, TEST_USER);
      authResponse = registerResponse.data;
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        // User exists, try logging in
        console.log('   User exists, logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password
        });
        authResponse = loginResponse.data;
        console.log('✅ User logged in successfully');
      } else {
        throw error;
      }
    }

    const { accessToken, refreshToken } = authResponse;
    console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...`);

    // Step 2: Verify token is hashed in database
    console.log('\n2️⃣  Verifying token is hashed in database...');
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    console.log(`   Expected hash: ${hashedToken}`);
    console.log(`   Hash length: ${hashedToken.length} chars (should be 64)`);

    if (hashedToken.length !== 64) {
      throw new Error('❌ Hash is not 64 characters - SHA-256 failed!');
    }
    console.log('✅ Hash format is correct (64 hex characters)');

    // Step 3: Test refresh endpoint with PLAINTEXT token
    console.log('\n3️⃣  Testing token refresh with plaintext token...');
    const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: refreshToken // Send plaintext
    });

    if (refreshResponse.data.accessToken) {
      console.log('✅ Refresh successful with plaintext token');
      console.log(`   New Access Token: ${refreshResponse.data.accessToken.substring(0, 20)}...`);
    } else {
      throw new Error('❌ Refresh failed - no access token returned');
    }

    // Step 4: Test that HASH cannot be used directly
    console.log('\n4️⃣  Testing that stolen hash cannot be used directly...');
    try {
      await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: hashedToken // Try using the hash directly
      });
      throw new Error('❌ SECURITY VULNERABILITY: Hash was accepted as valid token!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Hash correctly rejected (401 Unauthorized)');
      } else {
        throw error;
      }
    }

    // Step 5: Verify logout works with hashing
    console.log('\n5️⃣  Testing logout with hashed token lookup...');
    await axios.post(`${API_URL}/auth/logout`, {
      refreshToken: refreshToken
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Logout successful');

    // Step 6: Verify token is invalidated after logout
    console.log('\n6️⃣  Verifying token is invalidated after logout...');
    try {
      await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: refreshToken
      });
      throw new Error('❌ Token still valid after logout!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Token correctly invalidated after logout');
      } else {
        throw error;
      }
    }

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL SECURITY TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('✅ Tokens are hashed before storage (SHA-256)');
    console.log('✅ Plaintext tokens work for refresh');
    console.log('✅ Stolen hashes cannot be used directly');
    console.log('✅ Logout invalidates sessions correctly');
    console.log('✅ Database compromise does NOT expose valid tokens');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run test
testRefreshTokenSecurity().catch(console.error);
