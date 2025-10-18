📌 Master Merge Plan — @MERGE_PLAN.md
Step 0 — Setup

Create branch merge/broghan from feature/firebase-integration.

Fetch teammate branches (e.g., git fetch origin broghan/<branch>).

Install any missing dependencies (client + server).

✅ Validation: Confirm both branches are available locally.

Step 1 — Compare Broghan’s branch

Print summary of differences:

New files (list)

Modified files (list)

Conflicts with blockchain/Firebase logic (highlight exact overlaps)

STOP and wait for confirmation before merging.

Step 2 — Merge Broghan’s code

Merge Broghan’s changes into merge/broghan.

Never overwrite blockchain/Firebase logic.

If conflicts: refactor Broghan’s code → adapt to APIs, avoid breaking existing flow.

Create .bak.TIMESTAMP of all modified files.

✅ Validation:

Backend runs (npm run dev)

API health OK

Queue worker processes new request → Firestore + Blockchain updates

Frontend runs, wallet connect + request submission works

STOP after validation.

Step 3 — Review Integration

Print summary of merged files and what was changed.

Report any features that still need wiring to blockchain/Firebase.

STOP for my approval before moving on.

Step 4 — Next Teammate Branch

Repeat Steps 1–3 for next teammate’s branch (new feature branch: merge/<name>).