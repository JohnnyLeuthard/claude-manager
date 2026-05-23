# Scripts Guide

How to run the tools in `scripts/` to scan, audit, and clean your `~/.claude` folder.

---

## Prerequisites

- **Node.js** — v16 or later. Check with `node --version`.
- **No install needed** — zero npm dependencies. Clone the repo and run directly.

```bash
git clone https://github.com/JohnnyLeuthard/claude-manager.git
cd claude-manager
```

---

## `scan.js` — Folder Dashboard

Shows every folder in `~/.claude` with its size, importance level, description, how much space is freeable, and the pros/cons of deleting it.

### Basic usage

```bash
node scripts/scan.js
```

Prints a color-coded terminal report. Unknown folders (not in the documented list) are flagged with a warning at the top.

### Flags

| Flag | What it does |
|------|-------------|
| *(no flags)* | Terminal output only |
| `--html` | Terminal output + opens live HTML dashboard in your browser |
| `--html-only` | Saves HTML to `reports/claude-dashboard.html` and opens it (no terminal output) |
| `--no-color` | Plain text output, no ANSI colors (useful for piping or logging) |

### Examples

```bash
# Quick terminal summary
node scripts/scan.js

# Full visual dashboard in browser (folder paths are clickable)
node scripts/scan.js --html

# Save HTML report without terminal noise
node scripts/scan.js --html-only

# Pipe output to a file
node scripts/scan.js --no-color > scan-report.txt
```

### How the HTML dashboard works

`--html` starts a local server (random port) and opens the dashboard in your default browser. The server runs for 10 minutes then shuts itself down. Folder path links on each card call the server to open that folder in Finder/Explorer — this is why a live server is needed instead of a static file.

`--html-only` writes a static `reports/claude-dashboard.html` instead. Folder path links copy the path to your clipboard in this mode (since there's no server to handle the open request).

### Reading the output

Each folder shows:

- **Importance badge** — how critical the folder is (see scale below)
- **Size** — actual disk usage
- **Freeable** — estimated space recoverable by deleting old/stale entries
- **Pro delete / Con delete** — what you gain and what you lose
- **Docs →** — link to the relevant official Claude Code documentation (where available)

**Importance scale:**

| Level | Meaning |
|-------|---------|
| `CRITICAL` | Do not delete — losing this breaks Claude Code or causes permanent data loss |
| `HIGH` | Think before deleting — actively used, deletion has noticeable consequences |
| `MEDIUM` | Review before deleting — safe to prune old entries, recent data may still be useful |
| `LOW` | Safe to delete — auto-regenerated on next run or no longer needed |
| `UNKNOWN` | Unrecognized folder — not in the documented list, may be from a newer Claude Code version |

---

## `clean.js` — Safe Cleanup *(coming in Phase 2)*

> **Not yet built.** The design is finalized — this section documents how it will work.

`clean.js` removes stale data from `~/.claude`. It is **dry-run by default** — running it without flags always previews what would be deleted and does nothing. You must pass `--execute` to perform actual deletion.

This is intentional: destructive action requires an explicit choice, not an accidental omission.

### Planned usage

```bash
# Preview what would be cleaned (safe — nothing is deleted)
node scripts/clean.js

# Actually delete (requires explicit flag)
node scripts/clean.js --execute

# Preview only plans older than 30 days
node scripts/clean.js --only-plans --older-than-days 30

# Delete shell-snapshots, keeping the 5 most recent
node scripts/clean.js --only-shell-snapshots --keep-count 5 --execute
```

### Planned flags

| Flag | What it does |
|------|-------------|
| *(no flags)* | Dry-run — preview only, nothing deleted |
| `--execute` | Perform actual deletion |
| `--only-<category>` | Limit to one folder type (e.g. `--only-plans`, `--only-shell-snapshots`) |
| `--older-than-days <N>` | Only target files older than N days |
| `--keep-count <N>` | Keep only the N most recent items, delete the rest |

---

## `audit.js` — Security Check *(coming in Phase 2)*

> **Not yet built.** The design is finalized — this section documents how it will work.

`audit.js` scans `~/.claude` for security risks: API keys or secrets in shell snapshots, sensitive environment variables, unusual MCP service entries.

It is read-only — it never deletes anything. It produces a report of findings with severity levels and recommended actions.

### Planned usage

```bash
# Run a full security audit (read-only, always safe)
node scripts/audit.js

# Save report to file
node scripts/audit.js --no-color > audit-report.txt
```

---

## Common Scenarios

### "I want to see what's taking up space"

```bash
node scripts/scan.js --html
```

Sort by size in the dashboard. The `projects/` folder is almost always the largest — it holds conversation transcripts for every project you've used Claude Code in.

### "I want to free up space safely"

1. Run `node scripts/scan.js` to see what's freeable
2. Focus on `LOW` importance folders first — they're safe to delete at any time
3. For `MEDIUM` folders (like `plans/` or `file-history/`), delete old entries only
4. When `clean.js` is available: `node scripts/clean.js --only-shell-snapshots --execute`

### "I'm concerned about privacy"

1. Run `node scripts/scan.js` and look at `shell-snapshots/` — this folder can contain your full shell environment including any secrets that were in env vars
2. `projects/` contains full conversation transcripts — review before sharing or backing up your machine
3. When `audit.js` is available it will scan for credential patterns automatically

### "I see an UNKNOWN folder warning"

A folder appeared in `~/.claude` that isn't in the documented list. This usually means Claude Code added it in a recent update.

1. Do not delete it without researching what it is first
2. Open the folder in Finder/Explorer and look at its contents
3. Check the [Claude Code changelog](https://code.claude.com/docs/en/changelog) for recent additions
4. Once you know what it is, add it to `FOLDER_METADATA` in `scripts/scan.js` to clear the warning

### "I want to pipe output somewhere"

```bash
# Plain text to a file
node scripts/scan.js --no-color > ~/Desktop/claude-scan.txt

# Plain text to stdout for another tool
node scripts/scan.js --no-color | grep "CRITICAL"
```

---

## Output Locations

| Output | Location | Git tracked? |
|--------|----------|-------------|
| Terminal output | stdout | No |
| HTML dashboard | `reports/claude-dashboard.html` | No (gitignored) |
| Audit report *(planned)* | `reports/audit-<date>.html` | No (gitignored) |
| Deletion log *(planned)* | `reports/clean-<date>.log` | No (gitignored) |

The `reports/` folder is gitignored — generated output never gets committed. It is safe to delete the entire `reports/` folder at any time; scripts will recreate it on the next run.
