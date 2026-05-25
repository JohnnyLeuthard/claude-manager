# Examples

Static demo files showing what each tool's output looks like. None of these are live — they contain hardcoded data for reference only.

---

## `example-dashboard.html`

Demo of the `scan.js` folder dashboard. Shows what the HTML report looks like with sample folder data: size badges, importance levels (CRITICAL / HIGH / MEDIUM / LOW), freeable space estimates, pros/cons of deleting, and docs links.

To generate a live version from your actual `~/.claude`:
```bash
node scripts/scan.js --html
```

---

## `example-audit.html`

Demo of the `audit.js` security scanner. Shows what the HTML report looks like when findings are detected — includes 2 HIGH (possible credentials in a shell snapshot), 2 WARN (sensitive env var names in session-env), and 1 OK (MCP cache clean).

All credential values in this file are fake and were never real secrets. The "EXAMPLE REPORT" banner at the top makes this clear.

To generate a live version from your actual `~/.claude`:
```bash
node scripts/audit.js --html
```

---

## `fixtures/`

Test files for verifying that scripts detect what they're supposed to detect.

| File | Purpose |
|------|---------|
| `demo-shell-snapshot.sh` | Fake credentials that trigger 5 HIGH findings in `audit.js`. Copy to `~/.claude/shell-snapshots/` and run `node scripts/audit.js` to see findings fire. |

To use the demo fixture:
```bash
cp examples/fixtures/demo-shell-snapshot.sh ~/.claude/shell-snapshots/audit-demo-test.sh
node scripts/audit.js
```

Remove it when done:
```bash
rm ~/.claude/shell-snapshots/audit-demo-test.sh
```
