#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { spawnSync } = require('child_process');

// ─── Secret patterns ──────────────────────────────────────────────────────────

const SECRET_PATTERNS = [
  { name: 'Anthropic / OpenAI API key',  regex: /sk-[a-zA-Z0-9]{20,}/g },
  { name: 'GitHub PAT (classic)',         regex: /ghp_[a-zA-Z0-9]{36}/g },
  { name: 'GitHub PAT (fine-grained)',    regex: /github_pat_[a-zA-Z0-9_]{82}/g },
  { name: 'AWS access key',              regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Bearer token',               regex: /Bearer\s+([a-zA-Z0-9._\-]{20,})/g },
  { name: 'Named secret',               regex: /[A-Z_]*(API_KEY|TOKEN|SECRET|PASSWORD|PASSWD)\s*[=:]\s*(\S{8,})/gi },
];

const SENSITIVE_ENV_NAMES = /\b[A-Z_]*(API_KEY|_TOKEN|_SECRET|_PASSWORD|_PASS|DATABASE_URL|DB_URL|PRIVATE_KEY|ACCESS_KEY|AUTH_KEY)[A-Z_]*\b/i;

const KNOWN_SAFE_MCP_HOSTS = [
  'anthropic.com',
  'claude.ai',
  'github.com',
  'google.com',
  'linear.app',
  'amazonaws.com',
  'googleapis.com',
];

// ─── Severity colors ──────────────────────────────────────────────────────────

const SEVERITY_COLORS_HTML = {
  HIGH: { border: '#ef4444', badge: '#dc2626' },
  WARN: { border: '#f59e0b', badge: '#d97706' },
  OK:   { border: '#22c55e', badge: '#16a34a' },
};

const SEVERITY_SYMBOLS = { HIGH: '🔴', WARN: '🟡', OK: '🟢' };

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const ANSI = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[37m',
};

let useColor = false;

function c(key, text)  { return useColor ? ANSI[key] + text + ANSI.reset : text; }
function cb(key, text) { return useColor ? ANSI[key] + ANSI.bold + text + ANSI.reset : text; }

// ─── Argument parsing ─────────────────────────────────────────────────────────

function parseArgs() {
  const args     = process.argv.slice(2);
  const htmlOnly = args.includes('--html-only');
  const html     = args.includes('--html') || htmlOnly;
  const noColor  = args.includes('--no-color');
  const today    = new Date().toISOString().slice(0, 10);
  return {
    showTerminal: !htmlOnly,
    showHtml:     html,
    noColor,
    htmlPath: path.join(__dirname, '..', 'reports', `audit-${today}.html`),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClaudeDir() {
  return path.join(os.homedir(), '.claude');
}

function truncateSecret(value) {
  if (!value || value.length <= 6) return value;
  return value.slice(0, 6) + '***';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Scanning ─────────────────────────────────────────────────────────────────

function scanShellSnapshots(claudeDir) {
  const target = 'shell-snapshots/';
  const dir    = path.join(claudeDir, 'shell-snapshots');

  if (!fs.existsSync(dir)) {
    return [{ severity: 'OK', target, file: null, pattern: 'Folder not present', preview: 'shell-snapshots/ does not exist', action: 'Nothing to scan' }];
  }

  let files;
  try {
    files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  } catch (e) {
    return [{ severity: 'WARN', target, file: null, pattern: 'Read error', preview: e.message, action: 'Check folder permissions' }];
  }

  if (files.length === 0) {
    return [{ severity: 'OK', target, file: null, pattern: 'Empty folder', preview: 'No files to scan', action: 'Nothing to scan' }];
  }

  const findings = [];

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(path.join(dir, file), 'utf-8');
    } catch (_) { continue; }

    for (const { name, regex } of SECRET_PATTERNS) {
      const re      = new RegExp(regex.source, regex.flags);
      const matches = [...content.matchAll(re)];
      for (const match of matches) {
        const raw = match[2] || match[1] || match[0];
        findings.push({
          severity: 'HIGH',
          target,
          file,
          pattern:  name,
          preview:  truncateSecret(raw),
          action:   'Rotate this credential immediately, then delete the file',
        });
      }
    }
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'OK',
      target,
      file:    null,
      pattern: `Scanned ${files.length} file${files.length !== 1 ? 's' : ''}`,
      preview: 'No credential patterns found',
      action:  'All clear',
    });
  }

  return findings;
}

