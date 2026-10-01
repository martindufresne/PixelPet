#!/usr/bin/env node
/**
 * CLI utility to notify PixelCat of any agent state.
 * Usage:
 *   node src/hooks/notify-agent.js --agent antigravity --state thinking
 *   node src/hooks/notify-agent.js --agent antigravity --state complete
 */
const http = require('http');

const args = process.argv.slice(2);
let agent = 'custom';
let state = 'complete';
let event = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--agent' && args[i + 1]) agent = args[++i];
  if (args[i] === '--state' && args[i + 1]) state = args[++i];
  if (args[i] === '--event' && args[i + 1]) event = args[++i];
}

const payload = JSON.stringify({
  agentId: agent,
  state: state,
  event: event || 'manual-trigger',
  timestamp: Date.now()
});

const req = http.request({
  hostname: '127.0.0.1',
  port: Number(process.env.COMNYANG_AGENT_STATE_PORT) || 23456,
  path: '/agent-state',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  },
  timeout: 500
}, (res) => {
  res.resume();
  process.exit(0);
});

req.on('error', () => {
  // Silent exit if pet is not running
  process.exit(0);
});

req.end(payload);
