#!/usr/bin/env node
/**
 * Antigravity CLI lifecycle hook
 */
const http = require('http');

const eventName = process.argv[2] || '';
const stateMap = {
  PreInvocation: 'thinking',
  PreToolUse: 'working',
  PostToolUse: 'working',
  PostInvocation: 'working',
  Stop: 'complete'
};

const state = stateMap[eventName] || 'complete';

const payload = JSON.stringify({
  agentId: 'antigravity',
  state: state,
  event: eventName,
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
  timeout: 300
}, (res) => {
  res.resume();
  process.stdout.write('{}\n');
  process.exit(0);
});

req.on('error', () => {
  process.stdout.write('{}\n');
  process.exit(0);
});

req.end(payload);
