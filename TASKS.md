# Claude Manager — Task Roadmap

Living checklist of work completed, in progress, and planned for the `claude-manager/` project.

**Last updated:** May 23, 2026 (repo live)

---

## Phase 0: Public Release ✅ COMPLETE

The goal of Phase 0 was to prepare `claude-manager` for public sharing.

### Content Cleanup for Public Use

- [x] Rewrite README.md to be generic/public-friendly
  - [x] Remove all personal scan data (sizes, dates, specific file names)
  - [x] Replace real project paths with generic examples
  - [x] Generalize MCP service references
  - [x] Add "Quick Start" section for new users
  - [x] Reframe as guide for ANY Claude Code user, not just one person
- [x] Update CLAUDE.md to remove MWP references
  - [x] Make clear this is standalone (no dependencies)
  - [x] Explain project purpose and principles
  - [x] Remove references to root workspace
- [x] Update CONTEXT.md for standalone use
  - [x] Remove root workspace references
  - [x] Reframe as task routing within this project
  - [x] Make standalone references work
- [x] Create LICENSE (MIT)
  - [x] Permissive license — anyone can use, modify, share
- [x] Create CONTRIBUTING.md
  - [x] How to report issues
  - [x] How to suggest improvements
  - [x] How to contribute code (future phases)
- [x] Update TASKS.md to document this phase
  - [x] Add Phase 0 to roadmap
  - [x] Document what was done and why

### Repo Preparation

- [x] Move workspace from `my-workflows-private/claude-manager/` to `/my-workflows/claude-manager/`
- [x] Initialize as standalone git repo with own GitHub remote
- [x] Create GitHub repo: `github.com/JohnnyLeuthard/claude-manager`
- [x] Push to public GitHub
- [x] Add to `my-workflows-public/README.md` as showcase item (link to public repo)

---

## Phase 1: Foundation & Map ✅ COMPLETE

The goal of Phase 1 was to create the workspace infrastructure and the authoritative reference for `~/.claude`.

### Workspace Setup

- [x] Create `claude-manager/` directory structure
- [x] Write `CLAUDE.md` — workspace identity and rules
- [x] Write `CONTEXT.md` — task routing within the workspace
- [x] Create `scripts/` placeholder folder
- [x] Create `TASKS.md` — this file, for tracking progress

### Root Workspace Registration

- [x] Update root `CLAUDE.md` — add `claude-manager/` to workspace structure tree
- [x] Update root `CLAUDE.md` — add routing row for `claude-manager/`
- [x] Update root `CONTEXT.md` — add cross-workspace routing entry
- [x] Update root `README.md` — add `claude-manager/` to "What's Here" table

### The ~/.claude Reference Map

- [x] Live scan of `~/.claude` folder (32 MB, 9 projects, 15+ folders)
- [x] Write comprehensive `README.md` documenting every folder:
  - [x] All 15+ folders with purpose, contents, safety level
  - [x] All top-level files (.DS_Store, settings.json, history.jsonl, etc.)
  - [x] Security notes for each item (tokens, personal data, service identifiers)
  - [x] Growth/accumulation patterns (grows indefinitely vs. auto-cleaned vs. session-temp)
  - [x] Cleanup recommendations (immediate, short-term, medium-term, long-term)
  - [x] FAQ section
  - [x] Future phases reference

---

## Phase 2: Cleanup Scripts (TBD)

The goal of Phase 2 is to build automated tools to scan, classify, and safely clean `~/.claude`.

### Scanning & Classification

- [x] `scripts/scan.js` — folder dashboard: real disk sizes, importance level, freeable estimate, pros/cons of deleting
  - [x] Terminal output with ANSI color coding (CRITICAL/HIGH/MEDIUM/LOW)
  - [x] HTML report saved to `reports/claude-dashboard.html` (gitignored)
  - [x] Sorted by importance then size; handles unknown folders gracefully
  - [x] `--html`, `--html-only`, `--no-color` flags; auto-detects TTY for piped output
  - [x] HTML report: make folder path a clickable `file://` link that opens the folder in Finder/Explorer
  - [x] HTML report: add "Docs →" link on each card to the most relevant official Anthropic docs page (null = no link shown)
  - [ ] 🟡 HTML report: add a Refresh button that re-runs the scan and reloads the page (requires server mode — call a `/rescan` endpoint)
  - [x] Unknown folder detection Part 1: when `scan.js` finds a folder not in `FOLDER_METADATA`, flag it prominently in both terminal (yellow warning block) and HTML (amber banner) output
  - [ ] 🔴 Unknown folder detection Part 2: AI-assisted update workflow — Claude evaluates the new folder, determines importance/description, finds vendor docs link, updates `FOLDER_METADATA`, `README.md`, and `TASKS.md` automatically
  - [ ] 🟡 Identify stale data (old conversations, broken symlinks, empty dirs) — planned for clean.js
  - [ ] 🟡 Flag security concerns (shell snapshots with env vars, old backups) — planned for audit.js

