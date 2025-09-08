// // import express from 'express';
// // import twilio from 'twilio';
// // import cors from 'cors';

// // const app = express();
// // const port = 3000;

// // // Middleware
// // app.use(cors());
// // app.use(express.json());
// // app.use(express.static('public'));

// // // Twilio configuration
// // const accountSid = 'AC75988346548d3ba099d8177fc6d8b6a9';
// // const authToken = '8c5322bd1a77aab2d57056077dc78df2';
// // const twilioNumber = '+18148460215';

// // const client = twilio(accountSid, authToken);

// // // IMPOSSIBLE-TO-BREAK call tracking - prevents ALL duplicates
// // let activeCall = null;
// // let lastCallRequest = null;
// // let requestCount = 0;
// // let blockedRequests = new Set(); // Track blocked requests
// // let processingRequests = new Set(); // Track requests being processed
// // let globalRequestLock = false; // Global lock to prevent ANY new requests
// // let clientRequestHistory = new Map(); // Track client request history by IP
// // let requestFingerprints = new Set(); // Track all request fingerprints
// // let lastCallTimestamp = 0; // Track when last call was made

// // // Health check
// // app.get('/health', (req, res) => {
// //   res.json({ status: 'OK', message: 'Impossible-to-break dialer server running' });
// // });

// // // Reset server locks - use this when you get "Server is busy" errors
// // app.post('/reset-locks', (req, res) => {
// //   console.log('🔄 Resetting all server locks...');
  
// //   // Clear all locks and timestamps
// //   globalRequestLock = false;
// //   activeCall = null;
// //   lastCallRequest = null;
// //   lastCallTimestamp = 0;
// //   processingRequests.clear();
// //   blockedRequests.clear();
// //   clientRequestHistory.clear();
// //   requestFingerprints.clear();
  
// //   console.log('✅ All locks cleared successfully');
// //   res.json({ 
// //     success: true, 
// //     message: 'All server locks have been reset',
// //     timestamp: Date.now()
// //   });
// // });

// // // Make a call - IMPOSSIBLE-TO-BREAK SINGLE CALL ONLY
// // app.post('/call', async (req, res) => {
// //   const requestId = ++requestCount;
// //   const timestamp = Date.now();
// //   const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
// //   console.log(`\n=== CALL REQUEST ${requestId} STARTED ===`);
// //   console.log(`⏰ Timestamp: ${timestamp}`);
// //   console.log(`🌐 Client IP: ${clientIP}`);
// //   console.log(`📱 Request body:`, req.body);
// //   console.log(`🔒 Global lock: ${globalRequestLock}`);
// //   console.log(`📊 Processing requests: ${processingRequests.size}`);
// //   console.log(`📊 Active call: ${activeCall ? 'YES' : 'NO'}`);
// //   console.log(`📊 Last call: ${lastCallTimestamp ? new Date(lastCallTimestamp).toISOString() : 'NEVER'}`);
  
// //   try {
// //     const { to } = req.body;
    
// //     if (!to) {
// //       console.log(`❌ CALL ${requestId} FAILED - No phone number`);
// //       return res.status(400).json({ error: 'Phone number required' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - check global lock FIRST
// //     if (globalRequestLock) {
// //       console.log(`❌ CALL ${requestId} BLOCKED - Global request lock active`);
// //       return res.status(429).json({ error: 'Server is busy processing another request' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - check if there's already an active call
// //     if (activeCall) {
// //       console.log(`❌ CALL ${requestId} BLOCKED - Call already in progress`);
// //       console.log(`📞 Active call: ${activeCall.sid} to ${activeCall.to}`);
// //       return res.status(400).json({ error: 'Call already in progress' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - check if we're already processing any call
// //     if (processingRequests.size > 0) {
// //       console.log(`❌ CALL ${requestId} BLOCKED - Another call being processed`);
// //       console.log(`📊 Processing requests:`, Array.from(processingRequests));
// //       return res.status(400).json({ error: 'Another call being processed' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - check if ANY call was made recently
// //     if (lastCallTimestamp && (timestamp - lastCallTimestamp) < 20000) { // 20 seconds
// //       console.log(`❌ CALL ${requestId} BLOCKED - Call made too recently`);
// //       console.log(`📞 Last call: ${lastCallTimestamp}, Time since: ${timestamp - lastCallTimestamp}ms`);
// //       return res.status(429).json({ error: 'Please wait 20 seconds before making another call' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - check client request history
// //     const clientKey = `${clientIP}-${to}`;
// //     const lastClientRequest = clientRequestHistory.get(clientKey);
// //     if (lastClientRequest && (timestamp - lastClientRequest) < 20000) { // 20 seconds
// //       console.log(`❌ CALL ${requestId} BLOCKED - Client made request too recently`);
// //       console.log(`🚫 Client: ${clientIP}, Number: ${to}, Last: ${lastClientRequest}`);
// //       return res.status(429).json({ error: 'Please wait 20 seconds before making another call' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - check if this exact request was made recently
// //     if (lastCallRequest && 
// //         lastCallRequest.to === to && 
// //         (timestamp - lastCallRequest.timestamp) < 20000) { // 20 seconds
// //       console.log(`❌ CALL ${requestId} BLOCKED - Duplicate request within 20 seconds`);
// //       console.log(`📞 Last request: ${lastCallRequest.timestamp} to ${lastCallRequest.to}`);
// //       return res.status(400).json({ error: 'Duplicate call request blocked' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - check if this number was blocked recently
// //     if (blockedRequests.has(to)) {
// //       console.log(`❌ CALL ${requestId} BLOCKED - Number recently blocked`);
// //       console.log(`🚫 Blocked number: ${to}`);
// //       return res.status(400).json({ error: 'Number temporarily blocked' });
// //     }
    
