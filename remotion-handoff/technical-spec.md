# Technical Spec — claude-manager Remotion Animation

**Framework:** Remotion (React-based video)
**Language:** TypeScript
**Duration:** 75 seconds · 30fps · 2250 total frames
**Resolution:** 1920×1080

---

## Composition Config

```tsx
// src/Root.tsx
import { Composition } from 'remotion';
import { Main } from './Main';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ClaudeManagerExplainer"
    component={Main}
    durationInFrames={2250}   // 75s × 30fps
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{}}
  />
);
```

---

## Scene Timing (frames at 30fps)

| Scene | Start (s) | End (s) | Start (f) | End (f) | Duration (f) |
|-------|-----------|---------|-----------|---------|--------------|
| HiddenFolder | 0 | 10 | 0 | 300 | 300 |
| TheProblem | 10 | 22 | 300 | 660 | 360 |
| Dashboard | 22 | 40 | 660 | 1200 | 540 |
| Terminal | 40 | 50 | 1200 | 1500 | 300 |
| Roadmap | 50 | 65 | 1500 | 1950 | 450 |
| Closing | 65 | 75 | 1950 | 2250 | 300 |

---

## Main Sequence

```tsx
// src/Main.tsx
import { Series } from 'remotion';
import { HiddenFolder } from './scenes/HiddenFolder';
import { TheProblem } from './scenes/TheProblem';
import { Dashboard } from './scenes/Dashboard';
import { Terminal } from './scenes/Terminal';
import { Roadmap } from './scenes/Roadmap';
import { Closing } from './scenes/Closing';

export const Main: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={300}><HiddenFolder /></Series.Sequence>
    <Series.Sequence durationInFrames={360}><TheProblem /></Series.Sequence>
    <Series.Sequence durationInFrames={540}><Dashboard /></Series.Sequence>
    <Series.Sequence durationInFrames={300}><Terminal /></Series.Sequence>
    <Series.Sequence durationInFrames={450}><Roadmap /></Series.Sequence>
    <Series.Sequence durationInFrames={300}><Closing /></Series.Sequence>
  </Series>
);
```

---

## File Structure

```
src/
├── Root.tsx
├── Main.tsx
├── scenes/
│   ├── HiddenFolder.tsx
│   ├── TheProblem.tsx
│   ├── Dashboard.tsx
│   ├── Terminal.tsx
│   ├── Roadmap.tsx
│   └── Closing.tsx
├── components/
│   ├── FolderCard.tsx       ← importance-colored card with badge, size, pros/cons
│   ├── ImportanceBadge.tsx  ← CRITICAL / HIGH / MEDIUM / LOW chip
│   ├── Typewriter.tsx       ← character-by-character reveal, 40ms/char
│   ├── CodeBlock.tsx        ← monospace block, optional typewriter mode
│   └── TextOverlay.tsx      ← bottom-third subtitle bar
└── data/
    └── folders.ts           ← paste the data below
```

---

## Data File — `src/data/folders.ts`

Drop this file in as-is. Mirrors `FOLDER_METADATA` from `scripts/scan.js` in the source repo.