### Cleanup Execution

- [ ] 🔴 `scripts/clean.js` — safe cleanup with dry-run mode
  - [ ] 🟢 `--dry-run` flag to preview what would be deleted
  - [ ] 🟢 `--only-<category>` flag (e.g., `--only-plans`, `--only-shell-snapshots`)
  - [ ] 🟢 `--older-than-days <N>` for age-based cleanup
  - [ ] 🟢 `--keep-count <N>` to keep only the most recent N items
  - [ ] 🟢 Logging: what was deleted, why, timestamp
  - [ ] 🟡 Interactive mode: confirm before deleting (optional)

### Security Auditing

- [ ] 🔴 `scripts/audit.js` — check for security risks
  - [ ] 🟡 Scan `shell-snapshots/` for API keys or secrets
  - [ ] 🟡 Scan `session-env/` for leaked env vars
  - [ ] 🟢 Check `mcp-needs-auth-cache.json` for unusual external services
  - [ ] 🟡 Report: "these are OK, watch out for these, delete these for privacy"

### Documentation

- [ ] 🟢 `SCRIPTS.md` — user guide for running cleanup scripts
  - [ ] 🟢 How to use `--dry-run` safely
  - [ ] 🟢 Common cleanup scenarios with example commands
  - [ ] 🟢 What each script does and what it deletes

---

## Phase 3: Visual Interface (Future, Lower Priority)

The goal of Phase 3 is to build a user-friendly UI for browsing and managing `~/.claude`.

### Frontend Options (Design Phase Only)

- [ ] Decide on technology: VSCode Webview vs. React app vs. HTML report
  - Why: VSCode Webview would integrate directly with VS Code, React app would be standalone and shareable, HTML report would be simplest to generate

### Visualization

- [ ] Build tree view of `~/.claude` with color-coded safety levels
  - [ ] Red = review-first (conversations, backups)
  - [ ] Yellow = accumulates (plans, telemetry, file-history)
  - [ ] Green = safe-to-delete (broken symlinks, empty dirs, old caches)

### Interaction

- [ ] Click on any folder to see README.md details in a sidebar
- [ ] Inline "Mark for deletion" checkbox for easy selection
- [ ] "Preview what would be deleted" button to run `--dry-run`
- [ ] "Actually delete" button to execute cleanup
- [ ] Undo/rollback option (if backed up first)

### Distribution

- [ ] Package as standalone tool that others can use
- [ ] Share with other Claude Code users for their own `~/.claude` cleanup

---

## Notes

### Why Phase 1 First?
The map (README.md) is the foundation. Without it, any cleanup scripts are flying blind. Better to understand what's in `~/.claude` before automating deletion.

### Why Phase 2 Before Phase 3?
Scripts are more useful than UI. A user with a script can cleanup immediately. UI is nice-to-have but not blocking.

### Security-First Approach
Every file in `~/.claude` is documented for safety level. The scripts all support `--dry-run` before making actual changes. Cleanup is always opt-in.

### Extensibility
As new folders or files appear in `~/.claude` (new Claude Code features, new MCP services, etc.), update `README.md` with the new item. The checklist here helps track what's been audited and what needs review.

---

## Ideas / Maybe Later

Unconfirmed ideas — not committed to, not scoped. Parking lot for things worth thinking about. Grouped by theme.

---

### Interactive HTML Frontend

The current dashboard is read-only. A bigger vision is a full control-panel frontend — possibly as a single multi-tab HTML app served by the local Node server, or as separate purpose-built HTML files per concern.