// //     // IMPOSSIBLE-TO-BREAK validation - create unique fingerprint and check for duplicates
// //     const requestFingerprint = `${to}-${clientIP}-${Math.floor(timestamp / 1000)}`; // Round to second
// //     if (requestFingerprints.has(requestFingerprint)) {
// //       console.log(`❌ CALL ${requestId} BLOCKED - Duplicate fingerprint detected`);
// //       console.log(`🔒 Fingerprint: ${requestFingerprint}`);
// //       return res.status(400).json({ error: 'Duplicate request detected' });
// //     }
    
// //     console.log(`🎯 CALL ${requestId} VALIDATED - Making IMPOSSIBLE-TO-BREAK SINGLE call to: ${to}`);
    
// //     // IMPOSSIBLE-TO-BREAK state protection - lock everything IMMEDIATELY
// //     globalRequestLock = true;
// //     processingRequests.add(`${to}-${timestamp}`);
// //     clientRequestHistory.set(clientKey, timestamp);
// //     requestFingerprints.add(requestFingerprint);
// //     lastCallTimestamp = timestamp;
    
// //     // Mark this request as the last one IMMEDIATELY
// //     lastCallRequest = { to, timestamp, requestId };
    
// //     console.log(`🔒 IMPOSSIBLE-TO-BREAK LOCK ACTIVATED for request ${requestId}`);
    
// //     // Auto-release lock after 5 minutes to prevent stuck locks
// //     setTimeout(() => {
// //       if (globalRequestLock && activeCall && activeCall.requestId === requestId) {
// //         console.log(`⏰ Auto-releasing stuck lock for request ${requestId}`);
// //         globalRequestLock = false;
// //         activeCall = null;
// //         processingRequests.clear();
// //         blockedRequests.clear();
// //         clientRequestHistory.clear();
// //         requestFingerprints.clear();
// //         lastCallTimestamp = 0;
// //         lastCallRequest = null;
// //       }
// //     }, 300000); // 5 minutes
    
// //     // Create the call - Direct outbound call to target
// //     console.log(`📞 Creating direct outbound call to: ${to}`);
// //     console.log(`📱 From: ${twilioNumber} | To: ${to}`);
// //     console.log(`📋 Single call approach - no conferences or callbacks`);
// //     const call = await client.calls.create({
// //       to: to,
// //       from: twilioNumber,
// //                     // Simple direct call to target - you can monitor through browser
// //     twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Dial timeout="30" callerId="${twilioNumber}"><Number>${to}</Number></Dial></Response>`,
// //       statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
// //       statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
// //     });
// //     console.log(`📞 Call created successfully: ${call.sid}, Status: ${call.status}`);
    
// //     // Mark as active
// //     activeCall = {
// //       sid: call.sid,
// //       to: to,
// //       startTime: timestamp,
// //       requestId: requestId,
// //       clientIP: clientIP,
// //       fingerprint: requestFingerprint
// //     };
    
// //     // Remove from processing requests
// //     processingRequests.delete(`${to}-${timestamp}`);
    
// //     console.log(`✅ CALL ${requestId} SUCCESS - Call created: ${call.sid}`);
// //     console.log(`📊 Active call details:`, activeCall);
    
// //     res.json({ 
// //       success: true, 
// //       callSid: call.sid,
// //       message: 'Call initiated successfully',
// //       requestId: requestId
// //     });
    
// //   } catch (error) {
// //     console.error(`💥 CALL ${requestId} ERROR:`, error);
    
// //     // Clean up processing state
// //     if (req.body.to) {
// //       processingRequests.delete(`${req.body.to}-${timestamp}`);
// //     }
    
// //     // Clear any partial state
// //     if (activeCall && activeCall.requestId === requestId) {
// //       activeCall = null;
// //     }
    
// //     // Release global lock on error
// //     globalRequestLock = false;
    
// //     // Provide more detailed error information
// //     let errorMessage = error.message;
// //     if (error.code === 20003) {
// //       errorMessage = 'Authentication failed - check Twilio credentials';
// //     } else if (error.code === 21211) {
// //       errorMessage = 'Invalid phone number format';
// //     } else if (error.code === 21214) {
// //       errorMessage = 'Phone number not verified for trial accounts';
// //     }
    
