// Simple Twilio authentication test
import twilio from 'twilio';

const accountSid = 'AC75988346548d3ba099d8177fc6d8b6a9';
const authToken = 'd4cf926bfc568d4f8bf817d753bc40a8';

console.log('🔍 Testing Twilio credentials...');
console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken.substring(0, 8) + '...');

const client = twilio(accountSid, authToken);

// Test 1: Get account info
client.api.accounts(accountSid)
  .fetch()
  .then(account => {
    console.log('✅ Authentication successful!');
    console.log('Account Status:', account.status);
    console.log('Account Type:', account.type);
    console.log('Phone Numbers:', account.phoneNumber);
  })
  .catch(error => {
    console.log('❌ Authentication failed!');
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
    console.log('More Info:', error.moreInfo);
    
    if (error.code === 20003) {
      console.log('\n🔧 Solutions:');
      console.log('1. Check if Account SID is correct');
      console.log('2. Check if Auth Token is correct');
      console.log('3. Check if account is active');
      console.log('4. Get fresh credentials from Twilio Console');
    }
  });