- **Tab-based layout** — top nav with tabs: Dashboard · Projects · Security · Cleanup · Reports. If multi-tool support is added (see below), a tool-switcher nav above the tabs (Claude · Codex · Gemini · etc.) with each tool having its own tab set
- **Control panel tab (or first tab)** — buttons to trigger actions: Rescan, Rebuild HTML, Run Security Audit, Open Cleanup Mode. No manual CLI needed after initial launch
- **Separate HTML files vs. single app** — evaluate whether one multi-tab `dashboard.html` is cleaner than separate files (`security.html`, `cleanup.html`, etc.). Single file is simpler to serve; separate files are easier to scope and test independently
- **Refresh/rescan button** — re-run the scan and reload the page without restarting the server (calls `/rescan` endpoint)
- **Cleanup tab** — surface LOW/safe-to-delete folders with checkboxes, dry-run preview, and a confirm-to-delete button; powered by a `/delete?path=...` server endpoint
- **Scan history tab** — save each scan as a timestamped JSON in `reports/history/`; display a timeline showing how `~/.claude` has grown over time
- **AI-assisted unknown folder workflow** — when scan finds a folder not in `FOLDER_METADATA`, flag it and offer to invoke Claude via API to research it, write the description, assign importance, find vendor docs, and update `FOLDER_METADATA` + `README.md` automatically

---

### Full Claude Folder Audit (Scope Expansion)

Currently `scan.js` only looks at `~/.claude`. A broader audit would cover all Claude-related folders across the system.

- **System-wide Claude folder discovery** — scan beyond `~/.claude` to find all Claude-managed directories: workflow roots, workspace `CLAUDE.md` files, project-level `.claude/` folders, MCP config locations
- **Projects tab** — list every project folder inside `~/.claude/projects/` with metadata: last accessed date, size, number of sessions, whether a `CLAUDE.md` exists. Checkboxes to select projects for audit or deletion
- **Per-project audit** — click into any project to see its conversation sessions, memory files, file-history snapshots, and todos. Show what's stale vs. active
- **Cross-project summary** — total sessions, total size, oldest untouched project, top 5 largest projects

---

### Security & Vulnerability Report

A dedicated security audit tab (or standalone `security.html`) that actively scans for risks rather than just describing them. Applies to all tools if multi-tool support is added — one unified security scan across every AI tool's data folder.

- **Visual risk overview** — radar/spider chart showing risk level across categories: Credential Exposure · Plaintext Secrets · Stale Sensitive Data · Permissions · Privacy. Color-coded severity (green/yellow/red)
- **Credential scanner** — grep `shell-snapshots/`, `session-env/`, `projects/` for patterns matching API keys, tokens, passwords (regex patterns for common formats: `sk-`, `ghp_`, `AKIA`, `Bearer `, etc.)
- **`.env` file detection** — scan conversation transcripts for `.env` file contents pasted into chat; flag any session that appears to contain env var blocks
- **Plaintext secrets in conversations** — scan `.jsonl` conversation files for high-entropy strings, common secret patterns, and known credential prefixes
- **Checklist-style report** — each finding is a row with severity badge, file path, line snippet (truncated), and a recommended action (delete file / rotate credential / review)
- **Privacy exposure summary** — which projects contain the most sensitive-looking data; flag projects with no activity in 90+ days that still hold sensitive content
- **Warning banners** — prominent alerts for critical findings (e.g., "Found possible AWS key in shell-snapshots/2025-03-14.json")
- **Export** — save the security report as a timestamped JSON or PDF-friendly HTML for records

---

### Multi-Tool AI Manager (Scope Expansion)

The biggest possible direction: expand beyond Claude Code to become a universal manager for all AI coding tool data folders. Each tool accumulates conversations, config, cache, and session data the same way `~/.claude` does — users have no visibility into any of them.

#### Architecture Questions to Resolve First

- **Project rename** — `claude-manager` makes no sense if it manages 5 tools. Options: `ai-tool-manager`, `dotai-manager`, `ai-folder-manager`, or keep `claude-manager` as the Claude-specific module inside a larger umbrella project
- **Shared scanner core** — refactor `scan.js` into a generic `scan(rootDir, folderMetadata)` function; each tool gets its own metadata file (e.g., `tools/codex.js`, `tools/claude.js`). One runner script, swappable tool configs
- **Tool auto-detection** — on startup, check which tools are installed (does `~/.claude` exist? `~/.codex`? `~/.gemini`?) and only show tabs for detected tools. Skip tools not installed
- **Unified summary bar** — across all tools: total AI data on disk, total freeable, tools detected, highest-risk tool

#### OpenAI Codex CLI — `~/.codex/`

OpenAI's open-source Codex CLI (released 2025) stores data in `~/.codex/`. Known structure (subject to change — needs live scan to verify):

