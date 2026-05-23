#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const http = require('http');
const { spawnSync } = require('child_process');

// ─── Metadata ────────────────────────────────────────────────────────────────

const FOLDER_METADATA = {
  backups: {
    importance:    'CRITICAL',
    description:   'Timestamped backups of your Claude Code config (.claude.json), created automatically every 10–15 minutes. Contains encrypted API keys, settings, hooks, and permission overrides.',
    spaceFreeable: 'None recommended (keep last 1–2 weeks)',
    freeablePct:   0.0,
    proDelete:     'Reduces backup clutter',
    conDelete:     'Lose ability to roll back config changes',
    docsUrl:       'https://code.claude.com/docs/en/settings',
  },
  cache: {
    importance:    'LOW',
    description:   'Cached data from external sources — Claude Code changelog, GitHub issue lists. Rebuilt automatically on next run.',
    spaceFreeable: 'All (100%)',
    freeablePct:   1.0,
    proDelete:     'Instant space recovery, no impact',
    conDelete:     'Slight slowdown on first run after deletion',
    docsUrl:       null,
  },
  debug: {
    importance:    'LOW',
    description:   'Debug logs and symlinks written during troubleshooting sessions. Usually empty; only populated when debug mode is active.',
    spaceFreeable: 'All (100%)',
    freeablePct:   1.0,
    proDelete:     'No impact',
    conDelete:     'Lose debug context if actively troubleshooting',
    docsUrl:       'https://code.claude.com/docs/en/troubleshooting',
  },
  downloads: {
    importance:    'LOW',
    description:   'Unused placeholder folder. Claude Code reserves this path but does not currently write anything here.',
    spaceFreeable: 'All (100%)',
    freeablePct:   1.0,
    proDelete:     'No impact',
    conDelete:     'None',
    docsUrl:       null,
  },
  'file-history': {
    importance:    'MEDIUM',
    description:   'Versioned snapshots of files you edited during Claude Code sessions. Powers the undo/redo feature for file edits. Grows with every session.',
    spaceFreeable: 'Files older than 7 days (~70%)',
    freeablePct:   0.7,
    proDelete:     'Significant space recovery',
    conDelete:     'Lose undo history for older edit sessions',
    docsUrl:       null,
  },
  ide: {
    importance:    'LOW',
    description:   'Lock files tracking active IDE connections (VS Code, JetBrains). Stale when Claude Code is not running.',
    spaceFreeable: 'All when Claude not running (100%)',
    freeablePct:   1.0,
    proDelete:     'No impact, regenerated automatically',
    conDelete:     'None',
    docsUrl:       'https://code.claude.com/docs/en/ide-integrations',
  },
  plans: {
    importance:    'MEDIUM',
    description:   'Plan-mode session files written during planning conversations. One file per planning session, grows over time.',
    spaceFreeable: 'Completed plans (~70%)',
    freeablePct:   0.7,
    proDelete:     'Cleaner workspace, space recovery',
    conDelete:     'Lose plan history from past sessions',
    docsUrl:       'https://code.claude.com/docs/en/overview',
  },
  plugins: {
    importance:    'HIGH',
    description:   'Installed Claude Code plugins and cached marketplace data. The installed plugin data is needed for plugins to work; the marketplace cache is optional.',
    spaceFreeable: 'Marketplace cache only (~50%)',
    freeablePct:   0.5,
    proDelete:     'Slimmer install footprint',
    conDelete:     'Re-downloads marketplace data on next update check, installed plugins may need reinstall',
    docsUrl:       'https://code.claude.com/docs/en/plugins',
  },
  projects: {
    importance:    'CRITICAL',
    description:   'Conversation transcripts from every Claude Code session, organized by project path. This is the largest and most sensitive folder — contains full chat logs, file contents, and session context.',
    spaceFreeable: 'Old project conversations (60-80%)',
    freeablePct:   0.7,
    proDelete:     'Massive space savings, privacy improvement',
    conDelete:     'Lose conversation history and session context continuity',
    docsUrl:       'https://code.claude.com/docs/en/memory',
  },
  'session-env': {
    importance:    'LOW',
    description:   'Shell environment state snapshots captured at session start. Used to restore context between sessions. Regenerated on each new session.',
    spaceFreeable: 'All older than current session (100%)',
    freeablePct:   1.0,
    proDelete:     'No impact, regenerated automatically',
    conDelete:     'None',
    docsUrl:       null,
  },
  sessions: {
    importance:    'LOW',
    description:   'Active session tracking files. Only meaningful while Claude Code is running; stale files accumulate when sessions end unexpectedly.',
    spaceFreeable: 'All when Claude not running (100%)',
    freeablePct:   1.0,
    proDelete:     'No impact, regenerated automatically',
    conDelete:     'None',
    docsUrl:       null,
  },
  'shell-snapshots': {
    importance:    'LOW',
    description:   'Full shell environment captures including PATH, env vars, and shell state. Can contain sensitive environment variables. Safe to delete at any time.',
    spaceFreeable: 'All (100%)',
    freeablePct:   1.0,
    proDelete:     'Space recovery and privacy improvement (may contain secrets in env vars)',
    conDelete:     'None — regenerated automatically',
    docsUrl:       null,
  },
  skills: {
    importance:    'HIGH',
    description:   'Locally installed custom skills (slash commands). Deleting this folder disables any custom skills you have installed.',
    spaceFreeable: 'None recommended',
    freeablePct:   0.0,
    proDelete:     'None',
    conDelete:     'All custom skills stop working until reinstalled',
    docsUrl:       'https://code.claude.com/docs/en/slash-commands',
  },
  telemetry: {
    importance:    'LOW',
    description:   'Queue of pending telemetry events that failed to send. Retried on next run. Safe to clear at any time.',
    spaceFreeable: 'All (100%)',
    freeablePct:   1.0,
    proDelete:     'No impact (events were already queued, will not be sent)',
    conDelete:     'None',
    docsUrl:       null,
  },
  todos: {
    importance:    'HIGH',
    description:   'Persisted todo lists from Claude Code sessions. These are the in-session task lists Claude maintains. Active todos may still be relevant.',
    spaceFreeable: 'Completed/old todos (~50%)',
    freeablePct:   0.5,
    proDelete:     'Cleaner state, slight space recovery',
    conDelete:     'Lose todo history from past sessions',
    docsUrl:       null,
  },
};

