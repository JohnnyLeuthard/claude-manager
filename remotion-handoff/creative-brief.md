# Creative Brief — claude-manager Explainer Animation

**Project:** claude-manager explainer video
**Format:** ~75 seconds · landscape 16:9 · 1920×1080
**Tone:** Clean, technical, slightly dramatic — dev tool promo, not a sales pitch
**Audience:** Claude Code users who want to understand and manage `~/.claude`

---

## The Story in One Sentence

> Every Claude Code user has a hidden `~/.claude` folder silently filling up with conversations, snapshots, credentials, and junk — `claude-manager` is the tool that finally lets you see inside it, understand it, and clean it safely.

---

## Scene Breakdown

### Scene 1 — The Hidden Folder (0s – 10s)

**Visual:**
- Dark terminal background fades in
- A file tree animates line by line (typewriter effect):
  ```
  ~/
  └── .claude/          ← blinks/highlights
      ├── projects/
      ├── file-history/
      ├── shell-snapshots/
      ├── plans/
      └── ...14 more folders
  ```
- Folder count ticks up: **"15 folders · 32 MB · growing"**

**Text overlay (bottom third):**
> "Claude Code silently builds a folder in your home directory."

**Transition:** Zoom into the `.claude/` node → expands to fill screen → cuts to Scene 2

---

### Scene 2 — The Problem (10s – 22s)

**Visual:**
- 3 floating cards animate in from left, staggered (150ms apart):
  - Card 1: 🔴 `shell-snapshots/` — "Contains your shell environment variables"
  - Card 2: 🟡 `projects/` — "47 MB of conversation logs, some from months ago"
  - Card 3: 🔴 `file-history/` — "Snapshots of every file you've ever edited"
- Cards pulse/glow in warning colors (red and orange)

**Text overlay:**
> "Without visibility — you don't know what's safe to delete."
> "You don't know what's private."
> "You don't know what's just... taking up space."

**Transition:** Cards scatter off-screen → reveal dashboard

---

### Scene 3 — The Dashboard (22s – 40s)

**Visual:**
- HTML dashboard slides in from the right
- Cards appear one by one with their importance badge, left border colored by level:
  - `settings.json` → **CRITICAL** (red left border)
  - `projects/` → **HIGH** (orange left border)
  - `plans/` → **MEDIUM** (yellow left border)
  - `telemetry/` → **LOW** (green left border)
- Each card shows: folder name, size badge, importance badge, description, pros/cons of deleting, "Docs →" link
- Camera pans slowly across the grid

**Text overlay:**
> "One command. Every folder. Ranked by importance."

**Code snippet animates in (monospace, bottom left):**
```bash
node scripts/scan.js --html
```

**Transition:** Dashboard fades → terminal view fades in

---

### Scene 4 — Terminal Mode (40s – 50s)

**Visual:**
- Terminal output renders line by line, fast:
  ```
  ~/.claude folder dashboard
  ──────────────────────────────────
  ● projects/       47.2 MB  HIGH
    Conversation history (per project)
    Free up: ~70%  |  Pro: Frees most space  |  Con: Loses session history

  ● file-history/    6.1 MB  MEDIUM
    File-edit snapshots for undo/redo
    Free up: ~50%  |  Pro: Reduces disk use  |  Con: Undo history lost

  ● telemetry/       0.1 MB  LOW ✓
    Failed telemetry retries
    Free up: 100%  |  Pro: Nothing important  |  Con: None
  ```
- Importance colors: red (CRITICAL), orange (HIGH), yellow (MEDIUM), green (LOW)

**Text overlay:**
> "Terminal output. HTML dashboard. Your choice."

**Transition:** Terminal fades → dark background with roadmap

---

### Scene 5 — What's Coming (50s – 65s)

**Visual:**
- Three phase cards animate in staggered (left → center → right):

  ```
  Phase 1 ✅          Phase 2 🔄           Phase 3 📋
  Reference map    Cleanup scripts       Visual UI
  README + scan    clean.js             Interactive
  Complete         In progress          Coming soon
  ```

- Below each: 2–3 bullet points fade in
  - Phase 1: Comprehensive README · Folder dashboard · Importance ratings
  - Phase 2: Safe cleanup (dry-run) · Security audit · Stale data removal
  - Phase 3: Visual tree view · Click-to-delete UI · Sharable tool

**Text overlay:**
> "Phase 1: understand. Phase 2: clean. Phase 3: control."

**Transition:** Cards shrink → logo lockup

---

### Scene 6 — Closing (65s – 75s)

**Visual:**
- Clean dark background
- Large centered text animates in:
  ```
  claude-manager
  ```
- Subtitle fades in: `github.com/JohnnyLeuthard/claude-manager`
- Small footer: `MIT License · Zero dependencies · macOS & Linux`

**Final frame hold:** 2 seconds

---

## Design Tokens

| Token | Value |
|-------|-------|
| Background | `#0f172a` |
| Text primary | `#f8fafc` |
| Text secondary | `#94a3b8` |
| CRITICAL color | `#ef4444` |
| HIGH color | `#f97316` |
| MEDIUM color | `#eab308` |
| LOW color | `#22c55e` |
| Accent / link | `#3b82f6` |
| Card background | `#1e293b` |
| Card border | `#334155` |
| Font — UI | Inter or system-ui |
| Font — code/mono | JetBrains Mono or monospace |

---

## Animation Style Notes

- Typewriter text: ~40ms per character
- Card stagger: 150ms delay between each card
- Slow, deliberate pacing — technical product, not a hype reel
- No rapid cuts; prefer slide/fade transitions (~300ms)
- Easing: `ease-out` for entrances, `ease-in` for exits
- Target: 30fps (60fps optional for silky terminal rendering)

---

## Assets to Gather Before Starting

| Asset | How to get it |
|-------|---------------|
| Dashboard screenshot | `node scripts/scan.js --html` → open in browser → screenshot |
| Terminal screenshot | `node scripts/scan.js` → screenshot terminal output |
| GitHub URL | `github.com/JohnnyLeuthard/claude-manager` |
| Logo/wordmark | Text-only: `claude-manager` in monospace is enough |
| Background music (optional) | Ambient lo-fi, no lyrics, 60–90s loop |