// //     res.status(500).json({ 
// //       error: errorMessage,
// //       code: error.code,
// //       details: error.details || 'No additional details'
// //     });
// //   }
// // });

// // // End call
// // app.post('/end-call', async (req, res) => {
// //   try {
// //     if (!activeCall) {
// //       return res.status(400).json({ error: 'No active call' });
// //     }
    
// //     console.log(`📞 Ending call: ${activeCall.sid}`);
    
// //     // End the call
// //     await client.calls(activeCall.sid).update({ status: 'completed' });
    
// //     console.log(`✅ Call ended successfully: ${activeCall.sid}`);
    
// //     // Clear active call
// //     activeCall = null;
    
// //     // Release global lock
// //     globalRequestLock = false;
    
// //     // Clear blocked requests after some time
// //     setTimeout(() => {
// //       blockedRequests.clear();
// //       console.log(`🧹 Cleared blocked requests`);
// //     }, 30000); // 30 seconds
    
// //     res.json({ success: true, message: 'Call ended' });
    
// //   } catch (error) {
// //     console.error('❌ Error ending call:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Get call status
// // app.get('/call-status', (req, res) => {
// //   res.json({ 
// //     activeCall: activeCall,
// //     hasActiveCall: !!activeCall,
// //     lastRequest: lastCallRequest,
// //     processingRequests: Array.from(processingRequests),
// //     blockedRequests: Array.from(blockedRequests),
// //     globalRequestLock: globalRequestLock,
// //     clientRequestHistory: Object.fromEntries(clientRequestHistory),
// //     lastCallTimestamp: lastCallTimestamp,
// //     requestFingerprints: Array.from(requestFingerprints)
// //   });
// // });











// // // Twilio webhook for call status updates
// // app.post('/twilio-webhook', async (req, res) => {
// //   const { CallSid, CallStatus, CallDuration, CallSidStatus } = req.body;
  
// //   console.log(`📞 Twilio webhook: Call ${CallSid} status: ${CallStatus}`);
// //   console.log(`📊 Call details:`, { CallSid, CallStatus, CallDuration, CallSidStatus });
  
// //   // Handle different call statuses
// //   if (CallStatus === 'initiated') {
// //     console.log(`🚀 Call ${CallSid} initiated`);
// //   } else if (CallStatus === 'ringing') {
// //     console.log(`🔔 Call ${CallSid} ringing`);
// //   } else if (CallStatus === 'answered') {
// //     console.log(`✅ Call ${CallSid} answered - connection established`);
// //   } else if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'busy' || CallStatus === 'no-answer') {
// //     if (activeCall && activeCall.sid === CallSid) {
// //       console.log(`🧹 Clearing completed call: ${CallSid}`);
// //       activeCall = null;
// //       globalRequestLock = false; // Release global lock
      
// //       // Also clear other tracking data
// //       processingRequests.clear();
// //       blockedRequests.clear();
// //       clientRequestHistory.clear();
// //       requestFingerprints.clear();
// //       lastCallTimestamp = 0;
// //       lastCallRequest = null;
      
// //       console.log(`✅ All call data cleared and locks released`);
// //     }
// //   }
  
// //   res.sendStatus(200);
// // });