const IMPORTANCE_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };

const IMPORTANCE_COLORS_TERMINAL = {
  CRITICAL: 'red',
  HIGH:     'yellow',
  MEDIUM:   'cyan',
  LOW:      'gray',
  UNKNOWN:  'white',
};

const IMPORTANCE_COLORS_HTML = {
  CRITICAL: { border: '#ef4444', badge: '#dc2626', bar: '#ef4444' },
  HIGH:     { border: '#f59e0b', badge: '#d97706', bar: '#f59e0b' },
  MEDIUM:   { border: '#06b6d4', badge: '#0891b2', bar: '#06b6d4' },
  LOW:      { border: '#9ca3af', badge: '#6b7280', bar: '#9ca3af' },
  UNKNOWN:  { border: '#d1d5db', badge: '#6b7280', bar: '#d1d5db' },
};

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const ANSI = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[37m',
};

let useColor = false;

function c(key, text) {
  return useColor ? ANSI[key] + text + ANSI.reset : text;
}

function cb(key, text) {
  return useColor ? ANSI[key] + ANSI.bold + text + ANSI.reset : text;
}

// ─── Argument parsing ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const htmlOnly = args.includes('--html-only');
  const html     = args.includes('--html') || htmlOnly;
  const noColor  = args.includes('--no-color');
  return {
    showTerminal: !htmlOnly,
    showHtml:     html,
    noColor,
    htmlPath: path.join(__dirname, '..', 'reports', 'claude-dashboard.html'),
  };
}

