const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'agents.db');
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  // Users/Agents table
  db.run(`CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Calls table with agent tracking
  db.run(`CREATE TABLE IF NOT EXISTS calls (
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
    twilio_sid TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents (id)
  )`);

  // Insert sample agents
  db.run(`INSERT OR IGNORE INTO agents (name, email, phone) VALUES 
    ('Agent 1', 'agent1@company.com', '+1234567890'),
    ('Agent 2', 'agent2@company.com', '+1234567891'),
    ('Agent 3', 'agent3@company.com', '+1234567892'),
    ('Admin', 'admin@company.com', '+1234567893')
  `);
});

module.exports = db;