// // // Serve the simple HTML dialer
// // app.get('/', (req, res) => {
// //   res.send(`
// // <!DOCTYPE html>
// // <html lang="en">
// // <head>
// //     <meta charset="UTF-8">
// //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
// //     <title>Impossible-to-Break Dialer</title>
// //     <style>
// //         * { margin: 0; padding: 0; box-sizing: border-box; }
// //         body { 
// //             font-family: Arial, sans-serif; 
// //             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //             min-height: 100vh;
// //             display: flex;
// //             align-items: center;
// //             justify-content: center;
// //         }
// //         .dialer {
// //             background: white;
// //             border-radius: 20px;
// //             padding: 40px;
// //             box-shadow: 0 20px 40px rgba(0,0,0,0.1);
// //             text-align: center;
// //             max-width: 400px;
// //             width: 100%;
// //         }
// //         .title {
// //             font-size: 28px;
// //             font-weight: bold;
// //             color: #333;
// //             margin-bottom: 30px;
// //         }
// //         .phone-input {
// //             width: 100%;
// //             padding: 15px;
// //             font-size: 24px;
// //             border: 2px solid #ddd;
// //             border-radius: 10px;
// //             margin-bottom: 20px;
// //             text-align: center;
// //         }
// //         .dial-pad {
// //             display: grid;
// //             grid-template-columns: repeat(3, 1fr);
// //             gap: 15px;
// //             margin-bottom: 30px;
// //         }
// //         .dial-button {
// //             width: 70px;
// //             height: 70px;
// //             border: none;
// //             border-radius: 50%;
// //             background: #f0f0f0;
// //             font-size: 24px;
// //             font-weight: bold;
// //             cursor: pointer;
// //             transition: all 0.2s;
// //         }
// //         .dial-button:hover {
// //             background: #e0e0e0;
// //             transform: scale(1.1);
// //         }
// //         .call-button {
// //             width: 100%;
// //             padding: 20px;
// //             font-size: 20px;
// //             font-weight: bold;
// //             color: white;
// //             background: #4CAF50;
// //             border: none;
// //             border-radius: 10px;
// //             cursor: pointer;
// //             transition: all 0.2s;
// //         }
// //         .call-button:hover:not(:disabled) {
// //             background: #45a049;
// //             transform: scale(1.02);
// //         }
// //         .call-button:disabled {
// //             background: #ccc;
// //             cursor: not-allowed;
// //         }
// //         .status {
// //             margin-top: 20px;
// //             padding: 15px;
// //             border-radius: 10px;
// //             font-weight: bold;
// //         }
// //         .status.success { background: #d4edda; color: #155724; }
// //         .status.error { background: #f8d7da; color: #721c24; }
// //         .status.info { background: #d1ecf1; color: #0c5460; }
// //         .clear-btn {
// //             background: #ff9800;
// //             color: white;
// //             border: none;
// //             padding: 10px 20px;
// //             border-radius: 5px;
// //             cursor: pointer;
// //             margin-bottom: 20px;
// //         }
// //         .clear-btn:hover {
// //             background: #f57c00;
// //         }
// //     </style>
// // </head>
// // <body>
// //     <div class="dialer">
// //         <div class="title">📞 Impossible-to-Break Dialer</div>
        
// //         <input type="tel" class="phone-input" id="phoneInput" placeholder="Enter phone number" maxlength="15">
        
// //         <button class="clear-btn" onclick="clearNumber()">Clear</button>
        
// //         <div class="dial-pad">
// //             <button class="dial-button" onclick="addDigit('1')">1</button>
// //             <button class="dial-button" onclick="addDigit('2')">2</button>
// //             <button class="dial-button" onclick="addDigit('3')">3</button>
// //             <button class="dial-button" onclick="addDigit('4')">4</button>
// //             <button class="dial-button" onclick="addDigit('5')">5</button>
// //             <button class="dial-button" onclick="addDigit('6')">6</button>
// //             <button class="dial-button" onclick="addDigit('7')">7</button>
// //             <button class="dial-button" onclick="addDigit('8')">8</button>
// //             <button class="dial-button" onclick="addDigit('9')">9</button>
// //             <button class="dial-button" onclick="addDigit('*')">*</button>
// //             <button class="dial-button" onclick="addDigit('0')">0</button>
// //             <button class="dial-button" onclick="addDigit('#')">#</button>
// //         </div>
        
// //         <button class="call-button" id="callButton" onclick="makeCall()">📞 Call</button>
        
// //         <div id="status" class="status" style="display: none;"></div>
// //     </div>

// //     <script>
// //         let isCalling = false;
// //         let lastCallAttempt = 0;
// //         let requestInProgress = false;
        
// //         function addDigit(digit) {
// //             if (!isCalling && !requestInProgress) {
// //                 document.getElementById('phoneInput').value += digit;
// //             }
// //         }
        
// //         function clearNumber() {
// //             if (!isCalling && !requestInProgress) {
// //                 document.getElementById('phoneInput').value = '';
// //             }
// //         }
        
// //         async function makeCall() {
// //             const phoneInput = document.getElementById('phoneInput');
// //             const callButton = document.getElementById('callButton');
// //             const status = document.getElementById('status');
            
// //             const phoneNumber = phoneInput.value.trim();
            
// //             if (!phoneNumber) {
// //                 showStatus('Please enter a phone number', 'error');
// //                 return;
// //             }
            
// //             if (isCalling || requestInProgress) {
// //                 return;
// //             }
            
// //             // IMPOSSIBLE-TO-BREAK validation - prevent rapid clicks
// //             const now = Date.now();
// //             if (now - lastCallAttempt < 20000) {
// //                 showStatus('Please wait 20 seconds before trying again', 'error');
// //                 return;
// //             }
            
// //             // IMPOSSIBLE-TO-BREAK state protection
// //             lastCallAttempt = now;
// //             isCalling = true;
// //             requestInProgress = true;
// //             callButton.disabled = true;
// //             callButton.textContent = '📞 Calling...';
// //             phoneInput.disabled = true;
            
// //             showStatus('🎯 Initiating call...', 'info');
            
// //             try {
// //                 const response = await fetch('/call', {
// //                     method: 'POST',
// //                     headers: {
// //                         'Content-Type': 'application/json'
// //                     },
// //                     body: JSON.stringify({
// //                         to: phoneNumber
// //                     })
// //                 });
                
// //                 const result = await response.json();
                
