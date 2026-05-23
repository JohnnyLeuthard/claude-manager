# Claude Manager

Understand, audit, and manage everything in `~/.claude` — the system folder where Claude Code stores conversations, plans, file histories, settings, and session data.

**This is a standalone tool.** You do not need any other setup, workspace, or knowledge of Model Workspace Protocol (MWP) to use it.

## What This Is

`~/.claude` accumulates data from every Claude Code session: conversation logs, plan files, file-edit histories, shell snapshots, config backups, and more. Without visibility, it grows to 10–60+ MB of mixed data — some critical (your settings, auth tokens), some stale (old plan files, archived conversations), some privacy-sensitive (shell environment dumps, conversation transcripts).

This project provides:
- **Comprehensive reference** — a detailed map of every folder and file in `~/.claude`
- **Understanding** — why each item exists and when it's safe to delete
- **Cleanup tools** — scripts and utilities to audit, scan, and safely remove stale data (Phase 2)
- **Visual interface** — interactive way to browse and manage (Phase 3)

## How to Use This Project

1. **Start here:** Read the [README.md](README.md) — it's a complete reference for your `~/.claude` folder
2. **Want quick actions?** Jump to "Cleanup Recommendations" in README.md
3. **Specific folder?** Use the table of contents to find what you're looking for
4. **Privacy concerns?** Search for "Security notes" in any section

## Project Structure

```
claude-manager/
├── README.md                ← The authoritative reference (what's in ~/.claude and what to delete)
├── CONTEXT.md               ← Task routing (how to navigate this project)
├── CONTRIBUTING.md          ← How to contribute
├── LICENSE                  ← MIT License
├── scripts/                 ← Cleanup, audit, scan utilities (Phase 2, TBD)
│   ├── scan.js             ← [planned] classify every item in ~/.claude
│   ├── clean.js            ← [planned] dry-run + live cleanup
│   └── audit.js            ← [planned] check for security risks
└── TASKS.md                ← Project roadmap and progress tracking
```

## Core Principles

1. **Safety first** — all operations support `--dry-run` before making changes
2. **Privacy-aware** — documents what's sensitive and what's not
3. **Comprehensive** — every folder and file in `~/.claude` is documented
4. **Actionable** — tells you not just what exists, but what to do with it
5. **No dependencies** — works standalone, no special setup needed
