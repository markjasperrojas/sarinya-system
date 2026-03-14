#!/usr/bin/env node
const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');

const CLOUDFLARED = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';
const args = ['tunnel', '--url', 'http://localhost:3000'];

const proc = spawn(CLOUDFLARED, args, { stdio: ['ignore', 'pipe', 'pipe'] });

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