// //                 if (result.success) {
// //                     showStatus('✅ Call connected! You can now speak directly.', 'success');
// //                     callButton.textContent = '📞 End Call';
// //                     callButton.onclick = endCall;
// //                     callButton.disabled = false;
// //                 } else {
// //                     showStatus('❌ Call failed: ' + result.error, 'error');
// //                     resetCallState();
// //                 }
                
// //             } catch (error) {
// //                 showStatus('❌ Error: ' + error.message, 'error');
// //                 resetCallState();
// //             }
// //         }
        
// //         async function endCall() {
// //             const callButton = document.getElementById('callButton');
// //             const status = document.getElementById('status');
            
// //             try {
// //                 await fetch('/end-call', { method: 'POST' });
// //                 showStatus('📞 Call ended', 'info');
// //                 resetCallState();
// //             } catch (error) {
// //                 showStatus('❌ Error ending call: ' + error.message, 'error');
// //             }
// //         }
        
// //         function resetCallState() {
// //             isCalling = false;
// //             requestInProgress = false;
// //             const callButton = document.getElementById('callButton');
// //             const phoneInput = document.getElementById('phoneInput');
            
// //             callButton.disabled = false;
// //             callButton.textContent = '📞 Call';
// //             callButton.onclick = makeCall;
// //             phoneInput.disabled = false;
// //         }
        
// //         function showStatus(message, type) {
// //             const status = document.getElementById('status');
// //             status.textContent = message;
// //             status.className = 'status ' + type;
// //             status.style.display = 'block';
// //         }
        
// //         // Check call status periodically
// //         setInterval(async () => {
// //             try {
// //                 const response = await fetch('/call-status');
// //                 const result = await response.json();
                
// //                 if (!result.hasActiveCall && isCalling) {
// //                     // Call ended externally
// //                     showStatus('📞 Call ended', 'info');
// //                     resetCallState();
// //                 }
// //             } catch (error) {
// //                 // Ignore errors
// //             }
// //         }, 2000);
// //     </script>
// // </body>
// // </html>
// //   `);
// // });

// // app.listen(port, () => {
// //   console.log('🚀 IMPOSSIBLE-TO-BREAK dialer server running on port', port);
// //   console.log('📱 Open http://localhost:3000 in your browser');
// //   console.log('🎯 Frontend: http://localhost:5174');
// // });





// import express from 'express';
// import twilio from 'twilio';
// import cors from 'cors';

// const app = express();
// const port = 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// // Twilio configuration
// const accountSid = 'AC75988346548d3ba099d8177fc6d8b6a9';
// const authToken = '8c5322bd1a77aab2d57056077dc78df2';
// const twilioNumber = '+18148460215';
// const YOUR_PERSONAL_PHONE = '+91XXXXXXXXXX'; // 👈 replace with your real phone number

// const client = twilio(accountSid, authToken);

// // Track active call
// let activeCall = null;

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Dialer server running' });
// });

// // =========================
// // MAIN CALL ENDPOINT
// // =========================
// app.post('/call', async (req, res) => {
//   try {
//     const { to } = req.body;
//     if (!to) return res.status(400).json({ error: 'Phone number required' });

//     if (activeCall) {
//       return res.status(400).json({ error: 'Call already in progress' });
//     }

//     console.log(`📞 Creating call: you (${YOUR_PERSONAL_PHONE}) → ${to}`);

//     // STEP 1: Call YOUR phone first
//     const call = await client.calls.create({
//       to: YOUR_PERSONAL_PHONE,       // your device rings first
//       from: twilioNumber,
//       url: `${req.protocol}://${req.get('host')}/connect?to=${encodeURIComponent(to)}`, // TwiML fetched when you pick up
//       statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
//       statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer']
//     });

//     activeCall = { sid: call.sid, to, startTime: Date.now() };

//     res.json({
//       success: true,
//       callSid: call.sid,
//       message: `Call initiated: you → ${to}`
//     });
//   } catch (err) {
//     console.error('❌ Error creating call:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // =========================
// // TWIML CONNECT ROUTE
// // =========================
// app.post('/connect', (req, res) => {
//   const to = req.query.to;
//   console.log(`🔗 Connecting your call to: ${to}`);

//   const twiml = `
//     <?xml version="1.0" encoding="UTF-8"?>
//     <Response>
//       <Dial callerId="${twilioNumber}">
//         <Number>${to}</Number>
//       </Dial>
//     </Response>
//   `;
//   res.type('text/xml');
//   res.send(twiml);
// });

// // =========================
// // END CALL
// // =========================
// app.post('/end-call', async (req, res) => {
//   try {
//     if (!activeCall) return res.status(400).json({ error: 'No active call' });

//     await client.calls(activeCall.sid).update({ status: 'completed' });
//     console.log(`✅ Call ended: ${activeCall.sid}`);

//     activeCall = null;
//     res.json({ success: true, message: 'Call ended' });
//   } catch (err) {
//     console.error('❌ Error ending call:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // =========================
// // CALL STATUS
// // =========================
// app.get('/call-status', (req, res) => {
//   res.json({
//     activeCall,
//     hasActiveCall: !!activeCall
//   });
// });

