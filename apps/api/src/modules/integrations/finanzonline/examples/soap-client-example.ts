/**
 * FinanzOnline SOAP Client Usage Examples
 *
 * This file demonstrates various usage patterns for the FinanzOnline SOAP client.
 * These are examples only - do not use in production without proper error handling
 * and security measures.
 */

import {
  createFinanzOnlineClient,
  FinanzOnlineClient,
  FinanzOnlineEnvironment,
  FinanzOnlineAuthType,
  LoginRequest,
} from '../finanzonline.client';

/**
 * Example 1: Basic Login and Logout
 */
async function basicLoginLogout() {
  console.log('=== Example 1: Basic Login and Logout ===\n');

  // Create client for test environment
  const client = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.TEST,
    debug: true,
  });

  try {
    // Login
    const loginRequest: LoginRequest = {
      teilnehmerId: '123456789', // Replace with actual Participant ID
      benId: 'testuser',         // Replace with actual User ID
      pin: '1234',               // Replace with actual PIN
      authType: FinanzOnlineAuthType.USER_PIN,
      herstellerId: 'OPERATE',
    };

    const loginResponse = await client.login(loginRequest);

    console.log('Login successful!');
    console.log('Session ID:', loginResponse.sessionId);
    console.log('Token:', loginResponse.sessionToken.substring(0, 10) + '...');
    console.log('Expires:', loginResponse.sessionExpires);
    console.log('');

    // Logout
    await client.logout({
      sessionId: loginResponse.sessionId,
    });

    console.log('Logout successful!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    client.destroy();
  }
}

/**
 * Example 2: Session Keep-Alive with Ping
 */
async function sessionKeepAlive() {
  console.log('\n=== Example 2: Session Keep-Alive ===\n');

  const client = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.TEST,
    debug: false,
  });

  try {
    // Login
    const loginResponse = await client.login({
      teilnehmerId: '123456789',
      benId: 'testuser',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
    });

    console.log('Logged in. Session ID:', loginResponse.sessionId);

    // Keep session alive with periodic pings
    for (let i = 1; i <= 3; i++) {
      console.log(`Ping ${i}...`);

      const pingResponse = await client.ping({
        sessionId: loginResponse.sessionId,
      });

      console.log('Session valid:', pingResponse.sessionValid);
      console.log('Expires:', pingResponse.sessionExpires);
      console.log('');

      // Wait 5 seconds before next ping
      await sleep(5000);
    }

    // Logout
    await client.logout({ sessionId: loginResponse.sessionId });
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.destroy();
  }
}

/**
 * Example 3: Get Participant Information
 */
async function getParticipantInformation() {
  console.log('\n=== Example 3: Get Participant Information ===\n');

  const client = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.TEST,
    debug: false,
  });

  try {
    // Login
    const loginResponse = await client.login({
      teilnehmerId: '123456789',
      benId: 'testuser',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
    });

    console.log('Logged in successfully');

    // Get participant info
    const participantResponse = await client.getParticipantInfo({
      teilnehmerId: '123456789',
      sessionId: loginResponse.sessionId,
    });

    const info = participantResponse.participantInfo;

    console.log('\nParticipant Information:');
    console.log('------------------------');
    console.log('Participant ID:', info.teilnehmerId);
    console.log('Type:', info.type);
    console.log('Company Name:', info.companyName || 'N/A');
    console.log('Tax Number:', info.taxNumber || 'N/A');
    console.log('VAT ID:', info.vatId || 'N/A');
    console.log('Status:', info.status);

    if (info.address) {
      console.log('\nAddress:');
      console.log('Street:', info.address.street);
      console.log('City:', info.address.city);
      console.log('Postal Code:', info.address.postalCode);
      console.log('Country:', info.address.country);
    }

    if (info.contact) {
      console.log('\nContact:');
      console.log('Email:', info.contact.email || 'N/A');
      console.log('Phone:', info.contact.phone || 'N/A');
    }

    // Logout
    await client.logout({ sessionId: loginResponse.sessionId });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.destroy();
  }
}

/**
 * Example 4: Session Management with Validation
 */
