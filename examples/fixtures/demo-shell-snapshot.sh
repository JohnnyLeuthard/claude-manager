# demo-shell-snapshot.sh
# DEMO FIXTURE — contains fake credentials for testing audit.js
# These values are NOT real. Do not attempt to use them anywhere.
#
# Usage:
#   cp examples/fixtures/demo-shell-snapshot.sh ~/.claude/shell-snapshots/audit-demo-test.sh
#   node scripts/audit.js
#
# Expected findings when audit.js scans this file:
#   🔴 HIGH  shell-snapshots/  Named secret              OPENAI_API_KEY → sk-dem***
#   🔴 HIGH  shell-snapshots/  Anthropic / OpenAI key    sk-demoFA...   → sk-dem***
#   🔴 HIGH  shell-snapshots/  Named secret              GITHUB_TOKEN   → ghp_FA***
#   🔴 HIGH  shell-snapshots/  GitHub PAT (classic)      ghp_FAKE...    → ghp_FA***
#   🔴 HIGH  shell-snapshots/  Named secret              DATABASE_PASS  → fakeDEM***
#
# Note: some findings duplicate because multiple patterns match the same line.
# This is expected — the scanner is thorough, not deduplicated.

PATH=/usr/local/bin:/usr/bin:/bin
HOME=/Users/demouser
SHELL=/bin/zsh
TERM=xterm-256color
NODE_ENV=development
EDITOR=vim

OPENAI_API_KEY=sk-demoFAKEkeyForTestingAuditScript0001
GITHUB_TOKEN=ghp_FAKEtokenForAuditDemoSCRIPTtest00001
DATABASE_PASSWORD=fakeDEMOpasswordForTestingPurposesOnly
