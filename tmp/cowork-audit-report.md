# Cowork Audit Report

Date: May 25, 2026

Scope: Read-only security scan of the repository structure, excluding `examples/` as requested.

## Findings

1. **Medium: `audit.js` likely misses `session-env/` secrets in real Claude layouts**

   `scripts/audit.js` reads only direct entries under `~/.claude/session-env` and silently skips entries it cannot `readFileSync`. The README says `session-env/` contains UUID-named subdirectories, so this can produce false OK results.

   Risk: users may trust a clean audit while nested environment snapshots were never scanned.

2. **Medium: local `/open` endpoints have weak path validation and no request guard**

   `scripts/scan.js` and `scripts/audit.js` accept any GET request where `path.startsWith(claudeDir)`. This allows prefix-confusion paths like `~/.claude-something`, does not require the resolved real path to stay inside `~/.claude`, and has no nonce/origin guard.

   Risk: while bound to `127.0.0.1` on a random port, a webpage that discovers or guesses the port could trigger Finder/open actions.

3. **Low/Medium: audit HTML behavior is more privileged than documented**

   `TASKS.md` says audit HTML needs no server and is static, but `scripts/audit.js` starts a local server for `--html`.

   Risk: users may not realize `node scripts/audit.js --html` exposes a localhost action endpoint for 10 minutes.

4. **Low: local Claude permissions are broad**

   `.claude/settings.local.json` allows reads across `/Volumes/X10Pro/GitHub/Mine/**`, wider than this repo. It is ignored by git, so this is a local-machine concern, not a publishing leak.

## Clean Checks

- Ignored `examples/` as requested.
- Made no code or documentation changes during the scan.
- Found no secret-pattern matches in the non-example tracked structure with the regex sweep.
- `node --check scripts/scan.js` passed.
- `node --check scripts/audit.js` passed.
- Running the existing audit script read-only returned `0 HIGH`, `0 WARN`, `3 OK`, with no files modified.
- Generated `reports/` files contain absolute local paths, but `reports/*` is ignored except `.gitkeep`, so they should not be committed.