```ts
export type Importance = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FolderMeta {
  name: string;
  importance: Importance;
  description: string;
  spaceFreeable: string;
  freeablePct: number;
  proDelete: string;
  conDelete: string;
  docsUrl: string | null;
}

export const folders: FolderMeta[] = [
  {
    name: 'backups',
    importance: 'CRITICAL',
    description: 'Timestamped backups of your Claude Code config (.claude.json), created automatically every 10–15 minutes. Contains encrypted API keys, settings, hooks, and permission overrides.',
    spaceFreeable: 'None recommended (keep last 1–2 weeks)',
    freeablePct: 0.0,
    proDelete: 'Reduces backup clutter',
    conDelete: 'Lose ability to roll back config changes',
    docsUrl: 'https://code.claude.com/docs/en/settings',
  },
  {
    name: 'cache',
    importance: 'LOW',
    description: 'Cached data from external sources — Claude Code changelog, GitHub issue lists. Rebuilt automatically on next run.',
    spaceFreeable: 'All (100%)',
    freeablePct: 1.0,
    proDelete: 'Instant space recovery, no impact',
    conDelete: 'Slight slowdown on first run after deletion',
    docsUrl: null,
  },
  {
    name: 'debug',
    importance: 'LOW',
    description: 'Debug logs and symlinks written during troubleshooting sessions. Usually empty; only populated when debug mode is active.',
    spaceFreeable: 'All (100%)',
    freeablePct: 1.0,
    proDelete: 'No impact',
    conDelete: 'Lose debug context if actively troubleshooting',
    docsUrl: 'https://code.claude.com/docs/en/troubleshooting',
  },
  {
    name: 'downloads',
    importance: 'LOW',
    description: 'Unused placeholder folder. Claude Code reserves this path but does not currently write anything here.',
    spaceFreeable: 'All (100%)',
    freeablePct: 1.0,
    proDelete: 'No impact',
    conDelete: 'None',
    docsUrl: null,
  },
  {
    name: 'file-history',
    importance: 'MEDIUM',
    description: 'Versioned snapshots of files you edited during Claude Code sessions. Powers the undo/redo feature for file edits. Grows with every session.',
    spaceFreeable: 'Files older than 7 days (~70%)',
    freeablePct: 0.7,
    proDelete: 'Significant space recovery',
    conDelete: 'Lose undo history for older edit sessions',
    docsUrl: null,
  },
  {
    name: 'ide',
    importance: 'LOW',
    description: 'Lock files tracking active IDE connections (VS Code, JetBrains). Stale when Claude Code is not running.',
    spaceFreeable: 'All when Claude not running (100%)',
    freeablePct: 1.0,
    proDelete: 'No impact, regenerated automatically',
    conDelete: 'None',
    docsUrl: 'https://code.claude.com/docs/en/ide-integrations',
  },
  {
    name: 'plans',
    importance: 'MEDIUM',
    description: 'Plan-mode session files written during planning conversations. One file per planning session, grows over time.',
    spaceFreeable: 'Completed plans (~70%)',
    freeablePct: 0.7,
    proDelete: 'Cleaner workspace, space recovery',
    conDelete: 'Lose plan history from past sessions',
    docsUrl: 'https://code.claude.com/docs/en/overview',
  },
  {
    name: 'plugins',
    importance: 'HIGH',
    description: 'Installed Claude Code plugins and cached marketplace data. The installed plugin data is needed for plugins to work; the marketplace cache is optional.',
    spaceFreeable: 'Marketplace cache only (~50%)',
    freeablePct: 0.5,
    proDelete: 'Slimmer install footprint',
    conDelete: 'Re-downloads marketplace data on next update check, installed plugins may need reinstall',
    docsUrl: 'https://code.claude.com/docs/en/plugins',
  },
  {
    name: 'projects',
    importance: 'CRITICAL',
    description: 'Conversation transcripts from every Claude Code session, organized by project path. This is the largest and most sensitive folder — contains full chat logs, file contents, and session context.',
    spaceFreeable: 'Old project conversations (60–80%)',
    freeablePct: 0.7,
    proDelete: 'Massive space savings, privacy improvement',
    conDelete: 'Lose conversation history and session context continuity',
    docsUrl: 'https://code.claude.com/docs/en/memory',
  },
  {
    name: 'session-env',
    importance: 'LOW',
    description: 'Shell environment state snapshots captured at session start. Used to restore context between sessions. Regenerated on each new session.',
    spaceFreeable: 'All older than current session (100%)',
    freeablePct: 1.0,
    proDelete: 'No impact, regenerated automatically',
    conDelete: 'None',
    docsUrl: null,
  },
  {
    name: 'sessions',
    importance: 'LOW',
    description: 'Active session tracking files. Only meaningful while Claude Code is running; stale files accumulate when sessions end unexpectedly.',
    spaceFreeable: 'All when Claude not running (100%)',
    freeablePct: 1.0,
    proDelete: 'No impact, regenerated automatically',
    conDelete: 'None',
    docsUrl: null,
  },
  {
    name: 'shell-snapshots',
    importance: 'LOW',
    description: 'Full shell environment captures including PATH, env vars, and shell state. Can contain sensitive environment variables. Safe to delete at any time.',
    spaceFreeable: 'All (100%)',
    freeablePct: 1.0,
    proDelete: 'Space recovery and privacy improvement (may contain secrets in env vars)',
    conDelete: 'None — regenerated automatically',
    docsUrl: null,
  },
  {
    name: 'skills',
    importance: 'HIGH',
    description: 'Locally installed custom skills (slash commands). Deleting this folder disables any custom skills you have installed.',
    spaceFreeable: 'None recommended',
    freeablePct: 0.0,
    proDelete: 'None',
    conDelete: 'All custom skills stop working until reinstalled',
    docsUrl: 'https://code.claude.com/docs/en/slash-commands',
  },
  {
    name: 'telemetry',
    importance: 'LOW',
    description: 'Queue of pending telemetry events that failed to send. Retried on next run. Safe to clear at any time.',
    spaceFreeable: 'All (100%)',
    freeablePct: 1.0,
    proDelete: 'No impact (events were already queued, will not be sent)',
    conDelete: 'None',
    docsUrl: null,
  },
  {
    name: 'todos',
    importance: 'HIGH',
    description: 'Persisted todo lists from Claude Code sessions. These are the in-session task lists Claude maintains. Active todos may still be relevant.',
    spaceFreeable: 'Completed/old todos (~50%)',
    freeablePct: 0.5,
    proDelete: 'Cleaner state, slight space recovery',
    conDelete: 'Lose todo history from past sessions',
    docsUrl: null,
  },
];
```

