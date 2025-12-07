const https = require('https');
const http = require('http');

// Test configuration
const API_BASE = 'https://operate.guru/api/v1';
const results = [];

// Helper to make API requests
function makeRequest(method, path, authToken = null, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Add test result
function addResult(module, endpoint, method, status, statusCode, message, response = null) {
  results.push({
    module,
    endpoint: `${method} ${endpoint}`,
    status,
    statusCode,
    message,
    response: response ? JSON.stringify(response).substring(0, 200) : null
  });
  console.log(`[${status}] ${module} - ${method} ${endpoint} (${statusCode}) - ${message}`);
}

async function testEndpoint(module, method, path, authToken = null, body = null) {
  try {
    const response = await makeRequest(method, path, authToken, body);
    const statusCode = response.statusCode;

    if (statusCode === 404) {
      addResult(module, path, method, 'NOT_FOUND', statusCode, 'Endpoint does not exist');
    } else if (statusCode === 401) {
      addResult(module, path, method, 'UNAUTHORIZED', statusCode, 'Requires authentication');
    } else if (statusCode === 403) {
      addResult(module, path, method, 'FORBIDDEN', statusCode, 'Permission denied');
    } else if (statusCode >= 500) {
      addResult(module, path, method, 'ERROR', statusCode, 'Server error', response.body);
    } else if (statusCode >= 200 && statusCode < 300) {
      addResult(module, path, method, 'EXISTS', statusCode, 'Success', response.body);
    } else if (statusCode >= 400 && statusCode < 500) {
      addResult(module, path, method, 'CLIENT_ERROR', statusCode, 'Client error', response.body);
    } else {
      addResult(module, path, method, 'UNKNOWN', statusCode, 'Unexpected status', response.body);
    }

    return response;
  } catch (error) {
    addResult(module, path, method, 'ERROR', 0, `Request failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('=====================================');
  console.log('OPERATE API ENDPOINT TEST SUITE');
  console.log('=====================================');
  console.log('API Base:', API_BASE);
  console.log('Started:', new Date().toISOString());
  console.log('=====================================\n');

  // No auth token for now - we'll test what's available publicly and what requires auth
  const authToken = null;

  // HEALTH & SYSTEM ENDPOINTS
  console.log('\n--- HEALTH & SYSTEM ---');
  await testEndpoint('Health', 'GET', '/health');
  await testEndpoint('Health', 'GET', '/health/ready');
  await testEndpoint('Health', 'GET', '/health/live');
  await testEndpoint('System', 'GET', '/metrics');
  await testEndpoint('System', 'GET', '/version');
  await testEndpoint('System', 'GET', '/status');

  // AUTHENTICATION ENDPOINTS
  console.log('\n--- AUTHENTICATION ---');
  await testEndpoint('Auth', 'POST', '/auth/login');
  await testEndpoint('Auth', 'POST', '/auth/register');
  await testEndpoint('Auth', 'POST', '/auth/logout');
  await testEndpoint('Auth', 'POST', '/auth/refresh');
  await testEndpoint('Auth', 'GET', '/auth/me', authToken);
  await testEndpoint('Auth', 'GET', '/auth/google');
  await testEndpoint('Auth', 'GET', '/auth/google/callback');

  // USER ENDPOINTS
  console.log('\n--- USERS ---');
  await testEndpoint('Users', 'GET', '/users', authToken);
  await testEndpoint('Users', 'GET', '/users/me', authToken);
  await testEndpoint('Users', 'PATCH', '/users/me', authToken);

  // EMPLOYEES / HR ENDPOINTS
  console.log('\n--- EMPLOYEES / HR ---');
  await testEndpoint('Employees', 'GET', '/employees', authToken);
  await testEndpoint('Employees', 'POST', '/employees', authToken);
  await testEndpoint('Employees', 'GET', '/employees/1', authToken);
  await testEndpoint('Employees', 'PATCH', '/employees/1', authToken);
  await testEndpoint('Employees', 'DELETE', '/employees/1', authToken);

  // PAYROLL ENDPOINTS
  console.log('\n--- PAYROLL ---');
  await testEndpoint('Payroll', 'GET', '/payroll', authToken);
  await testEndpoint('Payroll', 'POST', '/payroll', authToken);
  await testEndpoint('Payroll', 'GET', '/payroll/1', authToken);
  await testEndpoint('Payroll', 'POST', '/payroll/1/process', authToken);
  await testEndpoint('Payroll', 'GET', '/payroll/runs', authToken);

  // TAX / ELSTER ENDPOINTS
  console.log('\n--- TAX / ELSTER ---');
  await testEndpoint('Tax', 'GET', '/tax/elster/status', authToken);
  await testEndpoint('Tax', 'POST', '/tax/elster/connect', authToken);
  await testEndpoint('Tax', 'POST', '/tax/elster/ustva', authToken);
  await testEndpoint('Tax', 'GET', '/tax/elster/submissions', authToken);
  await testEndpoint('Tax', 'GET', '/tax/returns', authToken);
  await testEndpoint('Tax', 'POST', '/tax/returns', authToken);

  // DOCUMENTS ENDPOINTS
  console.log('\n--- DOCUMENTS ---');
  await testEndpoint('Documents', 'GET', '/documents', authToken);
  await testEndpoint('Documents', 'POST', '/documents/upload', authToken);
  await testEndpoint('Documents', 'GET', '/documents/1', authToken);
  await testEndpoint('Documents', 'DELETE', '/documents/1', authToken);
  await testEndpoint('Documents', 'POST', '/documents/1/process', authToken);

  // CONTACTS / CUSTOMERS ENDPOINTS
  console.log('\n--- CONTACTS / CUSTOMERS ---');
  await testEndpoint('Contacts', 'GET', '/contacts', authToken);
  await testEndpoint('Contacts', 'POST', '/contacts', authToken);
  await testEndpoint('Contacts', 'GET', '/contacts/1', authToken);
  await testEndpoint('Contacts', 'PATCH', '/contacts/1', authToken);
  await testEndpoint('Contacts', 'DELETE', '/contacts/1', authToken);

  // ORGANIZATIONS ENDPOINTS
  console.log('\n--- ORGANIZATIONS ---');
  await testEndpoint('Organizations', 'GET', '/organizations', authToken);
  await testEndpoint('Organizations', 'POST', '/organizations', authToken);
  await testEndpoint('Organizations', 'GET', '/organizations/1', authToken);
  await testEndpoint('Organizations', 'PATCH', '/organizations/1', authToken);

  // SETTINGS ENDPOINTS
  console.log('\n--- SETTINGS ---');
  await testEndpoint('Settings', 'GET', '/settings', authToken);
  await testEndpoint('Settings', 'PATCH', '/settings', authToken);
  await testEndpoint('Settings', 'GET', '/settings/preferences', authToken);

  // TRANSACTIONS / BANKING ENDPOINTS
  console.log('\n--- TRANSACTIONS / BANKING ---');
  await testEndpoint('Transactions', 'GET', '/transactions', authToken);
  await testEndpoint('Transactions', 'GET', '/transactions/1', authToken);
  await testEndpoint('Banking', 'GET', '/banking/accounts', authToken);
  await testEndpoint('Banking', 'POST', '/banking/sync', authToken);

  // INVOICES / BILLING ENDPOINTS
  console.log('\n--- INVOICES / BILLING ---');
  await testEndpoint('Invoices', 'GET', '/invoices', authToken);
  await testEndpoint('Invoices', 'POST', '/invoices', authToken);
  await testEndpoint('Invoices', 'GET', '/invoices/1', authToken);
  await testEndpoint('Invoices', 'PATCH', '/invoices/1', authToken);

  // CHAT / AI ENDPOINTS
  console.log('\n--- CHAT / AI ---');
  await testEndpoint('Chat', 'GET', '/chat/conversations', authToken);
  await testEndpoint('Chat', 'POST', '/chat/conversations', authToken);
  await testEndpoint('Chat', 'POST', '/chat/messages', authToken);
  await testEndpoint('Chat', 'GET', '/chat/messages', authToken);

  // ONBOARDING ENDPOINTS
  console.log('\n--- ONBOARDING ---');
  await testEndpoint('Onboarding', 'GET', '/onboarding/status', authToken);
  await testEndpoint('Onboarding', 'POST', '/onboarding/complete', authToken);
  await testEndpoint('Onboarding', 'PATCH', '/onboarding/step', authToken);

  // WEBHOOKS ENDPOINTS
  console.log('\n--- WEBHOOKS ---');
  await testEndpoint('Webhooks', 'POST', '/webhooks/stripe', authToken);
  await testEndpoint('Webhooks', 'POST', '/webhooks/plaid', authToken);
  await testEndpoint('Webhooks', 'POST', '/webhooks/tink', authToken);

  // Generate Report
  console.log('\n\n=====================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('=====================================');

  const summary = {
    total: results.length,
    exists: results.filter(r => r.status === 'EXISTS').length,
    notFound: results.filter(r => r.status === 'NOT_FOUND').length,
    unauthorized: results.filter(r => r.status === 'UNAUTHORIZED').length,
    forbidden: results.filter(r => r.status === 'FORBIDDEN').length,
    clientError: results.filter(r => r.status === 'CLIENT_ERROR').length,
    serverError: results.filter(r => r.status === 'ERROR').length,
    unknown: results.filter(r => r.status === 'UNKNOWN').length
  };

  console.log(`Total Endpoints Tested: ${summary.total}`);
  console.log(`Exists (2xx):           ${summary.exists}`);
  console.log(`Not Found (404):        ${summary.notFound}`);
  console.log(`Unauthorized (401):     ${summary.unauthorized}`);
  console.log(`Forbidden (403):        ${summary.forbidden}`);
  console.log(`Client Error (4xx):     ${summary.clientError}`);
  console.log(`Server Error (5xx):     ${summary.serverError}`);
  console.log(`Unknown:                ${summary.unknown}`);

  // Group by module
  console.log('\n=====================================');
  console.log('RESULTS BY MODULE');
  console.log('=====================================\n');

  const byModule = {};
  results.forEach(r => {
    if (!byModule[r.module]) {
      byModule[r.module] = [];
    }
    byModule[r.module].push(r);
  });

  Object.keys(byModule).sort().forEach(module => {
    console.log(`\n--- ${module} ---`);
    byModule[module].forEach(r => {
      const statusIcon = r.status === 'EXISTS' ? '✓' :
                        r.status === 'NOT_FOUND' ? '✗' :
                        r.status === 'UNAUTHORIZED' || r.status === 'FORBIDDEN' ? '🔒' :
                        r.status === 'ERROR' ? '⚠' : '?';
      console.log(`${statusIcon} ${r.endpoint} - ${r.statusCode} - ${r.message}`);
      if (r.response && r.status === 'ERROR') {
        console.log(`  Response: ${r.response}`);
      }
    });
  });

  // Save detailed report
  const fs = require('fs');
  const reportText = JSON.stringify({
    timestamp: new Date().toISOString(),
    summary,
    results,
    byModule
  }, null, 2);

  fs.writeFileSync('API-TEST-REPORT.json', reportText);
  console.log('\n\nDetailed report saved to: API-TEST-REPORT.json');

  // Generate markdown report
  let mdReport = `# Operate API Endpoint Test Report\n\n`;
  mdReport += `**Generated:** ${new Date().toISOString()}\n\n`;
  mdReport += `**API Base:** ${API_BASE}\n\n`;

  mdReport += `## Summary\n\n`;
  mdReport += `| Status | Count |\n`;
  mdReport += `|--------|-------|\n`;
  mdReport += `| Total Endpoints | ${summary.total} |\n`;
  mdReport += `| Exists (2xx) | ${summary.exists} |\n`;
  mdReport += `| Not Found (404) | ${summary.notFound} |\n`;
  mdReport += `| Unauthorized (401) | ${summary.unauthorized} |\n`;
  mdReport += `| Forbidden (403) | ${summary.forbidden} |\n`;
  mdReport += `| Client Error (4xx) | ${summary.clientError} |\n`;
  mdReport += `| Server Error (5xx) | ${summary.serverError} |\n\n`;

  mdReport += `## Results by Module\n\n`;
  Object.keys(byModule).sort().forEach(module => {
    mdReport += `### ${module}\n\n`;
    mdReport += `| Endpoint | Status | Code | Message |\n`;
    mdReport += `|----------|--------|------|----------|\n`;
    byModule[module].forEach(r => {
      const statusIcon = r.status === 'EXISTS' ? '✓' :
                        r.status === 'NOT_FOUND' ? '✗' :
                        r.status === 'UNAUTHORIZED' || r.status === 'FORBIDDEN' ? '🔒' :
                        r.status === 'ERROR' ? '⚠' : '?';
      mdReport += `| ${r.endpoint} | ${statusIcon} ${r.status} | ${r.statusCode} | ${r.message} |\n`;
    });
    mdReport += `\n`;
  });

  fs.writeFileSync('API-TEST-REPORT.md', mdReport);
  console.log('Markdown report saved to: API-TEST-REPORT.md\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