// ─── Size utilities ───────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  if (bytes < KB) return bytes + ' B';
  if (bytes < MB) return (bytes / KB).toFixed(1) + ' KB';
  if (bytes < GB) return (bytes / MB).toFixed(1) + ' MB';
  return (bytes / GB).toFixed(2) + ' GB';
}

function recursiveSize(dirPath) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      try {
        if (entry.isSymbolicLink()) {
          total += fs.lstatSync(full).size;
        } else if (entry.isDirectory()) {
          total += recursiveSize(full);
        } else {
          total += fs.lstatSync(full).size;
        }
      } catch (_) { /* skip inaccessible entries */ }
    }
  } catch (_) { /* skip inaccessible dirs */ }
  return total;
}

function getFolderSize(folderPath) {
  const platform = os.platform();
  try {
    if (platform === 'darwin') {
      const result = spawnSync('du', ['-sk', folderPath], { encoding: 'utf-8' });
      if (!result.error && result.status === 0 && result.stdout) {
        const blocks = parseInt(result.stdout.split('\n')[0].split('\t')[0], 10);
        if (!isNaN(blocks)) return blocks * 1024;
      }
    } else {
      const result = spawnSync('du', ['-sb', folderPath], { encoding: 'utf-8' });
      if (!result.error && result.status === 0 && result.stdout) {
        const bytes = parseInt(result.stdout.split('\n')[0].split('\t')[0], 10);
        if (!isNaN(bytes)) return bytes;
      }
    }
  } catch (_) { /* fall through to recursive */ }
  return recursiveSize(folderPath);
}

// ─── Scanning ─────────────────────────────────────────────────────────────────

function getClaudeDir() {
  return path.join(os.homedir(), '.claude');
}

function scanFolders(claudeDir) {
  if (!fs.existsSync(claudeDir)) {
    console.error('Error: ~/.claude not found at ' + claudeDir);
    console.error('Is Claude Code installed?');
    process.exit(1);
  }

  let entries;
  try {
    entries = fs.readdirSync(claudeDir, { withFileTypes: true });
  } catch (e) {
    console.error('Error reading ' + claudeDir + ': ' + e.message);
    process.exit(1);
  }

  const folders = entries
    .filter(e => e.isDirectory())
    .map(e => e.name);

  const results = folders.map(name => {
    const folderPath = path.join(claudeDir, name);
    const size = getFolderSize(folderPath);
    const meta = FOLDER_METADATA[name] || {
      importance:    'UNKNOWN',
      description:   'Unknown folder — not in the documented folder list. May be added by a newer version of Claude Code.',
      spaceFreeable: 'Unknown',
      freeablePct:   0,
      proDelete:     'Unknown',
      conDelete:     'Unknown — review before deleting',
    };
    return {
      name:          name + '/',
      bareName:      name,
      path:          folderPath,
      size,
      sizeFormatted: formatSize(size),
      ...meta,
    };
  });

  results.sort((a, b) => {
    const diff = (IMPORTANCE_ORDER[a.importance] ?? 4) - (IMPORTANCE_ORDER[b.importance] ?? 4);
    return diff !== 0 ? diff : b.size - a.size;
  });

  return results;
}

// ─── Terminal renderer ────────────────────────────────────────────────────────

