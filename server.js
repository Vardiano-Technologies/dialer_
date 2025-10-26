




import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import twilio from "twilio";
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database - use in-memory for Vercel
const db = new Database(process.env.NODE_ENV === 'production' ? ':memory:' : './agents.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    agent_phone TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER,
    phone_number TEXT NOT NULL,
    caller_name TEXT,
    caller_email TEXT,
    status TEXT DEFAULT 'initiated',
    duration INTEGER DEFAULT 0,
    start_time DATETIME,
    end_time DATETIME,
    outcome TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents (id)
  );
`);

// Insert sample agents if none exist
const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get();
if (agentCount.count === 0) {
  try {
    const insertAgent = db.prepare('INSERT INTO agents (name, email, phone, agent_phone, is_active) VALUES (?, ?, ?, ?, ?)');
    // Add default admin user
    insertAgent.run('Admin User', 'admin@company.com', '+1234567890', '+919711794552', 1);
    // Add sample agents
    insertAgent.run('John Smith', 'john@company.com', '+1234567891', '+919711794553', 1);
    insertAgent.run('Sarah Johnson', 'sarah@company.com', '+1987654321', '+919711794554', 1);
    insertAgent.run('Mike Wilson', 'mike@company.com', '+1555123456', '+919711794555', 1);
    insertAgent.run('Lisa Brown', 'lisa@company.com', '+1555123457', '+919711794556', 1);
    console.log('📊 Sample agents and admin user created');
  } catch (err) {
    console.log('📊 Sample agents already exist or error creating:', err.message);
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static('public'));

// Serve built frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
}


app.get("/", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  } else {
    res.send("🚀 AI Dialer is running. Use POST /call with { to: '+919711794552' }");
  }
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

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
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// Function to get agent phone numbers from database
function getAgentPhones() {
  try {
    // First check if agent_phone column exists, if not add it
    try {
      db.prepare("SELECT agent_phone FROM agents LIMIT 1").get();
    } catch (err) {
      if (err.message.includes('no such column: agent_phone')) {
        console.log("Adding agent_phone column to agents table...");
        db.exec("ALTER TABLE agents ADD COLUMN agent_phone TEXT;");
        db.exec("ALTER TABLE agents ADD COLUMN is_active BOOLEAN DEFAULT 1;");
      }
    }
    
    const agents = db.prepare("SELECT id, agent_phone FROM agents WHERE is_active = 1 AND agent_phone IS NOT NULL").all();
    const phoneMap = {};
    agents.forEach(agent => {
      phoneMap[agent.id] = agent.agent_phone;
    });
    return phoneMap;
  } catch (err) {
    console.error("Error fetching agent phones:", err);
    return {};
  }
}

// Get initial agent phones
let AGENT_PHONES = getAgentPhones();

// Track active calls per agent - each agent can have one active call
let activeCalls = new Map(); // agentId -> callInfo
let callingNumbers = new Set(); // Track numbers currently being called globally

// Call tracking for multi-agent system
let callSessions = new Map(); // Track active call sessions
let callHistory = []; // Store call history

// Start a call: AGENT-FIRST with CONFERENCE (agent phone rings first, then conference)
app.post("/call", async (req, res) => {
  try {
    const { to, agentId } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });
    if (!agentId) return res.status(400).json({ error: "Agent ID required" });
    
    // Get agent's phone number
    const agentPhone = AGENT_PHONES[agentId];
    if (!agentPhone) {
      return res.status(400).json({ error: `Agent ${agentId} not found. Available agents: ${Object.keys(AGENT_PHONES).join(', ')}` });
    }
    
    if (!/^\+?[1-9]\d{7,14}$/.test(agentPhone)) {
      return res.status(400).json({ error: "Agent phone must be in E.164 format, e.g. +1234567890" });
    }
    
    const normalizedTo = String(to).replace(/\s+/g, '');
    const normalizedAgent = String(agentPhone).replace(/\s+/g, '');
    if (normalizedTo === normalizedAgent) {
      return res.status(400).json({ error: "Target number cannot be the same as agent phone" });
    }

    // Prevent concurrent calls for this specific agent
    if (activeCalls.has(agentId)) {
      return res.status(400).json({ error: `Agent ${agentId} already has a call in progress` });
    }
    if (callingNumbers.has(to)) {
      return res.status(400).json({ error: "Number is already being called by another agent" });
    }

    const conferenceName = `conf-${agentId}-${Date.now()}`;
    console.log(`📞 Creating CONFERENCE call: ${conferenceName} with ${to} and Agent ${agentId} (${agentPhone})`);
    callingNumbers.add(to);

    // Create call record in database
    const callRecord = {
      phoneNumber: to,
      callerName: req.body.callerName || 'Unknown',
      callerEmail: req.body.callerEmail || '',
      status: 'initiated',
      duration: 0,
      startTime: new Date().toISOString(),
      endTime: null,
      outcome: 'Call initiated',
      agentId: agentId
    };

    // Insert into database
    try {
      const insertCall = db.prepare(`INSERT INTO calls (agent_id, phone_number, caller_name, caller_email, status, duration, start_time, end_time, outcome) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const result = insertCall.run(callRecord.agentId, callRecord.phoneNumber, callRecord.callerName, callRecord.callerEmail, 
         callRecord.status, callRecord.duration, callRecord.startTime, callRecord.endTime, callRecord.outcome);
      callRecord.id = result.lastInsertRowid;
      console.log("📞 Call record created in database with ID:", result.lastInsertRowid);
    } catch (err) {
      console.error("❌ Error inserting call into database:", err);
    }

    // Agent-first approach: Call agent's phone first, then when they answer, dial the target
    const agentCall = await client.calls.create({
      to: agentPhone,
      from: twilioNumber,
      twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello, this is an AI dialer call. Please wait while we connect you to ${to}.</Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">Connecting now.</Say>
  <Dial callerId="${twilioNumber}" timeout="30" record="do-not-record">
    <Number>${to}</Number>
  </Dial>
  <Say voice="Polly.Joanna">The call has ended. Thank you.</Say>
</Response>`
    });

    // Update call record with Twilio SID
    callRecord.twilioSid = agentCall.sid;
    callRecord.status = 'ringing';

    const callInfo = { 
      sid: agentCall.sid, 
      to, 
      startTime: Date.now(),
      conferenceName,
      agentSid: agentCall.sid,
      callRecord,
      agentId: agentId,
      agentPhone: agentPhone
    };

    // Store active call for this agent
    activeCalls.set(agentId, callInfo);

    // Store call session
    callSessions.set(agentCall.sid, {
      ...callRecord,
      startTimestamp: Date.now(),
      isActive: true,
      agentId: agentId
    });

    // Add to call history
    callHistory.unshift(callRecord);

    // Safety: auto-release stuck calls after 2 minutes
    const currentSid = agentCall.sid;
    setTimeout(() => {
      if (activeCalls.has(agentId) && activeCalls.get(agentId).sid === currentSid) {
        console.log(`⏰ Auto-releasing stuck call ${currentSid} for agent ${agentId}`);
        callingNumbers.delete(activeCalls.get(agentId).to);
        activeCalls.delete(agentId);
      }
    }, 120000);

    res.json({ 
      success: true, 
      callSid: agentCall.sid,
      agentSid: agentCall.sid,
      conferenceName,
      agentId: agentId,
      agentPhone: agentPhone,
      message: `Agent ${agentId} call initiated: ${agentPhone} will ring first, then connect to ${to}` 
    });
  } catch (err) {
    if (req.body.to) callingNumbers.delete(req.body.to);
    if (req.body.agentId) activeCalls.delete(req.body.agentId);
    const code = (err && (err.code || err.status || err.statusCode)) || undefined;
    const moreInfo = err?.moreInfo || err?.details || err?.response?.data?.more_info;
    const message = err?.message || 'Unknown Twilio error';
    const status = err?.status || err?.statusCode;
    const twilioResponse = err?.response?.data || err?.response;
    console.error("❌ Error creating call:", { message, code, status, moreInfo, twilioResponse });
    res.status(500).json({ error: message, code, status, moreInfo });
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

// End the call for a specific agent
app.post("/end", async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ error: "Agent ID required" });
    }

    const activeCall = activeCalls.get(agentId);
    if (!activeCall) {
      return res.status(400).json({ error: `No active call for agent ${agentId}` });
    }

    // End both the target call and agent call
    const promises = [client.calls(activeCall.sid).update({ status: "completed" })];
    
    if (activeCall.agentSid) {
      promises.push(client.calls(activeCall.agentSid).update({ status: "completed" }));
    }
    
    await Promise.all(promises);
    console.log(`📴 Calls ended for agent ${agentId}: ${activeCall.sid} and ${activeCall.agentSid || 'N/A'}`);

    // Clean up tracking
    callingNumbers.delete(activeCall.to);
    activeCalls.delete(agentId);
    res.json({ success: true, message: `Call ended for agent ${agentId}` });
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

// Get current status for all agents or specific agent
app.get("/status", async (req, res) => {
  try {
    const { agentId } = req.query;
    
    if (agentId) {
      // Get status for specific agent
      const activeCall = activeCalls.get(parseInt(agentId));
      if (!activeCall) return res.json({ status: "idle", agentId: parseInt(agentId) });

      const call = await client.calls(activeCall.sid).fetch();

      // If Twilio reports a terminal status, clear tracking
      if (["completed", "canceled", "failed", "busy", "no-answer"].includes(call.status)) {
        console.log(`🧹 Clearing call ${call.sid} for agent ${agentId} after terminal status: ${call.status}`);
        callingNumbers.delete(activeCall.to);
        activeCalls.delete(parseInt(agentId));
        return res.json({ status: "idle", agentId: parseInt(agentId) });
      }

      res.json({ status: call.status, to: call.to, sid: call.sid, agentId: parseInt(agentId) });
    } else {
      // Get status for all agents
      const allStatus = {};
      for (const [agentId, activeCall] of activeCalls) {
        try {
          const call = await client.calls(activeCall.sid).fetch();
          allStatus[agentId] = { 
            status: call.status, 
            to: call.to, 
            sid: call.sid,
            agentPhone: activeCall.agentPhone
          };
          
          // If Twilio reports a terminal status, clear tracking
          if (["completed", "canceled", "failed", "busy", "no-answer"].includes(call.status)) {
            console.log(`🧹 Clearing call ${call.sid} for agent ${agentId} after terminal status: ${call.status}`);
            callingNumbers.delete(activeCall.to);
            activeCalls.delete(agentId);
            allStatus[agentId] = { status: "idle" };
          }
        } catch (err) {
          console.error(`❌ Error fetching status for agent ${agentId}:`, err);
          allStatus[agentId] = { status: "error" };
        }
      }
      res.json(allStatus);
    }
  } catch (err) {
    console.error("❌ Error fetching status:", err);
    res.status(500).json({ error: err.message });
  }
});

// Twilio webhook to handle call status updates
app.post("/twilio-webhook", express.urlencoded({ extended: true }), (req, res) => {
  const { CallSid, CallStatus, To, CallDuration } = req.body;
  
  console.log(`📞 Call ${CallSid} status: ${CallStatus} to ${To}`);
  
  // Update call session if it exists
  const callSession = callSessions.get(CallSid);
  if (callSession) {
    callSession.status = CallStatus;
    callSession.lastUpdate = new Date().toISOString();
    
    if (CallDuration) {
      callSession.duration = parseInt(CallDuration);
    }
    
    // Update call history
    const historyIndex = callHistory.findIndex(call => call.twilioSid === CallSid);
    if (historyIndex !== -1) {
      callHistory[historyIndex].status = CallStatus;
      callHistory[historyIndex].duration = callSession.duration;
      callHistory[historyIndex].lastUpdate = new Date().toISOString();
    }
  }
  
  // Clean up when call ends naturally
  if (['completed', 'failed', 'no-answer'].includes(CallStatus)) {
    // Find which agent this call belongs to
    for (const [agentId, activeCall] of activeCalls) {
      if (activeCall.sid === CallSid || activeCall.agentSid === CallSid) {
        callingNumbers.delete(activeCall.to);
        
        // Update final call record
        if (callSession) {
          callSession.isActive = false;
          callSession.endTime = new Date().toISOString();
          callSession.outcome = CallStatus === 'completed' ? 'Call completed successfully' : 
                              CallStatus === 'failed' ? 'Call failed' : 
                              CallStatus === 'no-answer' ? 'No answer' : 'Call ended';
        }
        
        activeCalls.delete(agentId);
        console.log(`🧹 Cleaned up completed call for agent ${agentId}: ${CallSid}`);
        break;
      }
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
  activeCalls.clear();
  console.log("🔄 All call tracking reset for all agents");
  res.json({ success: true, message: "All call tracking reset for all agents" });
});

// Reset endpoint for specific agent
app.post("/reset/:agentId", (req, res) => {
  const { agentId } = req.params;
  const agentIdNum = parseInt(agentId);
  
  if (activeCalls.has(agentIdNum)) {
    const activeCall = activeCalls.get(agentIdNum);
    callingNumbers.delete(activeCall.to);
    activeCalls.delete(agentIdNum);
    console.log(`🔄 Call tracking reset for agent ${agentId}`);
    res.json({ success: true, message: `Call tracking reset for agent ${agentId}` });
  } else {
    res.json({ success: true, message: `No active call found for agent ${agentId}` });
  }
});

// Additional endpoints for frontend compatibility
// Initialize/configure endpoint
app.post("/api/initialize", (req, res) => {
  const { accountSid, authToken, phoneNumber } = req.body;
  console.log("🔧 Twilio configuration received");
  res.json({ 
    success: true, 
    message: "Twilio configuration updated",
    accountSid,
    phoneNumber 
  });
});

// In-memory storage for demo purposes
let leads = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    phoneE164: "+1234567890",
    email: "john.doe@example.com",
    state: "California",
    timezone: "PST",
    status: "New",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    phoneE164: "+1987654321",
    email: "jane.smith@example.com",
    state: "New York",
    timezone: "EST",
    status: "Contacted",
    createdAt: new Date().toISOString()
  }
];

let calls = [
  {
    id: "1",
    phoneNumber: "+1234567890",
    callerName: "John Doe",
    callerEmail: "john.doe@example.com",
    duration: 120,
    status: "completed",
    outcome: "Successful call",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    phoneNumber: "+1987654321",
    callerName: "Jane Smith",
    callerEmail: "jane.smith@example.com",
    duration: 85,
    status: "completed",
    outcome: "Follow-up needed",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

// Leads management endpoints
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

app.post("/api/leads", (req, res) => {
  const lead = { 
    ...req.body, 
    id: Date.now().toString(), 
    createdAt: new Date().toISOString(),
    status: req.body.status || "New"
  };
  leads.push(lead);
  console.log("📝 New lead created:", lead);
  res.json({ success: true, lead });
});

app.put("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const leadIndex = leads.findIndex(lead => lead.id === id);
  if (leadIndex !== -1) {
    leads[leadIndex] = { ...leads[leadIndex], ...req.body };
    console.log("📝 Lead updated:", id, req.body);
    res.json({ success: true, lead: leads[leadIndex] });
  } else {
    res.status(404).json({ success: false, message: "Lead not found" });
  }
});

app.delete("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const leadIndex = leads.findIndex(lead => lead.id === id);
  if (leadIndex !== -1) {
    leads.splice(leadIndex, 1);
    console.log("🗑️ Lead deleted:", id);
    res.json({ success: true, message: "Lead deleted" });
  } else {
    res.status(404).json({ success: false, message: "Lead not found" });
  }
});

// Calls management endpoints
app.get("/api/calls", (req, res) => {
  res.json(callHistory);
});

// Get active call status for all agents or specific agent
app.get("/api/calls/active", (req, res) => {
  const { agentId } = req.query;
  
  if (agentId) {
    // Get active call for specific agent
    const activeCall = activeCalls.get(parseInt(agentId));
    if (activeCall && activeCall.callRecord) {
      const callSession = callSessions.get(activeCall.sid);
      if (callSession) {
        // Calculate real-time duration
        const currentDuration = Math.floor((Date.now() - callSession.startTimestamp) / 1000);
        res.json({
          ...callSession,
          duration: currentDuration,
          isActive: true,
          agentId: parseInt(agentId)
        });
      } else {
        res.json({ ...activeCall.callRecord, agentId: parseInt(agentId) });
      }
    } else {
      res.json({ isActive: false, agentId: parseInt(agentId) });
    }
  } else {
    // Get all active calls
    const allActiveCalls = {};
    for (const [agentId, activeCall] of activeCalls) {
      const callSession = callSessions.get(activeCall.sid);
      if (callSession) {
        const currentDuration = Math.floor((Date.now() - callSession.startTimestamp) / 1000);
        allActiveCalls[agentId] = {
          ...callSession,
          duration: currentDuration,
          isActive: true,
          agentId: agentId
        };
      } else {
        allActiveCalls[agentId] = { ...activeCall.callRecord, agentId: agentId };
      }
    }
    res.json(allActiveCalls);
  }
});

// Agent management endpoints
app.get("/api/agents", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM agents ORDER BY created_at DESC").all();
    // Add call status
    const agentsWithStatus = rows.map(agent => ({
      ...agent,
      isOnCall: activeCalls.has(agent.id),
      activeCall: activeCalls.has(agent.id) ? activeCalls.get(agent.id) : null
    }));
    res.json(agentsWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new agent
app.post("/api/agents", (req, res) => {
  try {
    const { name, email, phone, agent_phone } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const insertAgent = db.prepare(`
      INSERT INTO agents (name, email, phone, agent_phone, is_active) 
      VALUES (?, ?, ?, ?, 1)
    `);
    
    const result = insertAgent.run(name, email, phone || null, agent_phone || null);
    
    // Refresh agent phones
    AGENT_PHONES = getAgentPhones();
    
    res.json({ 
      success: true, 
      agent: { 
        id: result.lastInsertRowid, 
        name, 
        email, 
        phone, 
        agent_phone,
        is_active: 1
      } 
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update agent
app.put("/api/agents/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, agent_phone, is_active } = req.body;
    
    const updateAgent = db.prepare(`
      UPDATE agents 
      SET name = ?, email = ?, phone = ?, agent_phone = ?, is_active = ?
      WHERE id = ?
    `);
    
    const result = updateAgent.run(name, email, phone, agent_phone, is_active, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    
    // Refresh agent phones
    AGENT_PHONES = getAgentPhones();
    
    res.json({ success: true, message: "Agent updated successfully" });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete agent
app.delete("/api/agents/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if agent has active calls
    if (activeCalls.has(parseInt(id))) {
      return res.status(400).json({ error: "Cannot delete agent with active calls" });
    }
    
    const deleteAgent = db.prepare("DELETE FROM agents WHERE id = ?");
    const result = deleteAgent.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    
    // Refresh agent phones
    AGENT_PHONES = getAgentPhones();
    
    res.json({ success: true, message: "Agent deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available agents (not currently on a call)
app.get("/api/agents/available", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM agents").all();
    const availableAgents = rows.filter(agent => !activeCalls.has(agent.id)).map(agent => ({
      ...agent,
      phone: AGENT_PHONES[agent.id] || agent.phone
    }));
    res.json(availableAgents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get agent phone numbers configuration
app.get("/api/agents/phones", (req, res) => {
  res.json(AGENT_PHONES);
});

app.get("/api/agents/:id", (req, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get calls for specific agent
app.get("/api/agents/:id/calls", (req, res) => {
  const { id } = req.params;
  try {
    const rows = db.prepare("SELECT * FROM calls WHERE agent_id = ? ORDER BY created_at DESC").all(id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get agent-specific dashboard stats
app.get("/api/dashboard/agent/:id", (req, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare(`SELECT 
      COUNT(*) as totalCalls,
      SUM(duration) as totalDuration,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as successCalls
      FROM calls WHERE agent_id = ?`).get(id);
    const stats = row;
    stats.successRate = stats.totalCalls > 0 ? 
      Math.round((stats.successCalls / stats.totalCalls) * 100) : 0;
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/calls", (req, res) => {
  const call = { 
    ...req.body, 
    id: Date.now().toString(), 
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
  calls.push(call);
  console.log("📞 New call record created:", call);
  res.json({ success: true, call });
});

// Dashboard stats endpoint
app.get("/api/dashboard/stats", (req, res) => {
  const totalLeads = leads.length;
  const totalCalls = callHistory.length;
  const successCalls = callHistory.filter(call => call.status === 'completed').length;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0;
  const totalDuration = callHistory.reduce((sum, call) => sum + (call.duration || 0), 0);
  
  res.json({
    totalLeads,
    totalCalls,
    successRate,
    totalDuration
  });
});

// Settings endpoints
app.get("/api/settings", (req, res) => {
  res.json({
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || 'Your Twilio Account SID',
      authToken: process.env.TWILIO_AUTH_TOKEN || 'Your Twilio Auth Token',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Your Twilio Phone Number'
    },
    dialer: {
      maxConcurrentCalls: 1,
      callTimeout: 30,
      retryAttempts: 3
    }
  });
});

app.put("/api/settings", (req, res) => {
  console.log("⚙️ Settings updated:", req.body);
  res.json({ success: true, message: "Settings updated" });
});

// Serve agent dashboard HTML
app.get("/agent-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agent-dashboard.html'));
});

// Serve simple dialer HTML
app.get("/simple-dialer.html", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-dialer.html'));
});

// Export for Vercel
export default app;

// Only start server in development
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Frontend will be available at http://localhost:5173`);
    console.log(`🎯 API endpoints available at http://localhost:${PORT}/api`);
  });
}
