const axios = require('axios');
const { createHmac, randomBytes } = require('crypto');

/**
 * J-Ledger POS Terminal Simulator (JS Version)
 * 
 * Instructions:
 * Run with: node scripts/pos-simulator.js
 */

const API_BASE_URL = 'http://localhost:3000';
const TERMINAL_ID = '33a7245a-6746-4313-a71f-e0989bc69356'; // Coffee Master POS-01
const SECRET_KEY = 'sk_03f73f9cf5ce47eda6f0b2516b32a7d19556fbc0f1c3c9d8';

async function simulatePayment(amount) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(8).toString('hex');
  const method = 'POST';
  const path = `/api/v1/terminal/payment`;
  const idempotencyKey = `sim_${Date.now()}`;

  // Step 1: Generate Signature
  // Logic from TerminalAuthGuard: request.method, request.url (including prefix /v1 if present in URL)
  const message = `${method}:${path}:${timestamp}:${nonce}`;
  const signature = createHmac('sha256', SECRET_KEY)
    .update(message)
    .digest('hex');

  console.log('--- J-Ledger POS Simulator ---');
  console.log(`Endpoint: ${API_BASE_URL}${path}`);
  console.log(`Amount:   ${amount} THB`);
  console.log(`Terminal: ${TERMINAL_ID}`);

  try {
    const response = await axios.post(`${API_BASE_URL}${path}`, {
      amount,
      idempotencyKey,
      note: 'Simulated POS Payment'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-jledger-terminal-id': TERMINAL_ID,
        'x-jledger-signature': signature,
        'x-jledger-timestamp': timestamp,
        'x-jledger-nonce': nonce,
      }
    });

    console.log('\n✅ Payment Success!');
    console.log('Transaction ID:', response.data.data?.transactionId || 'N/A');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ Payment Failed!');
    if (error.response) {
      console.log(`Status: ${error.response.status} (${error.response.statusText})`);
      console.log('Error Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

// Example: Run simulation with 100 THB
simulatePayment(100.00);