// // =========================
// // TWILIO STATUS WEBHOOK
// // =========================
// app.post('/twilio-webhook', express.urlencoded({ extended: true }), (req, res) => {
//   const { CallSid, CallStatus } = req.body;
//   console.log(`📡 Twilio status: ${CallSid} → ${CallStatus}`);

//   if (['completed', 'failed', 'busy', 'no-answer'].includes(CallStatus)) {
//     activeCall = null;
//     console.log(`🧹 Cleared active call after status: ${CallStatus}`);
//   }

//   res.sendStatus(200);
// });

// // =========================
// // SIMPLE DIALER UI
// // =========================
// app.get('/', (req, res) => {
//   res.send(`
// <!DOCTYPE html>
// <html>
// <head>
//   <title>Dialer</title>
// </head>
// <body style="font-family:sans-serif; text-align:center; margin-top:50px;">
//   <h2>📞 Twilio Dialer</h2>
//   <input id="phoneInput" placeholder="Enter phone number" style="font-size:20px; padding:10px;"/>
//   <br><br>
//   <button onclick="makeCall()" style="padding:10px 20px; font-size:18px;">Call</button>
//   <button onclick="endCall()" style="padding:10px 20px; font-size:18px;">End</button>
//   <p id="status"></p>

// <script>
//   async function makeCall() {
//     const to = document.getElementById('phoneInput').value.trim();
//     if (!to) return alert('Enter a number');
//     const res = await fetch('/call', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({to}) });
//     const data = await res.json();
//     document.getElementById('status').innerText = data.message || data.error;
//   }

//   async function endCall() {
//     const res = await fetch('/end-call', { method:'POST' });
//     const data = await res.json();
//     document.getElementById('status').innerText = data.message || data.error;
//   }
// </script>
// </body>
// </html>
//   `);
// });

// // Start server
// app.listen(port, () => {
//   console.log(`🚀 Dialer server running on http://localhost:${port}`);
// });





import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


app.get("/", (req, res) => {
  res.send("🚀 AI Dialer is running. Use POST /call with { to: '+919711794552' }");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Dialer server running',
    timestamp: new Date().toISOString()
  });
});


// 🔑 Replace with your Twilio credentials

// Twilio configuration
const accountSid = 'AC75988346548d3ba099d8177fc6d8b6a9';
const authToken = '8c5322bd1a77aab2d57056077dc78df2';
const twilioNumber = '+18148460215';

const YOUR_PERSONAL_PHONE = "+919711794552"; // Your own number (E.164, update to yours)

const client = twilio(accountSid, authToken);

// Track active calls and numbers being called to prevent duplicates
let activeCall = null;
let callingNumbers = new Set(); // Track numbers currently being called

// Start a call: AGENT-FIRST using inline TwiML (works without public URL)
app.post("/call", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });
    if (!YOUR_PERSONAL_PHONE || !/^\+?[1-9]\d{7,14}$/.test(YOUR_PERSONAL_PHONE)) {
      return res.status(400).json({ error: "YOUR_PERSONAL_PHONE must be in E.164 format, e.g. +1234567890" });
    }
    const normalizedTo = String(to).replace(/\s+/g, '');
    const normalizedAgent = String(YOUR_PERSONAL_PHONE).replace(/\s+/g, '');
    if (normalizedTo === normalizedAgent) {
      return res.status(400).json({ error: "Target number cannot be the same as YOUR_PERSONAL_PHONE" });
    }

    // Prevent concurrent/duplicate calls
    if (activeCall) {
      return res.status(400).json({ error: "Call already in progress" });
    }
    if (callingNumbers.has(to)) {
      return res.status(400).json({ error: "Number is already being called" });
    }

    console.log(`📞 Initiating AGENT-FIRST (inline TwiML): agent (${YOUR_PERSONAL_PHONE}) → ${to}`);
    callingNumbers.add(to);

    // Ring your phone first; when answered, Twilio dials the target and bridges
    const call = await client.calls.create({
      to: YOUR_PERSONAL_PHONE,
      from: twilioNumber,
      twiml: `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Dial callerId="${twilioNumber}" answerOnBridge="true" timeout="30">\n    <Number>${to}</Number>\n  </Dial>\n</Response>`,
      statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"]
    });

    activeCall = { sid: call.sid, to, startTime: Date.now() };

    // Safety: auto-release stuck calls after 2 minutes
    const currentSid = call.sid;
    setTimeout(() => {
      if (activeCall && activeCall.sid === currentSid) {
        console.log(`⏰ Auto-releasing stuck call ${currentSid}`);
        callingNumbers.delete(activeCall.to);
        activeCall = null;
      }
    }, 120000);
    res.json({ success: true, callSid: call.sid, message: `Call initiated: you → ${to}` });
  } catch (err) {
    if (req.body.to) callingNumbers.delete(req.body.to);
    console.error("❌ Error creating call:", err);
    res.status(500).json({ error: err.message });
  }
});

