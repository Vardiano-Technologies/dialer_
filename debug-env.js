// Debug script to check environment variables
console.log('🔍 Environment Variables Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);

// Test Twilio with current credentials
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC75988346548d3ba099d8177fc6d8b6a9';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'd4cf926bfc568d4f8bf817d753bc40a8';

console.log('\n🔧 Testing Twilio Authentication...');
console.log('Using Account SID:', accountSid);
console.log('Using Auth Token:', authToken ? 'SET' : 'NOT SET');

try {
  const client = twilio(accountSid, authToken);
  console.log('✅ Twilio client created successfully');
  
  // Test account info
  client.api.accounts(accountSid).fetch()
    .then(account => {
      console.log('✅ Account fetch successful');
      console.log('Account Status:', account.status);
      console.log('Account Type:', account.type);
    })
    .catch(err => {
      console.log('❌ Account fetch failed:', err.message);
    });
} catch (err) {
  console.log('❌ Twilio client creation failed:', err.message);
}

