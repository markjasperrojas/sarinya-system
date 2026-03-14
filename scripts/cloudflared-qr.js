#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { bin: CLOUDFLARED, install } = require('cloudflared');

const args = ['tunnel', '--url', 'http://localhost:3000'];

async function main() {
  if (!fs.existsSync(CLOUDFLARED)) {
    console.log('[cloudflared] Binary not found, downloading...');
    await install(CLOUDFLARED);
  }

  const proc = spawn(CLOUDFLARED, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  proc.on('error', (err) => {
    console.warn('[cloudflared] Failed to start:', err.message);
    console.warn('[cloudflared] Tunnel unavailable — demo running locally only.');
    process.exit(0);
  });

  function handleLine(line) {
    process.stdout.write(line + '\n');
    const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      console.log('\n  Public URL: ' + url + '\n');
      qrcode.generate(url, { small: true });
    }
  }

  function makeLineReader(stream) {
    let buf = '';
    stream.on('data', chunk => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      lines.forEach(handleLine);
    });
    stream.on('end', () => { if (buf) handleLine(buf); });
  }

  makeLineReader(proc.stdout);
  makeLineReader(proc.stderr);

  proc.on('exit', code => process.exit(code || 0));
  process.on('SIGINT', () => proc.kill('SIGINT'));
  process.on('SIGTERM', () => proc.kill('SIGTERM'));
}

main().catch((err) => {
  console.warn('[cloudflared] Unexpected error:', err.message);
  process.exit(0);
});
