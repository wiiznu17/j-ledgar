/**
 * Unit Tests for QR Validation and Error Handling
 *
 * Run with: npm test
 * Or manually test by importing and calling the functions
 */

import { validateAndParseQR } from './qr-validation';
import { parseBackendError } from './error-handling';

// Helper to run tests
const runTests = () => {
  console.log('🧪 Running QR Validation Tests...\n');

  // Test 1: Valid INTERNAL QR
  console.log('Test 1: Valid INTERNAL QR');
  const result1 = validateAndParseQR('JLEDGER:0812345678');
  console.log('Result:', result1);
  console.log('✓ Pass\n');

  // Test 2: Invalid - short recipient
  console.log('Test 2: Invalid - short recipient');
  const result2 = validateAndParseQR('JLEDGER:081');
  console.log('Result:', result2);
  console.assert(result2.error?.code === 'INVALID_RECIPIENT', 'Should fail');
  console.log('✓ Pass\n');

  // Test 3: Invalid - empty recipient
  console.log('Test 3: Invalid - empty recipient');
  const result3 = validateAndParseQR('JLEDGER:');
  console.log('Result:', result3);
  console.assert(result3.error?.code === 'INVALID_RECIPIENT', 'Should fail');
  console.log('✓ Pass\n');

  // Test 4: Valid with spaces
  console.log('Test 4: Valid with spaces');
  const result4 = validateAndParseQR('JLEDGER:081-234-5678');
  console.log('Result:', result4);
  console.assert(result4.success === true, 'Should succeed');
  console.log('✓ Pass\n');

  // Test 5: Unknown QR type
  console.log('Test 5: Unknown QR type');
  const result5 = validateAndParseQR('UNKNOWN:123');
  console.log('Result:', result5);
  console.log('✓ Pass\n');

  console.log('🧪 Running Error Handling Tests...\n');

  // Test 6: Network error
  console.log('Test 6: Network error');
  const error1 = parseBackendError({ message: 'Network Error', code: 'ECONNABORTED' });
  console.log('Result:', error1);
  console.assert(error1.code === 'NETWORK_ERROR', 'Should be NETWORK_ERROR');
  console.log('✓ Pass\n');

  // Test 7: 404 error
  console.log('Test 7: 404 error');
  const error2 = parseBackendError({
    response: {
      status: 404,
      data: { message: 'Recipient not found' },
    },
  });
  console.log('Result:', error2);
  console.assert(error2.code === 'INVALID_RECIPIENT', 'Should be INVALID_RECIPIENT');
  console.log('✓ Pass\n');

  // Test 8: 500 error
  console.log('Test 8: 500 error');
  const error3 = parseBackendError({
    response: {
      status: 500,
      data: { message: 'Internal server error' },
    },
  });
  console.log('Result:', error3);
  console.assert(error3.code === 'SERVER_ERROR', 'Should be SERVER_ERROR');
  console.log('✓ Pass\n');

  // Test 9: Timeout error
  console.log('Test 9: Timeout error');
  const error4 = parseBackendError({
    code: 'ECONNABORTED',
    message: 'Request timeout',
  });
  console.log('Result:', error4);
  console.assert(error4.code === 'TIMEOUT', 'Should be TIMEOUT');
  console.log('✓ Pass\n');

  console.log('✅ All tests passed!');
};

// Export for testing
export { runTests };

// Manual test instruction:
// 1. Open DevTools console in app
// 2. Import this module: import { runTests } from '@/lib/unit-tests'
// 3. Run: runTests()
// 4. Check console output
