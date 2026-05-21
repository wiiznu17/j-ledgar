const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: '/Users/wiiznu/project/fintech/.env' });

console.log('Starting SMTP Connection test with current .env credentials...');
console.log('Host:', process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com');
console.log('Port:', process.env.SMTP_PORT || '587');
console.log('User:', process.env.SMTP_USER);
console.log('Password Length:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true, // show debug output
  logger: true // log to console
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('\n❌ SMTP Verification Failed:');
    console.error(error);
  } else {
    console.log('\n✅ SMTP Connection and Authentication Successful!');
  }
});
