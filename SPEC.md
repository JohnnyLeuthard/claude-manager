# claude-manager — Technical Specification

A complete description of what was built, every decision made, and enough detail to recreate the project from scratch.

---

## Project Purpose

`claude-manager` is a standalone Node.js tool that scans `~/.claude` — the system folder where Claude Code (Anthropic's CLI) stores conversations, plans, config backups, file-edit histories, shell snapshots, and session data — and generates a visual dashboard showing folder sizes, importance levels, cleanup recommendations, and which Claude surfaces use each folder.

No external dependencies. No build step. Just `node scripts/scan.js`.

---

## Repository Structure

```
claude-manager/
├── README.md                  ← Authoritative reference for ~/.claude (prose docs for each folder)
├── SPEC.md                    ← This file — technical spec for recreating the project
├── TASKS.md                   ← Living roadmap; check off tasks as completed
├── CLAUDE.md                  ← Project identity and rules for Claude Code (AI assistant context)
├── CONTEXT.md                 ← Task routing guide (which file to edit for which concern)
├── CONTRIBUTING.md            ← How to contribute
├── LICENSE                    ← MIT
├── .gitignore                 ← Ignores reports/, .claude/, *.jsonl, backups/, projects/, etc.
├── scripts/
│   └── scan.js                ← The main script — scanner + terminal renderer + HTML renderer + server
├── examples/
│   └── example-dashboard.html ← Static sanitized demo (no real user data; committed to git)
├── assets/
│   ├── claude-manager-infographic.html  ← Infographic source HTML
│   └── images/
│       ├── ClaudeManagerExplainer.gif   ← Animated demo (shown in README)
│       └── claude-manager-infographic.png
└── reports/                   ← Gitignored; generated HTML/JSON output written here at runtime
    └── .gitkeep
```

---

## scripts/scan.js — Full Architecture

Single-file script (~927 lines). No npm packages. Node built-ins only: `fs`, `path`, `os`, `http`, `child_process`.

### CLI Flags

| Flag | Behavior |
|------|----------|
| _(no flags)_ | Terminal output only, with ANSI color if TTY |
| `--html` | Terminal output + open HTML dashboard in browser via local server |
| `--html-only` | Write static HTML to `reports/claude-dashboard.html` and open it; no server |
| `--no-color` | Disable ANSI color in terminal output |

`--html-only` disables folder-open links (they call a server endpoint; no server in this mode — falls back to clipboard copy).

### Execution Flow (`main()`)

1. Parse args
2. `getClaudeDir()` → `~/.claude`
3. `scanFolders(claudeDir)` → array of folder objects
4. Compute `totalSize`, `freeableSize`, `unknowns`
5. If `showTerminal`: `renderTerminal()`
6. If `showHtml` and `showTerminal`: `serveHTML(html, claudeDir)` (server mode)
7. If `showHtml` and not `showTerminal` (`--html-only`): write file and open it

### `scanFolders(claudeDir)`

- Reads all directories in `claudeDir` with `fs.readdirSync(..., { withFileTypes: true }).filter(isDirectory)`
- For each folder: calls `getFolderSize()`, looks up `FOLDER_METADATA[name]` (falls back to `UNKNOWN` metadata if not found)
- Returns array sorted by `IMPORTANCE_ORDER` then by size descending
- Each folder object: `{ name, bareName, path, size, sizeFormatted, importance, description, spaceFreeable, freeablePct, proDelete, conDelete, docsUrl, usedBy, contextNote }`

### `getFolderSize(folderPath)`

- macOS: tries `du -sk` (returns 512-byte blocks → multiply by 1024 for bytes)
- Linux: tries `du -sb` (returns bytes directly)
- Falls back to `recursiveSize()` (pure JS recursive stat walk) if `du` fails

### `FOLDER_METADATA` — Schema

Every entry has exactly 9 fields:

```javascript
{
  importance:    'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  description:   String,        // one sentence; shown on card
  spaceFreeable: String,        // human-readable estimate (e.g. 'All (100%)', 'None recommended')
  freeablePct:   Number,        // 0.0–1.0; used to compute freeableSize total
  proDelete:     String,        // comma-separated pros (split on `, ` for <ul> rendering)
  conDelete:     String,        // comma-separated cons
  docsUrl:       String | null, // Anthropic docs URL; null = no link shown
  usedBy:        Array<String>, // surfaces that write or read this folder
  contextNote:   String | null, // optional callout note rendered as an info box on the card
}
```

### `FOLDER_METADATA` — All 15 Entries

| Folder | importance | freeablePct | usedBy | contextNote? |
|--------|-----------|-------------|--------|--------------|
| `backups` | CRITICAL | 0.0 | `['Claude Code']` | Yes — MCP config lives in settings.json backed up here |
| `cache` | LOW | 1.0 | `['Claude Code']` | null |
| `debug` | LOW | 1.0 | `['Claude Code']` | null |
| `downloads` | LOW | 1.0 | `['Claude Code']` | null |
| `file-history` | MEDIUM | 0.7 | `['Claude Code', 'IDE extension']` | null |
| `ide` | LOW | 1.0 | `['IDE extension']` | null |
| `plans` | MEDIUM | 0.7 | `['Claude Code', 'Plan mode']` | null |
| `plugins` | HIGH | 0.5 | `['Claude Code', 'IDE extension']` | null |
| `projects` | CRITICAL | 0.7 | `['Claude Code', 'IDE extension', 'claude.ai', 'Coworker']` | Yes — cloud sync note |
| `session-env` | LOW | 1.0 | `['Claude Code']` | null |
| `sessions` | LOW | 1.0 | `['Claude Code', 'IDE extension']` | null |
| `shell-snapshots` | LOW | 1.0 | `['Claude Code']` | null |
| `skills` | HIGH | 0.0 | `['Claude Code', 'IDE extension']` | null |
| `telemetry` | LOW | 1.0 | `['Claude Code']` | null |
| `todos` | HIGH | 0.5 | `['Claude Code', 'IDE extension']` | null |

**`usedBy` tag color rules** (used in HTML rendering):
- `'Claude Code'`, `'Plan mode'` → gray (`.used-by-tag`, no modifier)
- `'IDE extension'` → blue-tinted (`.tag-ide`)
- `'claude.ai'`, `'Coworker'` → purple-tinted (`.tag-cloud`)

Note: `~/.claude` is written only by Claude Code (CLI) and IDE extensions. `claude.ai` and `Coworker` are tagged as read/sync surfaces (they may read conversation history from `projects/`), not as local writers.

### `IMPORTANCE_ORDER`

```javascript
{ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 }
```

### `IMPORTANCE_COLORS_HTML`

Maps each level to `{ border, badge, bar }` hex colors:

| Level | border | badge | bar |
|-------|--------|-------|-----|
| CRITICAL | `#ef4444` | `#dc2626` | `#ef4444` |
| HIGH | `#f59e0b` | `#d97706` | `#f59e0b` |
| MEDIUM | `#06b6d4` | `#0891b2` | `#06b6d4` |
| LOW | `#9ca3af` | `#6b7280` | `#9ca3af` |
| UNKNOWN | `#d1d5db` | `#6b7280` | `#d1d5db` |

---

## HTML Dashboard — Components

Generated by `renderHTML(folders, { totalSize, freeableSize, unknowns })`. Returns a complete `<!DOCTYPE html>` string — self-contained (no external CSS/JS, no CDN).

### Layout (top to bottom)

1. `<header>` — title `~/.claude Folder Dashboard` + date
2. `.summary` — stats bar: Total Size / Folders Found / Est. Freeable + **↺ Refresh** button
3. `.unknown-alert` — amber banner (only rendered if `unknowns.length > 0`)
4. `.legend` — importance color key (CRITICAL/HIGH/MEDIUM/LOW)
5. `<main class="grid">` — folder cards
6. `<section class="folder-ref">` — Known Folder Reference chips
7. `<footer>` — "Generated by claude-manager — {date}"

### Summary Bar

```html
<div class="summary">
  <div class="stat"><div class="stat-label">Total Size</div><div class="stat-value">{size}</div></div>
  <div class="stat"><div class="stat-label">Folders Found</div><div class="stat-value">{n}</div></div>
  <div class="stat"><div class="stat-label">Est. Freeable</div><div class="stat-value freeable">~{size}</div></div>
  <button class="refresh-btn" id="refresh-btn" onclick="rescan()">↺ Refresh</button>
</div>
```

Refresh button calls `rescan()` JS function → `fetch('/rescan')` → on success `window.location.reload()`.

### Unknown Folder Banner (`.unknown-alert`)

Rendered when `unknowns.length > 0`. Each unknown folder gets a list item with:
- `<code>folder/</code>` name
- `&mdash;` + full path
- `<a class="unknown-open-link">Open Folder →</a>` that calls `openFolder(path)` → `fetch('/open?path=...')`

### Folder Cards (`.card`)

Each card:

```
border-left: 4px solid {importance color}

[folder-name]  [IMPORTANCE badge]  [Docs →]  [Search Google →]
{/full/path/to/folder}             (clickable → opens in Finder)

{size} [======progress bar=====]

{description text}

Used by: [Claude Code] [IDE extension] [claude.ai] [Coworker]
ℹ {contextNote}   (only if contextNote is not null)

Freeable: {spaceFreeable}

PRO DELETE        CON DELETE
✓ {pro}           ✗ {con}
```

Card elements in order:
1. `.card-header` — folder name + importance badge + `.card-links` (Docs → and Search Google →)
2. `.card-path` — full path as clickable link (calls `openFolder()`)
3. `.card-size-row` — size text + progress bar (width = `folder.size / maxSize * 100`)
4. `.card-description` — description text
5. `.card-used-by` — "Used by:" label + tag chips
6. `.card-note` — context note info box (conditional)
7. `.card-freeable` — freeable label + value
8. `.pros-cons` — 2-column grid: PRO DELETE / CON DELETE

**Search Google URL:** `https://www.google.com/search?q=` + `encodeURIComponent('~/.claude/{name} claude code')`

### Known Folder Reference Section (`.folder-ref`)

At the bottom of the page, above the footer. Lists all 15 known folders as chips sorted alphabetically.

```javascript
const presentNames = new Set(folders.map(f => f.bareName));
const allKnown = Object.keys(FOLDER_METADATA).sort().map(name => ({
  name,
  present: presentNames.has(name),
  docsUrl: FOLDER_METADATA[name].docsUrl,
  importance: FOLDER_METADATA[name].importance,
}));
```

Each chip:
```html
<span class="chip chip-present|chip-absent" style="border-left-color:{importance color}">
  <span class="chip-status">✓|✗</span>
  <span class="chip-name">{name}/</span>
  <a class="chip-docs" href="{docsUrl}" ...>Docs →</a>  <!-- only if docsUrl not null -->
</span>
```

**Absent chip styling**: NO `opacity` (opacity cascades to children including `.chip-docs`). Instead:
- `.chip-absent .chip-status { color: #cbd5e1 }`
- `.chip-absent .chip-name { color: #94a3b8 }`
- `.chip-docs` is unaffected — stays full blue on absent chips

**Status note** (below chip grid) — one of four states:
1. All present → `.status-ok` — "✓ All known folders are present"
2. Any CRITICAL/HIGH absent → `.status-warn` — "⚠ N missing folder(s) (name/) are CRITICAL or HIGH…"
3. Only MEDIUM absent → `.status-info` — "N missing MEDIUM importance — likely normal…"
4. Only LOW absent → `.status-ok` — "✓ N folder(s) absent (names) — all LOW importance…"

### JavaScript (inline, no framework)

Three functions at bottom of `<body>`:

**`openFolder(p)`** — `fetch('/open?path=' + encodeURIComponent(p))`. On catch (static file / no server): copies path to clipboard via `navigator.clipboard.writeText()`.

**`rescan()`** — disables button, sets text to "Scanning…", `fetch('/rescan')`, parses JSON `{ ok: true|false }`. On success: `window.location.reload()`. On failure: `toast(msg)`, re-enables button.

**`toast(msg)`** — creates a fixed-position bottom-center div, appends to body, removes after 2500 ms.

---

## Local Server (`serveHTML`)

```javascript
function serveHTML(initialHtml, claudeDir) {
  let currentHtml = initialHtml;
  const server = http.createServer((req, res) => { ... });
  server.listen(0, '127.0.0.1', () => {
    // picks random available port
    // opens browser with spawnSync('open', [url]) on macOS
    // auto-exits after 10 minutes
  });
}
```

### Endpoints

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/` | Serve `currentHtml` as `text/html` |
| GET | `/open?path={encoded}` | Open folder in Finder (macOS: `open`, Linux: `xdg-open`). Only allows paths that start with `claudeDir` — any other path returns 403. |
| GET | `/rescan` | Re-runs `scanFolders()`, recomputes stats, regenerates `currentHtml`. Returns `{ ok: true }` or `{ ok: false, error: "..." }` as JSON. |
| anything else | | 404 |

The server binds to `127.0.0.1` only (not `0.0.0.0`). Port is `0` — OS picks a free port.

---

## CSS Class Inventory

All CSS is inlined in the `<style>` block inside `renderHTML()`.

### Layout & Structure

| Class | Purpose |
|-------|---------|
| `.summary` | Flex row: stats + refresh button |
| `.stat` | One stat (label + value) |
| `.stat-value.freeable` | Green color for freeable number |
| `.grid` | CSS grid: `repeat(auto-fill, minmax(340px, 1fr))` |
| `.legend` | Flex row of importance color swatches |

### Cards

| Class | Purpose |
|-------|---------|
| `.card` | White box, left border 4px colored, flex column, gap 0.75rem |
| `.card-header` | Space-between row: name, badge, links |
| `.folder-name` | Monospace, 1.1rem, bold |
| `.badge` | Pill with importance color background, white text |
| `.card-links` | Flex row of links (Docs →, Search Google →) |
| `.docs-link` | Small blue link, opacity 0.7, hover 1.0 |
| `.search-link` | Same as docs-link but purple |
| `.card-path` | Monospace path text; anchor is dashed-underline, hover turns blue |
| `.card-size-row` | Flex: size text + progress bar |
| `.progress-wrap` | Gray track; `.progress-bar` fills with importance color |
| `.card-description` | 0.875rem, dark gray text |
| `.card-used-by` | Flex row with "Used by:" label and tag chips |
| `.used-by-label` | Gray, medium weight |
| `.used-by-tags` | Flex row, wraps |
| `.used-by-tag` | Gray pill: `#f1f5f9` bg, `#475569` text, border `#e2e8f0` |
| `.tag-ide` | Blue tint: `#eff6ff` bg, `#1d4ed8` text, `#bfdbfe` border |
| `.tag-cloud` | Purple tint: `#faf5ff` bg, `#7c3aed` text, `#e9d5ff` border |
| `.card-note` | Info callout: `#f0f9ff` bg, `#0369a1` text, `#bae6fd` border, rounded |
| `.card-freeable` | Small row: "Freeable:" label + green value |
| `.pros-cons` | 2-column grid |
| `.pros h4` | Green small-caps "PRO DELETE" label |
| `.cons h4` | Red small-caps "CON DELETE" label |
| `.pros li::before` | `✓  ` in green |
| `.cons li::before` | `✗  ` in red |

### Unknown Alert

| Class | Purpose |
|-------|---------|
| `.unknown-alert` | Amber-bordered box: `#fffbeb` bg, `#f59e0b` border (4px left) |
| `.unknown-alert-title` | Dark amber bold title |
| `.unknown-list` | List of unknown folders |
| `.unknown-open-link` | Small amber dashed-underline link in the list |

### Refresh Button

| Class | Purpose |
|-------|---------|
| `.refresh-btn` | Blue button, pushed right via `margin-left:auto`, disabled state at 0.6 opacity |

### Known Folder Reference

| Class | Purpose |
|-------|---------|
| `.folder-ref` | White box, same style as `.summary` |
| `.folder-ref-title` | Small-caps gray section label |
| `.folder-ref-desc` | Explanatory paragraph |
| `.folder-ref-chips` | Flex wrap row of chips |
| `.chip` | Inline-flex: left border (importance color), top/right/bottom from `#e2e8f0` |
| `.chip-present .chip-status` | `#16a34a` (green ✓) |
| `.chip-absent` | Dashed left border, `#f1f5f9` bg |
| `.chip-absent .chip-status` | `#cbd5e1` (light gray ✗) |
| `.chip-absent .chip-name` | `#94a3b8` (dimmed name) |
| `.chip-name` | `#334155` monospace |
| `.chip-docs` | Tiny blue pill: `#eff6ff` bg, `#3b82f6` text, `#bfdbfe` border — "Docs →" |
| `.folder-ref-status` | Inline status note below chips |
| `.status-ok` | Green tint |
| `.status-warn` | Orange tint |
| `.status-info` | Blue tint |

---

## `examples/example-dashboard.html`

A static, hand-authored HTML file committed to git. It demonstrates the dashboard with sanitized (fake) data — no real user paths, sizes, or conversation content.

**Purpose:** lets users see what the dashboard looks like without running the script. Linked from README.md via `htmlpreview.github.io`.

**README link:**
```markdown
<p align="center">
<a href="https://htmlpreview.github.io/?https://github.com/JohnnyLeuthard/claude-manager/blob/main/examples/example-dashboard.html"><strong>→ View example dashboard</strong></a>
</p>
```

### What the example contains

- All CSS from `renderHTML()` (must be kept in sync manually)
- 14 present folder cards (all known folders except `todos/`)
- 1 unknown folder card (`agents/`) — demonstrates unknown detection
- Amber unknown banner with `agents/` and a fake "Open Folder →" link
- `todos/` shown as absent (✗) in the Known Folder Reference chips
- Status note shows `.status-warn` because `todos/` is HIGH importance
- Refresh button is wired to a toast: "Run with `node scripts/scan.js --html` to enable the Refresh button"
- Folder path links call `openFolder()` which gracefully falls back to clipboard copy

### Key cards to verify in the example

| Card | Must show |
|------|-----------|
| `projects/` | 4 tags: Claude Code, IDE extension, claude.ai (purple), Coworker (purple) + cloud sync note |
| `backups/` | 1 tag: Claude Code + MCP settings.json context note |
| `ide/` | 1 tag: IDE extension (blue) only |
| `plans/` | 2 tags: Claude Code + Plan mode |
| `agents/` | UNKNOWN badge, no importance color in card |

---

## Git & GitHub

**Repo:** `github.com/JohnnyLeuthard/claude-manager`

**Branch:** `main` (single branch)

**Tags:**
- `stable-dashboard-v1` — rollback checkpoint created before the "Used by" tags feature was added. Points to the last commit before `usedBy` / `contextNote` fields were added.

**`.gitignore` key rules:**
- `reports/*` (but not `reports/.gitkeep`) — generated HTML output never committed
- `.claude/` — Claude Code project settings (contain local paths)
- `*.jsonl`, `*.claude.json` — real user data, never committed
- `backups/`, `projects/`, `session-env/`, `sessions/`, `shell-snapshots/`, `telemetry/`, `file-history/`, `plans-data/` — real `~/.claude` subfolders that might be accidentally copied here

**`examples/`** is NOT ignored — it's the sanitized demo, intentionally tracked.

---

## Terminal Renderer

`renderTerminal()` uses ANSI escape codes (only when stdout is a TTY and `--no-color` is not set). Structure:

```
══════════════════════════════════════════════════════════════════════
  ~/.claude Folder Dashboard
  {day}, {date}
══════════════════════════════════════════════════════════════════════

  Total size: {n}   Folders: {n}   Est. freeable: ~{n}

  ⚠  N UNRECOGNIZED FOLDER(S) DETECTED
     {folder}/ — {path} — Not in the documented list...

  Importance: CRITICAL = do not delete   HIGH = think first   ...

─────────────────────────────────────────────────────────────────────

  {folder}/  IMPORTANCE
  {/full/path}
  Size: {n}   Freeable: {spaceFreeable}
  {description}
  Pro delete: {text}
  Con delete: {text}
...
```

`c(key, text)` — ANSI color wrap. `cb(key, text)` — bold + color wrap. Both no-op when color is off.

---

## Helper Functions

| Function | Purpose |
|----------|---------|
| `formatSize(bytes)` | Human-readable: B / KB / MB / GB |
| `recursiveSize(dirPath)` | Pure JS fallback for size measurement |
| `escapeHtml(s)` | Escapes `&`, `<`, `>`, `"` for HTML output |
| `listItems(str)` | Splits on `, ` and wraps each in `<li>` |
| `parseArgs()` | Reads `process.argv`; returns `{ showTerminal, showHtml, noColor, htmlPath }` |
| `getClaudeDir()` | Returns `path.join(os.homedir(), '.claude')` |

---

## Design Decisions

**Why a local HTTP server instead of `file://` links?**
Browser security policy blocks `file://` URLs opened from scripts. A local server on `127.0.0.1` with a random port sidesteps this cleanly and also enables the `/rescan` endpoint.

**Why no npm packages?**
Zero install friction. Users can clone and run `node scripts/scan.js` immediately. No `npm install`, no `package.json`, no version conflicts.

**Why `opacity` must NOT be used on `.chip-absent`?**
CSS `opacity` cascades to all descendants and cannot be overridden on children. If a parent has `opacity: 0.5`, even a child with `opacity: 1` still renders at 50%. To dim only the name and status, use explicit `color` overrides on the specific child selectors.

**Why does `usedBy` include `claude.ai` and `Coworker` for `projects/`?**
`~/.claude` is written locally by Claude Code CLI and IDE extensions only. However, `projects/` (conversation history) is the folder most likely to be read or synced by cloud surfaces. Tagging read-access surfaces gives users insight into what's actually relevant to their cloud usage without overstating local write activity.

**Why is `contextNote` a separate field from `description`?**
Description is always shown inline as a paragraph. `contextNote` is an explicit callout for information that doesn't fit the folder description pattern — things like "MCP config lives here" or "cloud surfaces can read this." Separating them keeps descriptions clean and callouts visually distinct.

**Why dry-run by default for `clean.js` (planned)?**
Destructive action should be intentional, not accidental. Running the cleanup script with no flags previews what would change. `--execute` is required to actually delete. This prevents data loss from "I just wanted to see what it would do."

---

## What Is NOT Built Yet

Per `TASKS.md` Phase 2 and 3:

- `scripts/clean.js` — dry-run-by-default cleanup with `--execute`, `--only-<category>`, `--older-than-days`
- `scripts/audit.js` — security scan (API keys in shell-snapshots, secrets in session-env)
- Unknown folder AI-assisted workflow (Part 2) — auto-generate metadata for unrecognized folders
- Projects folder deep dive — per-project size, session count, last-active date
- Interactive HTML frontend — tabs, cleanup UI, scan history

---

## Running the Script

```bash
# Terminal dashboard
node scripts/scan.js

# Terminal + HTML dashboard (server mode, folder-open links work)
node scripts/scan.js --html

# Static HTML file only (no server; folder links fall back to clipboard)
node scripts/scan.js --html-only

# Terminal only, no color (for piping/logging)
node scripts/scan.js --no-color
```

Requires Node.js 14+ (uses optional chaining-free code, `URL` class, `http.createServer`).