// Optional: Agent-first flow (rings your phone, then bridges to target)
app.post("/call-agent", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });
    if (!YOUR_PERSONAL_PHONE || !/^\+?[1-9]\d{7,14}$/.test(YOUR_PERSONAL_PHONE)) {
      return res.status(400).json({ error: "YOUR_PERSONAL_PHONE is not set in E.164 format (e.g. +1234567890)" });
    }
    const normalizedTo = String(to).replace(/\s+/g, '');
    const normalizedAgent = String(YOUR_PERSONAL_PHONE).replace(/\s+/g, '');
    if (normalizedTo === normalizedAgent) {
      return res.status(400).json({ error: "Target number cannot be the same as YOUR_PERSONAL_PHONE" });
    }
    if (activeCall) return res.status(400).json({ error: "Call already in progress" });
    if (callingNumbers.has(to)) return res.status(400).json({ error: "Number is already being called" });

    console.log(`📞 Initiating AGENT-FIRST: agent (${YOUR_PERSONAL_PHONE}) → ${to}`);
    callingNumbers.add(to);

    const call = await client.calls.create({
      to: YOUR_PERSONAL_PHONE,
      from: twilioNumber,
      url: `${req.protocol}://${req.get('host')}/connect?to=${encodeURIComponent(to)}`,
      statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"]
    });

    activeCall = { sid: call.sid, to, startTime: Date.now() };
    res.json({ success: true, callSid: call.sid, message: `Call initiated: you → ${to}` });
  } catch (err) {
    if (req.body.to) callingNumbers.delete(req.body.to);
    console.error("❌ Error creating agent-first call:", err);
    res.status(500).json({ error: err.message });
  }
});

// End the call
app.post("/end", async (req, res) => {
  try {
    if (!activeCall) {
      return res.status(400).json({ error: "No active call" });
    }

    await client.calls(activeCall.sid).update({ status: "completed" });
    console.log(`📴 Call ended: ${activeCall.sid}`);

    // Clean up tracking
    callingNumbers.delete(activeCall.to);
    activeCall = null;
    res.json({ success: true, message: "Call ended" });
  } catch (err) {
    console.error("❌ Error ending call:", err);
    res.status(500).json({ error: err.message });
  }
});

// TwiML: connect your answered call to the target number
app.get("/connect", (req, res) => {
  const { to } = req.query;
  console.log(`🔗 Connecting to: ${to}`);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${twilioNumber}" answerOnBridge="true" timeout="30">
    <Number>${to}</Number>
  </Dial>
</Response>`;
  res.type("text/xml").send(twiml);
});

// Get current status
app.get("/status", async (req, res) => {
  try {
    if (!activeCall) return res.json({ status: "idle" });

    const call = await client.calls(activeCall.sid).fetch();

    // If Twilio reports a terminal status, clear tracking
    if (["completed", "canceled", "failed", "busy", "no-answer"].includes(call.status)) {
      console.log(`🧹 Clearing call ${call.sid} after terminal status: ${call.status}`);
      callingNumbers.delete(activeCall.to);
      activeCall = null;
    }

    res.json({ status: call.status, to: call.to, sid: call.sid });
  } catch (err) {
    console.error("❌ Error fetching status:", err);
    // If the call cannot be fetched (e.g., ended), clear tracking to unblock new calls
    callingNumbers.clear();
    activeCall = null;
    res.status(200).json({ status: "idle" });
  }
});

// Twilio webhook to handle call status updates
app.post("/twilio-webhook", express.urlencoded({ extended: true }), (req, res) => {
  const { CallSid, CallStatus, To } = req.body;
  
  console.log(`📞 Call ${CallSid} status: ${CallStatus} to ${To}`);
  
  // Clean up when call ends naturally
  if (['completed', 'failed', 'no-answer'].includes(CallStatus)) {
    if (activeCall && activeCall.sid === CallSid) {
      callingNumbers.delete(activeCall.to);
      activeCall = null;
      console.log(`🧹 Cleaned up completed call: ${CallSid}`);
    }
  }
  
  res.sendStatus(200);
});

// TwiML for direct outbound call (no nested Dial to the same number)
app.get("/twiml-direct", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">You are now connected. This is a direct outbound call from your Twilio number.</Say>
</Response>`;
  res.type("text/xml").send(twiml);
});