async function sessionManagement() {
  console.log('\n=== Example 4: Session Management ===\n');

  const client = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.TEST,
    debug: false,
  });

  try {
    // Login
    await client.login({
      teilnehmerId: '123456789',
      benId: 'testuser',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
    });

    // Check session status
    console.log('Session valid:', client.isSessionValid());

    // Get session details
    const session = client.getSession();
    if (session) {
      console.log('Session ID:', session.sessionId);
      console.log('Participant ID:', session.teilnehmerId);
      console.log('User ID:', session.benId);
      console.log('Created at:', session.createdAt);
      console.log('Expires at:', session.expiresAt);
      console.log('Environment:', session.environment);

      // Calculate remaining time
      const now = new Date();
      const remaining = session.expiresAt.getTime() - now.getTime();
      const minutes = Math.floor(remaining / 1000 / 60);
      console.log('Time remaining:', minutes, 'minutes');
    }

    // Logout
    await client.logout({ sessionId: session!.sessionId });
    console.log('\nLogged out');
    console.log('Session valid:', client.isSessionValid());
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.destroy();
  }
}

/**
 * Example 5: Error Handling
 */
async function errorHandling() {
  console.log('\n=== Example 5: Error Handling ===\n');

  const client = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.TEST,
    debug: false,
  });

  try {
    // Attempt login with invalid credentials
    await client.login({
      teilnehmerId: 'invalid',
      benId: 'invalid',
      pin: '0000',
      authType: FinanzOnlineAuthType.USER_PIN,
    });
  } catch (error) {
    console.log('Caught expected error:');
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
    console.log('Timestamp:', error.timestamp);

    // Handle specific error codes
    switch (error.code) {
      case 'E001':
        console.log('\nAction: Invalid credentials - please check login details');
        break;
      case 'E002':
        console.log('\nAction: Session expired - need to login again');
        break;
      case 'E004':
        console.log('\nAction: Service unavailable - retry later');
        break;
      default:
        console.log('\nAction: Unknown error - contact support');
    }
  } finally {
    client.destroy();
  }
}

/**
 * Example 6: Custom Configuration
 */
async function customConfiguration() {
  console.log('\n=== Example 6: Custom Configuration ===\n');

  const client = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.TEST,
    timeout: 60000,        // 60 second timeout
    maxRetries: 5,         // Retry up to 5 times
    retryDelay: 2000,      // Wait 2 seconds between retries
    debug: true,           // Enable debug logging
    tls: {
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      rejectUnauthorized: true,
    },
  });

  console.log('Client created with custom configuration');
  console.log('Timeout: 60s');
  console.log('Max Retries: 5');
  console.log('Retry Delay: 2s');
  console.log('TLS Version: 1.3');

  try {
    // Login with custom configured client
    const response = await client.login({
      teilnehmerId: '123456789',
      benId: 'testuser',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
    });

    console.log('\nLogin successful with custom configuration');

    // Logout
    await client.logout({ sessionId: response.sessionId });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.destroy();
  }
}

/**
 * Example 7: Multiple Clients (Production and Test)
 */
async function multipleEnvironments() {
  console.log('\n=== Example 7: Multiple Environments ===\n');

  // Create test client
  const testClient = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.TEST,
    debug: false,
  });

  // Create production client (for demonstration only)
  const prodClient = await createFinanzOnlineClient({
    environment: FinanzOnlineEnvironment.PRODUCTION,
    debug: false,
  });

  console.log('Created clients for both environments');
  console.log('Test Client:', testClient.getSession()?.environment || 'No session');
  console.log('Prod Client:', prodClient.getSession()?.environment || 'No session');

  // Use test client for testing
  try {
    const testSession = await testClient.login({
      teilnehmerId: '123456789',
      benId: 'testuser',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
    });

    console.log('\nTest login successful');
    console.log('Environment:', testClient.getSession()?.environment);

    await testClient.logout({ sessionId: testSession.sessionId });
  } catch (error) {
    console.error('Test client error:', error.message);
  }

  // Clean up
  testClient.destroy();
  prodClient.destroy();
}

/**
 * Utility function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('FinanzOnline SOAP Client Examples');
  console.log('==================================\n');

  // Note: In real usage, you would only run the examples you need
  // and would use actual credentials

  try {
    await basicLoginLogout();
    await sessionKeepAlive();
    await getParticipantInformation();
    await sessionManagement();
    await errorHandling();
    await customConfiguration();
    await multipleEnvironments();

    console.log('\n=== All Examples Completed ===');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Export examples for individual use
export {
  basicLoginLogout,
  sessionKeepAlive,
  getParticipantInformation,
  sessionManagement,
  errorHandling,
  customConfiguration,
  multipleEnvironments,
};

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
