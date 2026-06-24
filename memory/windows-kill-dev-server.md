---
name: windows-kill-dev-server
description: How to stop the Next dev server on this Windows machine (pkill does not work)
metadata:
  type: feedback
---

On this Windows machine, `pkill -f "next dev"` from the Bash tool does NOT kill the Next.js dev server — the node process survives and keeps holding port 3000, causing "Another next dev server is already running" on the next `npm run dev`.

**Why:** the Bash tool's pkill doesn't match/kill the actual Windows node.exe process tree.

**How to apply:** stop dev servers with PowerShell instead — find the listener via `Get-NetTCPConnection -LocalPort 3000 -State Listen` then `Stop-Process -Id <pid> -Force`, or kill next node procs via `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where CommandLine -match 'next'`. Prefer running dev servers so they can be cleanly torn down, and always verify port 3000 is free afterward.