function renderTerminal(folders, { totalSize, freeableSize, htmlMode, unknowns }) {
  const WIDTH = 70;
  const border = '═'.repeat(WIDTH);
  const divider = c('gray', '─'.repeat(WIDTH));
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  console.log(cb('cyan', border));
  console.log(cb('cyan', '  ~/.claude Folder Dashboard'));
  console.log(c('cyan', '  ' + now));
  console.log(cb('cyan', border));
  console.log();

  // Summary bar
  const totalStr    = cb('white', formatSize(totalSize));
  const countStr    = cb('white', String(folders.length));
  const freeStr     = cb('green', '~' + formatSize(freeableSize));
  console.log('  Total size: ' + totalStr + '   Folders: ' + countStr + '   Est. freeable: ' + freeStr);
  console.log();

  // Unknown folder warning
  if (unknowns && unknowns.length > 0) {
    const label = unknowns.length === 1 ? 'UNRECOGNIZED FOLDER DETECTED' : 'UNRECOGNIZED FOLDERS DETECTED';
    console.log(cb('yellow', '  ⚠  ' + unknowns.length + ' ' + label));
    for (const f of unknowns) {
      console.log(c('gray', '     ' + f.name + '  —  Not in the documented list. Do not delete without research.'));
    }
    console.log(c('gray', '  Update FOLDER_METADATA in scripts/scan.js to clear this warning.'));
    console.log();
  }

  // Importance legend
  console.log('  ' + c('gray', 'Importance: ') +
    cb('red',    'CRITICAL') + c('gray', ' = do not delete   ') +
    cb('yellow', 'HIGH')     + c('gray', ' = think first   ') +
    cb('cyan',   'MEDIUM')   + c('gray', ' = review old entries   ') +
    cb('gray',   'LOW')      + c('gray', ' = safe to delete'));
  console.log();

  for (const folder of folders) {
    console.log(divider);
    console.log();

    const importanceColor = IMPORTANCE_COLORS_TERMINAL[folder.importance] || 'white';
    const namePart        = cb('white', '  ' + folder.name);
    const importancePart  = cb(importanceColor, '  ' + folder.importance);
    console.log(namePart + importancePart);

    console.log(c('gray', '  ' + folder.path));

    const sizePart     = 'Size: ' + cb('white', folder.sizeFormatted);
    const freeablePart = '   Freeable: ' + c('green', folder.spaceFreeable);
    console.log('  ' + sizePart + freeablePart);

    console.log('  ' + folder.description);

    console.log('  ' + c('gray', 'Pro delete:') + ' ' + folder.proDelete);
    console.log('  ' + c('gray', 'Con delete:') + ' ' + folder.conDelete);
    console.log();
  }

  console.log(cb('cyan', border));

  if (!htmlMode) {
    console.log();
    console.log(c('yellow', '  Tip: run  node scripts/scan.js --html  to generate a visual HTML report'));
  } else {
    console.log();
  }
}

// ─── HTML renderer ────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listItems(str) {
  if (!str || str === 'None') return '<li>None</li>';
  return str.split(/,\s+/).map(s => '<li>' + escapeHtml(s.trim()) + '</li>').join('');
}

