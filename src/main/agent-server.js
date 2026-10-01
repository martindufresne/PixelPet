/**
 * Agent State Server
 * Écoute sur 127.0.0.1:23456 pour recevoir les notifications d'état des agents IA
 * (Antigravity, Claude Code, Cursor, Codex, etc.)
 */
const http = require('http');

const DEFAULT_PORT = 23456;
const STATE_PATH = '/agent-state';

class AgentServer {
  constructor({ port = DEFAULT_PORT, onAgentState } = {}) {
    this.port = Number(process.env.COMNYANG_AGENT_STATE_PORT) || port;
    this.onAgentState = onAgentState;
    this.server = null;
  }

  start() {
    if (this.server) return;

    this.server = http.createServer((req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && (req.url === '/' || req.url === '/health' || req.url === '/status')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', app: 'pixelCat', server: 'running' }));
        return;
      }

      if (req.method === 'POST' && req.url === STATE_PATH) {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', chunk => {
          body += chunk;
          if (body.length > 1e6) {
            req.destroy();
          }
        });

        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            if (this.onAgentState && data && data.state) {
              console.log(`[AgentServer] Received agent state: ${data.agentId || 'unknown'} -> ${data.state} (${data.event || ''})`);
              this.onAgentState(data);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[AgentServer] Port ${this.port} is already in use. Agent state HTTP listener skipped.`);
      } else {
        console.error('[AgentServer] HTTP server error:', err);
      }
    });

    this.server.listen(this.port, '127.0.0.1', () => {
      console.log(`[AgentServer] Listening for AI Agent hooks on http://127.0.0.1:${this.port}${STATE_PATH}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

module.exports = AgentServer;
