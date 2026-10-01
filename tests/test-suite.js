/**
 * Automated Verification Suite for PixelPet / Comnyang
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('--- Starting PixelPet Verification Suite ---');

// 1. Verify Species Registry
const registry = require('../src/species/registry');
const speciesList = registry.list();
console.log('Available species:', speciesList.map(s => s.id));
assert.strictEqual(speciesList.length >= 2, true, 'Must have at least cat and dog');

const cat = registry.get('cat');
const dog = registry.get('dog');

assert.strictEqual(cat.id, 'cat');
assert.strictEqual(dog.id, 'dog');

// 2. Verify Audio separation (Dog must NOT meow!)
console.log('Cat sounds:', cat.sounds);
console.log('Dog sounds:', dog.sounds);

assert.strictEqual(cat.sounds.meow.includes('meow'), true, 'Cat should have meow sound');
assert.strictEqual(dog.sounds.meow.includes('bark'), true, 'Dog must have bark sound instead of meow');
assert.strictEqual(dog.sounds.purr.includes('pant'), true, 'Dog must have pant sound instead of purr');
assert.strictEqual(dog.sounds.alert.includes('bark-alert'), true, 'Dog must have bark-alert');

// 3. Verify Audio Files on disk
for (const [k, relPath] of Object.entries(cat.sounds)) {
  const full = path.join(__dirname, '..', relPath);
  assert.strictEqual(fs.existsSync(full), true, `Cat sound ${k} (${relPath}) must exist`);
}
for (const [k, relPath] of Object.entries(dog.sounds)) {
  const full = path.join(__dirname, '..', relPath);
  assert.strictEqual(fs.existsSync(full), true, `Dog sound ${k} (${relPath}) must exist`);
}

// 4. Verify SVG Models on disk
const catSvg = path.join(__dirname, '..', 'svg', 'cat-idle-follow-v2.svg');
const dogSvg = path.join(__dirname, '..', 'svg', 'dog-idle-follow.svg');
assert.strictEqual(fs.existsSync(catSvg), true, 'Cat SVG model must exist');
assert.strictEqual(fs.existsSync(dogSvg), true, 'Dog SVG model must exist');

const catSvgContent = fs.readFileSync(catSvg, 'utf8');
const dogSvgContent = fs.readFileSync(dogSvg, 'utf8');

// Dog SVG should have eye pupils, body, face, and collar
assert.strictEqual(dogSvgContent.includes('pupil-left'), true, 'Dog SVG must have pupil-left');
assert.strictEqual(dogSvgContent.includes('pupil-right'), true, 'Dog SVG must have pupil-right');
assert.strictEqual(dogSvgContent.includes('body-js'), true, 'Dog SVG must have body-js');
assert.strictEqual(dogSvgContent.includes('face-js'), true, 'Dog SVG must have face-js');
assert.strictEqual(dogSvgContent.includes('dog-collar'), true, 'Dog SVG must have collar');

// 5. Verify Presets on disk
const presetsDir = path.join(__dirname, '..', 'assets', 'presets');
const presetFiles = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json'));
console.log('Presets found:', presetFiles);
assert.strictEqual(presetFiles.length >= 7, true, 'Should have all authentic cat presets');

for (const p of presetFiles) {
  const content = JSON.parse(fs.readFileSync(path.join(presetsDir, p), 'utf8'));
  assert.strictEqual(typeof content.baseColor, 'string', `${p} must have baseColor`);
}

// 6. Verify Agent HTTP Server
const AgentServer = require('../src/main/agent-server');
let receivedEvent = null;
const server = new AgentServer({
  port: 24567,
  onAgentState: (data) => {
    receivedEvent = data;
  }
});

server.start();
setTimeout(() => {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 24567,
    path: '/agent-state',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      server.stop();
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(receivedEvent.state, 'complete');
      assert.strictEqual(receivedEvent.agent, 'antigravity');
      console.log('✓ Agent Server HTTP test passed!');
      console.log('✓ All PixelPet verification checks passed successfully!');
      process.exit(0);
    });
  });

  req.write(JSON.stringify({ agent: 'antigravity', state: 'complete', task: 'Verified' }));
  req.end();
}, 200);