// Direct call endpoint: Twilio number → target (no agent leg)
app.post("/call-direct", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });

    if (activeCall) return res.status(400).json({ error: "Call already in progress" });
    if (callingNumbers.has(to)) return res.status(400).json({ error: "Number is already being called" });

    console.log(`📞 Initiating DIRECT: ${twilioNumber} → ${to}`);
    callingNumbers.add(to);

    const call = await client.calls.create({
      to,
      from: twilioNumber,
      // Simple announcement - no two-way conversation
      twiml: `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="Polly.Joanna">Hello. This is a test call from the AI dialer. Goodbye.</Say>\n</Response>`,
      statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"]
    });

    activeCall = { sid: call.sid, to, startTime: Date.now() };
    // Safety: auto-release after 2 minutes
    const sid = call.sid;
    setTimeout(() => {
      if (activeCall && activeCall.sid === sid) {
        console.log(`⏰ Auto-releasing stuck direct call ${sid}`);
        callingNumbers.delete(activeCall.to);
        activeCall = null;
      }
    }, 120000);

    res.json({ success: true, callSid: call.sid, message: `Direct call initiated to ${to}` });
  } catch (err) {
    if (req.body.to) callingNumbers.delete(req.body.to);
    console.error("❌ Error creating direct call:", err);
    res.status(500).json({ error: err.message });
  }
});

// WebRTC call endpoint: You speak from laptop browser to target number
app.post("/call-webrtc", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });

    if (activeCall) return res.status(400).json({ error: "Call already in progress" });
    if (callingNumbers.has(to)) return res.status(400).json({ error: "Number is already being called" });

    console.log(`📞 Initiating WebRTC call: laptop → ${to}`);
    callingNumbers.add(to);

    // Create a call from Twilio Client (your browser) to the target number
    const call = await client.calls.create({
      to,
      from: 'client:web-browser', // This represents your browser
      twiml: `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="Polly.Joanna">Hello, this is a call from the AI dialer system.</Say>\n</Response>`,
      statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"]
    });

    activeCall = { sid: call.sid, to, startTime: Date.now(), type: 'webrtc' };
    
    res.json({ 
      success: true, 
      callSid: call.sid,
      message: `WebRTC call initiated from browser to ${to}` 
    });
  } catch (err) {
    if (req.body.to) callingNumbers.delete(req.body.to);
    console.error("❌ Error creating WebRTC call:", err);
    res.status(500).json({ error: err.message });
  }
});

// Simple WebRTC setup - Create a basic token for testing
app.post("/token", async (req, res) => {
  try {
    console.log('Generating WebRTC token...');
    
    // For now, let's create a simple response that will help debug
    res.json({
      token: 'test-token',
      identity: 'web-browser',
      message: 'WebRTC token endpoint working - need proper Twilio API keys for full functionality'
    });
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ error: 'Failed to create token: ' + error.message });
  }
});

// TwiML for outbound calls from browser
app.post("/voice", (req, res) => {
  const { To } = req.body;
  console.log(`WebRTC call to: ${To}`);
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${twilioNumber}">
    <Number>${To}</Number>
  </Dial>
</Response>`;
  
  res.type('text/xml').send(twiml);
});

// Conference call endpoint: Creates a conference room for two-way conversation
app.post("/call-conference", async (req, res) => {
  try {
    const { to, yourPhone } = req.body;
    if (!to) return res.status(400).json({ error: "Target phone number required" });
    if (!yourPhone) return res.status(400).json({ error: "Your phone number required" });

    if (activeCall) return res.status(400).json({ error: "Call already in progress" });
    if (callingNumbers.has(to)) return res.status(400).json({ error: "Number is already being called" });

    const conferenceName = `conf-${Date.now()}`;
    console.log(`📞 Creating conference: ${conferenceName} with ${to} and ${yourPhone}`);
    callingNumbers.add(to);

    // Call the target number and put them in conference
    const targetCall = await client.calls.create({
      to,
      from: twilioNumber,
      twiml: `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="Polly.Joanna">Please wait while we connect you to the conference.</Say>\n  <Dial>\n    <Conference>${conferenceName}</Conference>\n  </Dial>\n</Response>`,
      statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"]
    });

    // Call your phone and put you in the same conference
    const agentCall = await client.calls.create({
      to: yourPhone,
      from: twilioNumber,
      twiml: `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="Polly.Joanna">Connecting you to the conference.</Say>\n  <Dial>\n    <Conference>${conferenceName}</Conference>\n  </Dial>\n</Response>`,
      statusCallback: `${req.protocol}://${req.get('host')}/twilio-webhook`,
      statusCallbackEvent: ["completed", "failed", "busy", "no-answer"]
    });

    activeCall = { 
      sid: targetCall.sid, 
      to, 
      startTime: Date.now(),
      conferenceName,
      agentSid: agentCall.sid
    };

    res.json({ 
      success: true, 
      callSid: targetCall.sid,
      agentSid: agentCall.sid,
      conferenceName,
      message: `Conference call initiated: ${yourPhone} and ${to} in room ${conferenceName}` 
    });
  } catch (err) {
    if (req.body.to) callingNumbers.delete(req.body.to);
    console.error("❌ Error creating conference call:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reset endpoint to clear all tracking (useful for debugging)
app.post("/reset", (req, res) => {
  callingNumbers.clear();
  activeCall = null;
  console.log("🔄 All call tracking reset");
  res.json({ success: true, message: "All call tracking reset" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