---

## Key Component Specs

### `Typewriter.tsx`
- Props: `text: string`, `startFrame: number`, `charsPerFrame?: number` (default 0.75 = ~40ms/char at 30fps)
- Use `useCurrentFrame()` and `Math.floor((frame - startFrame) * charsPerFrame)` to slice text
- Clamp to `text.length` so it never overruns

### `ImportanceBadge.tsx`
- Props: `level: Importance`
- Color map:
  ```ts
  const colors: Record<Importance, string> = {
    CRITICAL: '#ef4444',
    HIGH:     '#f97316',
    MEDIUM:   '#eab308',
    LOW:      '#22c55e',
  };
  ```
- Small pill: `8px 12px` padding, `10px` font, white text, colored background

### `FolderCard.tsx`
- Props: `folder: FolderMeta`, `delay?: number` (frames before animating in)
- Left border `4px solid <importance color>`
- Card background `#1e293b`, border `#334155`
- Use `spring()` from Remotion for entrance animation
- Layout: name + badge row · description · size freeable · pro/con row · optional "Docs →" link

### `TextOverlay.tsx`
- Fixed position bottom ~15% of frame
- Semi-transparent dark pill background
- Fade in with `interpolate(frame, [startFrame, startFrame + 15], [0, 1])`

---

## Acceptance Criteria

- [ ] All 6 scenes play in sequence, total runtime 73–77 seconds
- [ ] Typewriter effect visible in Scene 1 and Scene 4
- [ ] Card stagger (150ms = ~4–5 frames apart) visible in Scene 2 and Scene 3
- [ ] Importance badge colors match design tokens exactly
- [ ] No white flash between scenes
- [ ] Text overlays legible on dark background (check contrast)
- [ ] `node scripts/scan.js --html` command appears verbatim in Scene 3
- [ ] GitHub URL appears verbatim in Scene 6
- [ ] Renders clean in both `remotion preview` and `remotion render`