- `~/.codex/` — root config and conversation history
- Likely contains: conversation logs, config file (`config.json` or similar), cache
- Similar risk profile to `~/.claude/projects/` — conversations may contain sensitive code, API keys pasted in chat, file contents
- **Research needed:** live scan of `~/.codex/` to document actual subfolders, sizes, and what's safe to delete — same process used to build `README.md` for `~/.claude`
- **Docs:** https://github.com/openai/codex

#### Google Gemini CLI — `~/.gemini/`

Google's Gemini CLI stores data in `~/.gemini/`. Known/suspected structure:

- `~/.gemini/` — root with config and conversation history
- Similar accumulation pattern to `~/.claude/` — grows with usage
- **Research needed:** live scan to document actual folder structure and safety levels
- **Docs:** https://github.com/google-gemini/gemini-cli

#### Aider — `~/.aider/` and project-level files

Aider is a popular open-source AI coding assistant. Its data is split:

- `~/.aider/` — global config and history
- Project-level: `.aider.conf.yml`, `.aider.tags.cache.v3/`, `.aider.chat.history.md` — these accumulate in every repo you use Aider in
- **Privacy risk:** `.aider.chat.history.md` is a plaintext log of every conversation — often committed to repos accidentally
- **Gitignore concern:** Aider files frequently appear in `.gitignore` violations; worth flagging if found unignored in a project scan
- **Docs:** https://aider.chat/docs/

#### Continue.dev — `~/.continue/`

Continue is a VS Code / JetBrains AI coding extension. Data lives in:

- `~/.continue/` — config, models, conversation history
- `config.json` — model configuration including API keys (high risk if exposed)
- **Research needed:** live scan to document actual folder structure
- **Docs:** https://continue.dev/docs

#### Cursor — `~/Library/Application Support/Cursor/` (macOS)

Cursor is an AI-powered code editor (fork of VS Code). Its data is in the macOS Application Support folder rather than home directory, making it harder to find:

- macOS: `~/Library/Application Support/Cursor/`
- Contains: workspace storage, extension data, logs, cached models
- Much larger than CLI tools — Cursor caches models and extensions like a full editor
- **Research needed:** live scan to identify what's safe to delete vs. needed for Cursor to run
- **Docs:** https://cursor.com/

#### GitHub Copilot

Copilot is a VS Code/JetBrains extension — it doesn't have a standalone `~/.copilot/` folder. Data is stored inside VS Code's extension data:

- macOS: `~/Library/Application Support/Code/User/globalStorage/github.copilot*/`
- Low standalone value to audit separately — better handled as part of a "VS Code data" scan
- Telemetry and auth tokens are the main concern

#### Other Tools to Evaluate Later

- **Amazon Q Developer** (formerly CodeWhisperer) — AWS config related
- **Tabnine** — VS Code extension data
- **Cody** (Sourcegraph) — VS Code extension, local cache
- **Cline / Roo** — VS Code extension, stores conversation history locally
- **Windsurf** (Codeium) — standalone editor, similar to Cursor

---

## How to Update This File

1. **Completed a task?** Check it off (`- [x]`)
2. **Found something new to do?** Add it as a new task (`- [ ]`)
3. **Task blocked or changed scope?** Add a note inline or update the description
4. **Whole phase complete?** Mark the phase header as `✅ COMPLETE` and add a completion date

### Complexity Labels

Open tasks are tagged with an effort estimate:

| Label | Meaning |
|-------|---------|
| 🟢 Easy | Contained change, one file, less than an hour |
| 🟡 Medium | Multiple files or moderate logic, a few hours |
| 🔴 Hard | Multi-system, significant design decisions, or high uncertainty |

Example update:
```
- [ ] `scripts/clean.js` — safe cleanup with dry-run mode
  - [ ] `--dry-run` flag to preview what would be deleted
  - [x] `--only-<category>` flag (e.g., `--only-plans`, `--only-shell-snapshots`) — DONE May 24
  - [ ] `--older-than-days <N>` for age-based cleanup — BLOCKED: need to debate API
  - [ ] Interactive mode: confirm before deleting (optional) — MOVED TO v2, lower priority
```

---

## Quick Reference: What Each Phase Delivers

| Phase | Deliverable | User Gets |
|-------|-------------|-----------|
| **Phase 1** ✅ | README.md map of `~/.claude` | Understanding of what's in `~/.claude` and what's safe to delete |
| **Phase 2** 🔄 TBD | `scan.js`, `clean.js`, `audit.js` scripts | Automated cleanup tools; can delete stale data safely |
| **Phase 3** 📋 Future | Visual UI + distribution | Non-technical users can manage `~/.claude` visually; shareable with others |