function renderHTML(folders, { totalSize, freeableSize, unknowns }) {
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const maxSize = Math.max(...folders.map(f => f.size), 1);

  const unknownBanner = (!unknowns || unknowns.length === 0) ? '' : `
  <div class="unknown-alert">
    <div class="unknown-alert-title">⚠ ${unknowns.length} unrecognized folder${unknowns.length > 1 ? 's' : ''} found</div>
    <p>Not in the documented folder list — may have been added by a newer Claude Code version.
       Do not delete without research. Update <code>FOLDER_METADATA</code> in scripts/scan.js to clear this warning.</p>
    <ul class="unknown-list">
      ${unknowns.map(f => `<li><code>${escapeHtml(f.name)}</code> &mdash; ${escapeHtml(f.path)}</li>`).join('\n      ')}
    </ul>
  </div>`;

  const cards = folders.map(folder => {
    const colors  = IMPORTANCE_COLORS_HTML[folder.importance] || IMPORTANCE_COLORS_HTML.UNKNOWN;
    const barPct  = ((folder.size / maxSize) * 100).toFixed(1);
    return `
    <div class="card" style="border-left-color:${colors.border}">
      <div class="card-header">
        <span class="folder-name">${escapeHtml(folder.name)}</span>
        <span class="badge" style="background:${colors.badge}">${escapeHtml(folder.importance)}</span>
        ${folder.docsUrl ? `<a class="docs-link" href="${escapeHtml(folder.docsUrl)}" target="_blank" rel="noopener">Docs →</a>` : ''}
      </div>
      <div class="card-path"><a href="#" onclick="openFolder(this.dataset.path);return false;" data-path="${escapeHtml(folder.path)}" title="Open in Finder">${escapeHtml(folder.path)}</a></div>
      <div class="card-size-row">
        <span class="card-size">${escapeHtml(folder.sizeFormatted)}</span>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${barPct}%;background:${colors.bar}"></div>
        </div>
      </div>
      <p class="card-description">${escapeHtml(folder.description)}</p>
      <div class="card-freeable">
        <span class="freeable-label">Freeable: </span>
        <span class="freeable-value">${escapeHtml(folder.spaceFreeable)}</span>
      </div>
      <div class="pros-cons">
        <div class="pros">
          <h4>PRO DELETE</h4>
          <ul>${listItems(folder.proDelete)}</ul>
        </div>
        <div class="cons">
          <h4>CON DELETE</h4>
          <ul>${listItems(folder.conDelete)}</ul>
        </div>
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>~/.claude Folder Dashboard</title>
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
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .stat-value.freeable { color: #16a34a; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-left-width: 4px;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .folder-name {
      font-size: 1.1rem;
      font-weight: 700;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      color: #0f172a;
    }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      color: white;
      letter-spacing: 0.05em;
    }
    .card-path {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.75rem;
      color: #64748b;
      word-break: break-all;
    }
    .card-path a { color: #64748b; text-decoration: none; border-bottom: 1px dashed #94a3b8; }
    .card-path a:hover { color: #3b82f6; border-bottom-color: #3b82f6; }
    .docs-link { font-size: 0.7rem; color: #3b82f6; text-decoration: none; white-space: nowrap; opacity: 0.7; }
    .docs-link:hover { opacity: 1; text-decoration: underline; }
    .card-size-row { display: flex; align-items: center; gap: 1rem; }
    .card-size { font-size: 1.25rem; font-weight: 700; white-space: nowrap; }
    .progress-wrap { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-bar { height: 100%; border-radius: 3px; }
    .card-description { font-size: 0.875rem; color: #334155; }
    .card-freeable { font-size: 0.8rem; }
    .freeable-label { color: #64748b; font-weight: 500; }
    .freeable-value { color: #16a34a; font-weight: 600; }
    .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.8rem; }
    .pros h4 { color: #16a34a; margin-bottom: 0.25rem; font-size: 0.7rem; letter-spacing: 0.05em; }
    .cons h4 { color: #dc2626; margin-bottom: 0.25rem; font-size: 0.7rem; letter-spacing: 0.05em; }
    .pros ul, .cons ul { list-style: none; }
    .pros li::before { content: '✓  '; color: #16a34a; }
    .cons li::before { content: '✗  '; color: #dc2626; }
    .legend {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
      color: #334155;
    }
    .legend-label { color: #64748b; font-weight: 500; white-space: nowrap; }
    .legend-item {
      border-left: 3px solid;
      padding-left: 0.5rem;
      white-space: nowrap;
    }
    footer { text-align: center; margin-top: 2.5rem; color: #94a3b8; font-size: 0.8rem; }
    .unknown-alert {
      background: #fffbeb;
      border: 1px solid #f59e0b;
      border-left: 4px solid #f59e0b;
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }
    .unknown-alert-title { font-weight: 700; color: #92400e; margin-bottom: 0.5rem; font-size: 1rem; }
    .unknown-alert p { font-size: 0.875rem; color: #78350f; margin-bottom: 0.5rem; }
    .unknown-list { font-size: 0.85rem; color: #92400e; padding-left: 1.25rem; }
    .unknown-list li { margin-top: 0.25rem; }
  </style>
</head>
<body>
  <header>
    <h1>~/.claude Folder Dashboard</h1>
    <p class="subtitle">${escapeHtml(now)}</p>
  </header>

  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Size</div>
      <div class="stat-value">${escapeHtml(formatSize(totalSize))}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Folders Found</div>
      <div class="stat-value">${folders.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Est. Freeable</div>
      <div class="stat-value freeable">~${escapeHtml(formatSize(freeableSize))}</div>
    </div>
  </div>

  ${unknownBanner}

  <div class="legend">
    <span class="legend-label">Importance:</span>
    <span class="legend-item" style="border-color:#ef4444"><strong>CRITICAL</strong> — do not delete</span>
    <span class="legend-item" style="border-color:#f59e0b"><strong>HIGH</strong> — think before deleting</span>
    <span class="legend-item" style="border-color:#06b6d4"><strong>MEDIUM</strong> — review old entries</span>
    <span class="legend-item" style="border-color:#9ca3af"><strong>LOW</strong> — safe to delete</span>
  </div>

  <main class="grid">
    ${cards}
  </main>

  <footer>Generated by <strong>claude-manager</strong> &mdash; ${escapeHtml(now)}</footer>

  <script>
    function openFolder(p) {
      fetch('/open?path=' + encodeURIComponent(p)).catch(function() {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(p).then(function() { toast('Path copied to clipboard'); });
        }
      });
    }
    function toast(msg) {
      var el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:.5rem 1.25rem;border-radius:6px;font-size:.8rem;z-index:999;pointer-events:none;';
      document.body.appendChild(el);
      setTimeout(function() { el.remove(); }, 2500);
    }
  </script>
</body>
</html>`;
}

// ─── Local server (makes folder-open links work in all browsers) ──────────────

function serveHTML(html, claudeDir) {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/open?')) {
      const urlObj = new URL(req.url, 'http://localhost');
      const folderPath = urlObj.searchParams.get('path');
      if (folderPath && folderPath.startsWith(claudeDir)) {
        const openCmd = os.platform() === 'darwin' ? 'open' : 'xdg-open';
        spawnSync(openCmd, [folderPath]);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
      } else {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('forbidden');
      }
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    const url  = 'http://localhost:' + port;
    console.log('  Dashboard running at ' + url);
    console.log('  Press Ctrl+C to stop.\n');
    const openCmd = os.platform() === 'darwin' ? 'open' : 'xdg-open';
    spawnSync(openCmd, [url]);
  });

  // Auto-exit after 10 minutes
  setTimeout(() => {
    console.log('\n  Server stopped after 10 minutes.');
    process.exit(0);
  }, 10 * 60 * 1000);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs();
  useColor = process.stdout.isTTY && !opts.noColor;

  const claudeDir = getClaudeDir();
  const folders   = scanFolders(claudeDir);

  const totalSize    = folders.reduce((s, f) => s + f.size, 0);
  const freeableSize = folders.reduce((s, f) => s + f.size * f.freeablePct, 0);
  const unknowns     = folders.filter(f => f.importance === 'UNKNOWN');

  if (opts.showTerminal) {
    renderTerminal(folders, { totalSize, freeableSize, htmlMode: opts.showHtml, unknowns });
  }

  if (opts.showHtml) {
    const html = renderHTML(folders, { totalSize, freeableSize, unknowns });
    if (opts.showTerminal) {
      // --html: serve via local server so folder links work in all browsers
      serveHTML(html, claudeDir);
    } else {
      // --html-only: write static file (folder links fall back to clipboard copy)
      try {
        fs.writeFileSync(opts.htmlPath, html, 'utf-8');
        console.log('HTML report saved to: ' + opts.htmlPath);
        const openCmd = os.platform() === 'darwin' ? 'open' : 'xdg-open';
        spawnSync(openCmd, [opts.htmlPath], { detached: true, stdio: 'ignore' });
      } catch (e) {
        console.error('Error writing HTML file: ' + e.message);
        process.exit(1);
      }
    }
  }
}

main();
