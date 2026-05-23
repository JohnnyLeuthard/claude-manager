# Claude Manager — Task Roadmap

Living checklist of work completed, in progress, and planned for the `claude-manager/` project.

**Last updated:** May 23, 2026

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

- [ ] Move workspace from `my-workflows-private/claude-manager/` to `/my-workflows/claude-manager/` (TBD — may keep in private for now)
- [ ] Initialize as standalone git repo with own GitHub remote (TBD)
- [ ] Create GitHub repo: `github.com/johnnyleuthard/claude-manager`
- [ ] Push to public GitHub
- [ ] Add to `my-workflows-public/README.md` as showcase item (link to public repo)

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
  - [ ] Identify stale data (old conversations, broken symlinks, empty dirs) — planned for clean.js
  - [ ] Flag security concerns (shell snapshots with env vars, old backups) — planned for audit.js
  
### Cleanup Execution

- [ ] `scripts/clean.js` — safe cleanup with dry-run mode
  - [ ] `--dry-run` flag to preview what would be deleted
  - [ ] `--only-<category>` flag (e.g., `--only-plans`, `--only-shell-snapshots`)
  - [ ] `--older-than-days <N>` for age-based cleanup
  - [ ] `--keep-count <N>` to keep only the most recent N items
  - [ ] Logging: what was deleted, why, timestamp
  - [ ] Interactive mode: confirm before deleting (optional)

### Security Auditing

- [ ] `scripts/audit.js` — check for security risks
  - [ ] Scan `shell-snapshots/` for API keys or secrets
  - [ ] Scan `session-env/` for leaked env vars
  - [ ] Check `mcp-needs-auth-cache.json` for unusual external services
  - [ ] Report: "these are OK, watch out for these, delete these for privacy"

### Documentation

- [ ] `SCRIPTS.md` — user guide for running cleanup scripts
  - [ ] How to use `--dry-run` safely
  - [ ] Common cleanup scenarios with example commands
  - [ ] What each script does and what it deletes

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

## How to Update This File

1. **Completed a task?** Check it off (`- [x]`)
2. **Found something new to do?** Add it as a new task (`- [ ]`)
3. **Task blocked or changed scope?** Add a note inline or update the description
4. **Whole phase complete?** Mark the phase header as `✅ COMPLETE` and add a completion date

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