function scanSessionEnv(claudeDir) {
  const target = 'session-env/';
  const dir    = path.join(claudeDir, 'session-env');

  if (!fs.existsSync(dir)) {
    return [{ severity: 'OK', target, file: null, pattern: 'Folder not present', preview: 'session-env/ does not exist', action: 'Nothing to scan' }];
  }

  let files;
  try {
    files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  } catch (e) {
    return [{ severity: 'WARN', target, file: null, pattern: 'Read error', preview: e.message, action: 'Check folder permissions' }];
  }

  if (files.length === 0) {
    return [{ severity: 'OK', target, file: null, pattern: 'Empty folder', preview: 'No files to scan', action: 'Nothing to scan' }];
  }

  const foundVars = new Set();
  let scannedCount = 0;

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(path.join(dir, file), 'utf-8');
      scannedCount++;
    } catch (_) { continue; }

    // Try JSON first (env dumps are often objects)
    let envObj = null;
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) envObj = parsed;
    } catch (_) {}

    if (envObj) {
      for (const key of Object.keys(envObj)) {
        if (SENSITIVE_ENV_NAMES.test(key)) foundVars.add(key);
      }
    } else {
      // Plain text: look for KEY=value lines
      for (const line of content.split('\n')) {
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          const key = line.slice(0, eqIdx).trim();
          if (SENSITIVE_ENV_NAMES.test(key)) foundVars.add(key);
        }
      }
    }
  }

  if (foundVars.size === 0) {
    return [{
      severity: 'OK',
      target,
      file:    null,
      pattern: `Scanned ${scannedCount} file${scannedCount !== 1 ? 's' : ''}`,
      preview: 'No sensitive variable names found',
      action:  'All clear',
    }];
  }

  return [...foundVars].sort().map(varName => ({
    severity: 'WARN',
    target,
    file:    null,
    pattern: 'Sensitive environment variable name present',
    preview: varName,
    action:  'Review whether this value should be in session snapshots; delete session-env/ if concerned',
  }));
}

function scanMcpAuthCache(claudeDir) {
  const target   = 'mcp-needs-auth-cache.json';
  const filePath = path.join(claudeDir, target);

  if (!fs.existsSync(filePath)) {
    return [{ severity: 'OK', target, file: null, pattern: 'File not present', preview: 'mcp-needs-auth-cache.json not found', action: 'Nothing to scan' }];
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return [{ severity: 'WARN', target, file: null, pattern: 'Parse error', preview: e.message, action: 'File may be malformed — inspect manually' }];
  }

  const hosts = new Set();

  function extractHosts(obj) {
    if (typeof obj === 'string') {
      try { hosts.add(new URL(obj).hostname); } catch (_) {
        if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(obj)) hosts.add(obj);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(extractHosts);
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(key)) hosts.add(key);
        extractHosts(obj[key]);
      }
    }
  }
  extractHosts(parsed);

  if (hosts.size === 0) {
    return [{ severity: 'OK', target, file: null, pattern: 'No external services found', preview: 'File contains no host entries', action: 'All clear' }];
  }

  const unknown = [...hosts].sort().filter(
    h => !KNOWN_SAFE_MCP_HOSTS.some(safe => h === safe || h.endsWith('.' + safe))
  );

  if (unknown.length === 0) {
    return [{
      severity: 'OK',
      target,
      file:    null,
      pattern: `${hosts.size} service${hosts.size !== 1 ? 's' : ''} found`,
      preview: [...hosts].sort().join(', '),
      action:  'All recognized — all clear',
    }];
  }

  return unknown.map(host => ({
    severity: 'WARN',
    target,
    file:    null,
    pattern: 'Unrecognized external service',
    preview: host,
    action:  'Verify you authorized this MCP service — if unrecognized, revoke access in Claude Code settings',
  }));
}

function runAudit(claudeDir) {
  return [
    ...scanShellSnapshots(claudeDir),
    ...scanSessionEnv(claudeDir),
    ...scanMcpAuthCache(claudeDir),
  ];
}

// ─── Terminal renderer ────────────────────────────────────────────────────────

function renderTerminal(findings, { highCount, warnCount, okCount }) {
  const WIDTH   = 70;
  const border  = '═'.repeat(WIDTH);
  const divider = c('gray', '─'.repeat(WIDTH));
  const now     = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  console.log(cb('cyan', border));
  console.log(cb('cyan', '  ~/.claude Security Audit'));
  console.log(c('cyan', '  ' + now));
  console.log(cb('cyan', border));
  console.log();

  const highStr = cb(highCount > 0 ? 'red'    : 'gray', highCount + ' HIGH');
  const warnStr = cb(warnCount > 0 ? 'yellow' : 'gray', warnCount + ' WARN');
  const okStr   = cb('green', okCount + ' OK');
  console.log('  ' + highStr + '   ' + warnStr + '   ' + okStr);
  console.log();

  // Disclaimer — always shown
  const D = c('gray', '  │ ');
  console.log(c('gray', '  ┌─ ') + cb('yellow', '⚠  DISCLAIMER') + c('gray', ' ' + '─'.repeat(WIDTH - 22) + '┐'));
  console.log(D + 'This tool uses pattern matching and is NOT exhaustive.');
  console.log(D + 'Secrets may exist that it cannot detect. A clean result');
  console.log(D + 'does NOT mean your data is secure — it means no known');
  console.log(D + 'patterns were matched in the scanned files.');
  console.log(D);
  console.log(D + 'Findings may be false positives. Absences may be false');
  console.log(D + 'negatives. You are responsible for your own due diligence,');
  console.log(D + 'manual verification, and compliance with any security');
  console.log(D + 'policies or protocols applicable to your work.');
  console.log(c('gray', '  └' + '─'.repeat(WIDTH - 4) + '┘'));
  console.log();

  if (highCount > 0) {
    console.log(cb('red', '  ⚠  Possible credentials detected. Rotate affected keys and delete the listed files.'));
    console.log();
  }

  const order  = { HIGH: 0, WARN: 1, OK: 2 };
  const sorted = [...findings].sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  for (const f of sorted) {
    console.log(divider);
    console.log();
    const sevColor = f.severity === 'HIGH' ? 'red' : f.severity === 'WARN' ? 'yellow' : 'green';
    const sym      = SEVERITY_SYMBOLS[f.severity] || '';
    const fileStr  = f.file ? c('gray', '  ' + f.file) : '';
    console.log('  ' + sym + '  ' + cb(sevColor, f.severity) + '  ' + cb('white', f.target) + fileStr);
    console.log('  ' + c('gray', 'Pattern:') + '  ' + f.pattern);
    console.log('  ' + c('gray', 'Found:  ') + '  ' + cb('white', f.preview));
    console.log('  ' + c('gray', 'Action: ') + '  ' + f.action);
    console.log();
  }

  console.log(cb('cyan', border));
  console.log();
  console.log(c('gray', '  Read-only — no files were modified.'));
  if (!findings.some(f => f.severity !== 'OK')) {
    console.log(c('green', '  ✓ No issues found.'));
  }
  console.log(c('yellow', '  Tip: run  node scripts/audit.js --html  for a visual report'));
  console.log();
}

// ─── HTML renderer ────────────────────────────────────────────────────────────

function renderHTML(findings, { highCount, warnCount, okCount }) {
  const now    = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const order  = { HIGH: 0, WARN: 1, OK: 2 };
  const sorted = [...findings].sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  const cards = sorted.map(f => {
    const colors  = SEVERITY_COLORS_HTML[f.severity] || SEVERITY_COLORS_HTML.OK;
    const sym     = SEVERITY_SYMBOLS[f.severity] || '';
    const fileEl  = f.file ? `<span class="finding-file">${escapeHtml(f.file)}</span>` : '';
    return `
    <div class="finding-card" style="border-left-color:${colors.border}">
      <div class="finding-header">
        <span class="finding-target"><code>${escapeHtml(f.target)}</code>${fileEl}</span>
        <span class="badge" style="background:${colors.badge}">${sym} ${escapeHtml(f.severity)}</span>
      </div>
      <div class="finding-row"><span class="finding-label">Pattern</span><span class="finding-value">${escapeHtml(f.pattern)}</span></div>
      <div class="finding-row"><span class="finding-label">Found</span><span class="finding-value finding-preview">${escapeHtml(f.preview)}</span></div>
      <div class="finding-row"><span class="finding-label">Action</span><span class="finding-value finding-action">${escapeHtml(f.action)}</span></div>
    </div>`;
  }).join('\n');

  const summaryClass = highCount > 0 ? 'status-high' : warnCount > 0 ? 'status-warn' : 'status-ok';
  const summaryMsg   = highCount > 0
    ? `⚠ ${highCount} possible credential${highCount > 1 ? 's' : ''} found — rotate immediately`
    : warnCount > 0
      ? `${warnCount} item${warnCount > 1 ? 's' : ''} to review`
      : '✓ No issues found';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>~/.claude Security Audit</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
      padding: 2rem;
    }
    header { text-align: center; margin-bottom: 2rem; }
    h1 { font-size: 2rem; color: #0f172a; }
    .subtitle { color: #64748b; margin-top: 0.25rem; font-size: 0.95rem; }

    .summary {
      display: flex;
      gap: 2rem;
      align-items: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-value.high { color: #dc2626; }
    .stat-value.warn { color: #d97706; }
    .stat-value.ok   { color: #16a34a; }
    .summary-msg {
      margin-left: auto;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.45rem 1rem;
      border-radius: 8px;
    }
    .status-high { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .status-warn { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .status-ok   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

    .findings { display: flex; flex-direction: column; gap: 1rem; }
    .finding-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-left-width: 4px;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .finding-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .finding-target { font-size: 0.95rem; font-weight: 600; color: #0f172a; }
    .finding-target code {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.9rem;
    }
    .finding-file {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.8rem;
      color: #64748b;
      margin-left: 0.4rem;
    }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      color: white;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    .finding-row { display: flex; gap: 0.75rem; font-size: 0.875rem; align-items: baseline; }
    .finding-label {
      min-width: 4.5rem;
      color: #64748b;
      font-weight: 500;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .finding-value { color: #334155; }
    .finding-preview {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #0f172a;
      font-weight: 600;
    }
    .finding-action { color: #0369a1; }
    .disclaimer {
      background: #fffbeb;
      border: 1px solid #f59e0b;
      border-left: 4px solid #f59e0b;
      border-radius: 10px;
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      color: #78350f;
    }
    .disclaimer strong { color: #92400e; }
    footer {
      text-align: center;
      margin-top: 2.5rem;
      color: #94a3b8;
      font-size: 0.8rem;
      line-height: 2;
    }
    footer code {
      font-size: 0.78rem;
      background: #f1f5f9;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header>
    <h1>~/.claude Security Audit</h1>
    <p class="subtitle">${escapeHtml(now)}</p>
  </header>

  <div class="summary">
    <div class="stat">
      <div class="stat-label">HIGH</div>
      <div class="stat-value high">${highCount}</div>
    </div>
    <div class="stat">
      <div class="stat-label">WARN</div>
      <div class="stat-value warn">${warnCount}</div>
    </div>
    <div class="stat">
      <div class="stat-label">OK</div>
      <div class="stat-value ok">${okCount}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Targets Scanned</div>
      <div class="stat-value">${3}</div>
    </div>
    <div class="summary-msg ${summaryClass}">${escapeHtml(summaryMsg)}</div>
  </div>

  <div class="disclaimer">
    <strong>⚠ Disclaimer — read before acting on these results:</strong>
    <ul style="margin-top:0.5rem;padding-left:1.25rem;display:flex;flex-direction:column;gap:0.3rem;">
      <li>This tool uses pattern matching and is <strong>not exhaustive</strong>. Secrets may exist that it cannot detect.</li>
      <li>A <strong>clean result does not mean your data is secure</strong> — it means no known patterns were matched in the scanned files.</li>
      <li>Findings may be <strong>false positives</strong>. Absences may be <strong>false negatives</strong>.</li>
      <li>You are responsible for your own <strong>due diligence, manual verification, and compliance</strong> with any security policies or protocols applicable to your work.</li>
      <li>This tool is a helper to surface potential risks — it is <strong>not a substitute for a professional security review</strong>.</li>
    </ul>
  </div>

  <div class="findings">
    ${cards}
  </div>

  <footer>
    Generated by <strong>claude-manager</strong> &mdash; ${escapeHtml(now)}<br>
    Read-only &mdash; no files were modified &nbsp;|&nbsp;
    Run again: <code>node scripts/audit.js --html</code>
  </footer>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs();
  useColor = process.stdout.isTTY && !opts.noColor;

  const claudeDir = getClaudeDir();

  if (!fs.existsSync(claudeDir)) {
    console.error('Error: ~/.claude not found at ' + claudeDir);
    console.error('Is Claude Code installed?');
    process.exit(1);
  }

  const findings   = runAudit(claudeDir);
  const highCount  = findings.filter(f => f.severity === 'HIGH').length;
  const warnCount  = findings.filter(f => f.severity === 'WARN').length;
  const okCount    = findings.filter(f => f.severity === 'OK').length;
  const summary    = { highCount, warnCount, okCount };

  if (opts.showTerminal) {
    renderTerminal(findings, summary);
  }

  if (opts.showHtml) {
    const html = renderHTML(findings, summary);
    try {
      fs.mkdirSync(path.dirname(opts.htmlPath), { recursive: true });
      fs.writeFileSync(opts.htmlPath, html, 'utf-8');
      const msg = 'HTML report saved to: ' + opts.htmlPath;
      opts.showTerminal ? console.log('  ' + msg) : console.log(msg);
      const openCmd = os.platform() === 'darwin' ? 'open' : 'xdg-open';
      spawnSync(openCmd, [opts.htmlPath], { detached: true, stdio: 'ignore' });
    } catch (e) {
      console.error('Error writing HTML file: ' + e.message);
      process.exit(1);
    }
  }
}

main();
