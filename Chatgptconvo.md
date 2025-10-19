Okay now I want you to give everything we've just talked about like go to the conversation we just talked about Polsky right now after I told you like I have my initial questions like just just grab all the context you can put it in one context like giving message then give everything you've just said into a master prompt or asking question because now I want to go back into cursor implement everything you have make a check that like if things have already been implemented then skip that and then if something needs to be changed then do that so I want a master prompt again very detailed very contextual so that it knows what's happening and then just give it everything I've said like the scenarios the questions and things of that nature and then try and explain it explain it to cursor so that it understands and then afterwards I'll build it over there test it over there and I'll get back to you if I'm happy with how it's working
ChatGPT said:

Great — below is a single very detailed master prompt you can paste into Cursor Plan Mode exactly as-is. It contains everything from our entire conversation about PulseKey and EverGuard (priority: PulseKey first, Legacy/Digital Will second), plus explicit requirements, data shapes, endpoints, UI screens, security policy defaults, skip-if-implemented checks, seed data, acceptance tests, dev tasks, and deliverables.

It’s written so Cursor knows the whole story, what to build first, what to treat as already implemented if found, and exactly how to behave if components already exist. Paste the whole block into Cursor Plan Mode and let it run the plan / scaffold / codegen.

CURSOR MASTER PROMPT — FULL CONTEXT: PULSEKEY-FOCUSED EVERGUARD MVP

PROJECT SUMMARY (high level)
You are Cursor. Build and/or complete the EverGuard project (repo name `pulsekey-vault`) — a BlockDAG-backed secure data vault. Prioritize the **PulseKey emergency access** system as the number one deliverable. The **Legacy Vault (Digital Will / Executor)** is second priority. The goal is a hackathon-ready MVP and working demo with seed data, ledger proofing, and a 2-minute video storyboard. The system must be offline-demo-friendly (MockBlockDAG + storage mock) but include a configurable real BlockDAG client if keys are provided.

IMPORTANT: This prompt consolidates all prior conversation context. Cursor must:
1. Inspect the repository/folder if present. If a file/component is already implemented and passes its acceptance test (see checklist), **skip** regenerating it and instead produce a short summary of that file’s behavior and tests you ran. If a file is partially implemented, produce a patch to complete it.
2. If code is missing, generate working code for the required files (functional, not stubs) for a hackathon demo.
3. Always produce a final `demo-runbook.md` with exact steps to run, seed, and demo the flows.
4. Keep all cryptographic operations clearly commented and implemented using WebCrypto where possible.
5. Default to `USE_REAL_BLOCKDAG=false` and provide `.env.example` for switching.

PRIMARY OBJECTIVES (order)
1. Fully implement PulseKey emergency capsule flow end-to-end (create capsule, QR, medic request, issue BurstKey, consume, BlockDAG logging, ledger viewer). Acceptance tests must pass.
2. Implement Legacy Vault executor threshold release flow (create will, simulate trigger, submit executor approvals/shares, reconstruct key, release).
3. Implement MockBlockDAG client & small ledger UI for demo.
4. Provide seed data scripts and demo runbook + 2-minute video storyboard.

CONTEXT & PRODUCT NOTES (from user chat)
- PulseKey: emergency access subsystem. BurstKey = short-lived, single-use or time-limited symmetric key that decrypts only emergency fields from a capsule. Must be issued only to **verified roles** (medic/doctor). Unverified scanners get no access and optionally generate a logged failed-scan event.
- The owner sets up a vault with capsules. App auto-selects emergency fields from profile but owner can edit selections before confirming.
- BurstKey lifecycle: issue -> (decrypt) -> consumed -> expire. Recommended defaults: burstExpiry=10m, sessionDuration=15m, singleUse=true, reissueCooldown=5m, maxBurstPerHourPerCapsule=3. Attestation path allows bypass of some cooldowns (simulate via API).
- For hackathon speed, server-side escrow to re-wrap contentKey for bursts is acceptable but must be documented as a demo compromise.
- The UI must show both decrypted content (when allowed) and the on-chain proof (tx id / contentHash) like GirliesHub did.

TECH STACK & FILE TARGETS (generate code for these unless they exist and pass tests)
- Frontend: Next.js + TypeScript + React (pages folder acceptable), Tailwind CSS for quick styling.
- Backend: Next.js API routes (serverless functions) or Node serverless-compatible routes.
- Crypto: `lib/crypto.ts` (WebCrypto helpers). Implement AES-GCM 256 encryption, ECDH derive + AES-KW wrap/unwrap helpers, Shamir helper wrapper or use `secrets.js-grempe`.
- BlockDAG client: `lib/blockdagClient.ts` with two modes: real (if `USE_REAL_BLOCKDAG=true` and API key) and mock (default) storing events in a local JSON file or in-memory DB. Methods: `writeEvent(eventType, payload)`, `readEvents(filter)`, `getEvent(id)`.
- Storage client: `lib/storageClient.ts` supporting `ipfs` (mock) and `serverStore` (JSON file or in-memory) with `upload(ciphertext)` -> returns `storageRef` and `fetch(storageRef)` -> returns ciphertext.
- Pages/components: create or complete these files:
  - `/pages/index.tsx` (Dashboard overview)
  - `/pages/capsule/[id].tsx` (Capsule detail & owner edit)
  - `/pages/emergency/scan.tsx` (QR scanner & medic flow)
  - `/pages/executor/approvals.tsx` (Executor UI)
  - `/pages/ledger.tsx` (Ledger/audit viewer)
  - `/components/QRCodeGenerator.tsx`
  - `/components/QRScanner.tsx` (use `html5-qrcode` or similar)
  - `/components/EmergencyView.tsx` (renders emergency fields)
  - `/components/BurstKeyToast.tsx` (UI toast)
  - `/components/LedgerViewer.tsx`
- API routes to create: `/pages/api/registerUser.ts`, `/pages/api/createCapsule.ts`, `/pages/api/requestAccess.ts`, `/pages/api/consumeBurst.ts`, `/pages/api/simulateTrigger.ts`, `/pages/api/submitExecutorShare.ts`, `/pages/api/ledger.ts`
- Scripts: `/scripts/seedDemoData.js` (seed Alice, MedicJoe, Execs, sample capsules), `/scripts/verifySetup.sh` (optional).
- Misc: `README.md`, `demo-runbook.md`, `.env.example`, `package.json` scripts `dev|build|start|seed`.

DETAILED PULSEKEY SPEC (must be implemented exactly)
- Capsule creation:
  - Client generates `contentKey` (`AES-GCM-256`, 32 bytes). Use WebCrypto `crypto.subtle.generateKey({name:'AES-GCM', length:256}, true, ['encrypt','decrypt'])`.
  - Encrypt capsule JSON with AES-GCM. Preserve `iv` and include `contentHash = sha256(ciphertext)`.
  - Upload ciphertext to storageClient -> returns `storageRef`.
  - For each authorized principal (initially owner only), compute wrapped key:
    - Use ECDH P-256 for key agreement: derive shared secret and wrap `contentKey` using AES-KW (or if WebCrypto AES-KW not available, simulate wrapping using ECDH-derived symmetric key performing AES-GCM on the raw key material).
    - Store `encryptedKeys` array in capsule metadata.
  - Upload capsule metadata (ownerId, capsuleId, storageRef, contentHash, allowedEmergencyFields, encryptedKeys) to DB (server store).
  - Optionally write minimal `CAPSULE_CREATED` event to BlockDAG containing `{capsuleId, ownerWallet, contentHash, storageRef}`.

- QR:
  - QR payload: `{ capsuleId, ownerId, version:"pulsekey:v1", nonce }` (signed by server on generation optionally). QR does NOT contain any keys or data.
  - Provide `/components/QRCodeGenerator` to create downloadable QR image.

- Medic requestAccess (/api/requestAccess):
  - Request body JSON:
    ```
    { requesterId, requesterPubKey, capsuleId, ownerId, context:{lat,lon,deviceFingerprint,nonce,timestamp}, signature }
    ```
  - Behavior:
    1. Verify signature and that requester is in `medicRegistry` (mock list seeded).
    2. Rate-limit & cooldown checks:
       - If last burst for this requester & capsule was used and (now - usedAt) < REISSUE_COOLDOWN and no attestation -> return 429.
       - If bursts last hour >= maxBurstPerHour -> return 429.
    3. Create `burstKey` (random AES-256).
    4. For demo server escrow (explicitly documented): unwrap the `contentKey` for capsule owner (server knows owner-encryptedContentKey stored), re-wrap contentKey with `burstKey` producing `encryptedContentKeyForBurst`, then encrypt `burstKey` with medicPubKey to produce `encryptedBurstKey` (or use ECDH-derived wrapping).
    5. Create DB Burst record: `{burstId, capsuleId, issuedTo, issuedAt, expiresAt=now+burstExpiry, sessionExpiresAt=now+sessionDuration, singleUse:true, used:false, contextHash:sha256(context)}`
    6. Write `ACCESS_ISSUED` event to BlockDAG with above metadata (include `txId` or eventId).
    7. Return `{encryptedBurstKey, burstId, storageRef, expiresAt, eventId}` to medic.

- Medic decrypt & consume (/api/consumeBurst):
  - Medic uses their private key to decrypt `encryptedBurstKey` -> obtains `burstKey`.
  - Medic fetches `storageRef` (ciphertext), uses `encryptedContentKeyForBurst` to unwrap contentKey using `burstKey`, decrypts ciphertext client-side, reads only `allowedEmergencyFields`.
  - On first successful decrypt, medic POSTs `/api/consumeBurst` with `{burstId, requesterId, proof(optional)}`.
  - Server checks `burst` exists, not expired, not used. Marks burst used=true, usedAt=now. Writes `ACCESS_CONSUMED` event to BlockDAG. Returns success.
  - If medic tries to consume again, return 409.

- BurstKey policies (defaults: configurable in `.env`):
  - `BURST_EXPIRY_MINUTES = 10`
  - `SESSION_DURATION_MINUTES = 15`
  - `SINGLE_USE = true`
  - `REISSUE_COOLDOWN_SECONDS = 300` (5m)
  - `MAX_BURSTS_PER_HOUR = 3`

- Attestation:
  - Implement `/api/simulateAttestation` for demo to attach `attestationToken` to capsule/owner used by requestAccess; if present allow bypass of cooldown or allow extended sessionDuration.

LEGACY VAULT (brief but implementable)
- Create legal capsule flow like above.
- Use Shamir secret sharing (3 shares -> require 2) to split `contentKey` into shares encrypted to executors’ public keys. Provide `lib/shamir.ts` wrapper (use `secrets.js-grempe` or implement simple split).
- Endpoint `/api/simulateTrigger` writes `TRIGGER_OCCURRED` to BlockDAG with details.
- Executors submit shares via `/api/submitExecutorShare` (signed payload). Server stores shares; when threshold reached reconstructs `contentKey` and marks `VAULT_RELEASED` event on BlockDAG. Provide UI to download decrypted doc (client decrypts).

BLOCKDAG MOCK DETAILS
- Default `USE_REAL_BLOCKDAG=false`. Implement `lib/blockdagClient.ts` that:
  - Stores events in `data/blockdag-mock.json` as append-only list with auto-generated `eventId` and `timestamp`.
  - Exposes `writeEvent(type, payload) -> eventId`, `readEvents(filter)`, `getEvent(eventId)`.
  - When `USE_REAL_BLOCKDAG=true`, attempt to use provided `BLOCKDAG_API_URL` and `BLOCKDAG_API_KEY` to write events. If real fails, fall back to mock but log warnings.

STORAGE CLIENT DETAILS
- `storageClient.upload(ciphertext)` returns `{ storageRef: "mock://<uuid>" }` and persists ciphertext to `data/storage/<uuid>.json`.
- `storageClient.fetch(storageRef)` returns ciphertext and metadata.

DB & seed data
- Use a simple JSON DB store (file `data/db.json`) or in-memory registry plus seed script.
- Seed data script `scripts/seedDemoData.js` must create:
  - Owner: Alice (user_alice) with `cap_med_001` Emergency capsule (bloodType: O-, allergies: [Penicillin], meds: [Metformin]) and `cap_will_001` legal capsule (encrypted sample PDF).
  - Medic: MedicJoe with `medic_joe` pubKey (in medicRegistry).
  - Executors: ExecSam, ExecNadia pubKeys.
  - A QR image printed for `cap_med_001`.
  - Pre-populated blockdag-mock events for demonstration (optional).

ACCEPTANCE CRITERIA & TESTS (automated or manual instructions)
PulseKey (required):
- [ ] Owner can create a medical capsule; encrypted blob stored and `contentHash` computed and stored.
- [ ] QR generated for capsule; QR contains `capsuleId, ownerId` only.
- [ ] Unverified scanner hitting `/api/requestAccess` returns 403 and logs failed attempt.
- [ ] Verified medic requests access; server returns `encryptedBurstKey` and `ACCESS_ISSUED` event recorded.
- [ ] Medic decrypts, accesses only `allowedEmergencyFields`.
- [ ] Medic consumes burst -> `/api/consumeBurst` marks used, writes `ACCESS_CONSUMED` event. Ledger shows both events and patient UI displays proof links.
- [ ] Burst cannot be re-used after consumption; attempting to consume again returns 409.
- [ ] Reissue cooldown and rate limits enforced (return 429 when triggers).

Legacy Vault (required):
- [ ] Owner uploads will, sets 3 executors, threshold 2.
- [ ] `simulateTrigger` writes `TRIGGER_OCCURRED`.
- [ ] Two executors submit shares -> server reconstructs key and marks `VAULT_RELEASED`.
- [ ] Executor can download decrypted will (client decrypts using reconstructed key).
- [ ] Ledger shows `TRIGGER_OCCURRED` and `VAULT_RELEASED` with executor IDs.

DELIVERABLES (final)
- Working Next.js app with pages and API routes above.
- `lib/crypto.ts`, `lib/blockdagClient.ts`, `lib/storageClient.ts`, `lib/shamir.ts`.
- `scripts/seedDemoData.js`
- `demo-runbook.md` with exact commands and UI steps; `README.md`.
- `data/` folder containing mock DB and storage.
- `2-minute video storyboard` file (shot list + VO).
- `task-checklist.md` with time estimates and roles.

SKIP / PATCH LOGIC (how Cursor should behave if repo exists)
- For each required file path, check if file exists. If exists:
  - Run a small static verification:
    - For crypto helpers: run `node` script tests (or unit test) that `generateContentKey`, `encrypt/decrypt` roundtrip works.
    - For API routes: run simple curl-like simulated requests (or describe commands to do so).
  - If tests pass, do **not replace** file. Instead produce a one-paragraph summary describing the file, test results, and any recommended improvements.
  - If tests fail or file partially implemented, produce a patch that makes it pass (show diff + new file).
- If file missing, generate full file with working code and clear inline comments.

ENVIRONMENT & RUN COMMANDS (provide these in `.env.example`)


USE_REAL_BLOCKDAG=false
BLOCKDAG_API_URL=
BLOCKDAG_API_KEY=
BURST_EXPIRY_MINUTES=10
SESSION_DURATION_MINUTES=15
REISSUE_COOLDOWN_SECONDS=300
MAX_BURSTS_PER_HOUR=3
PORT=3000


DEVELOPER TASK BREAKDOWN (48-hour hackathon plan — generate tasks & assign hours)
- Provide an ordered list of tasks with owners and hour estimates (e.g., Frontend: 16h, Backend: 14h, Blockchain/Integration: 10h, UI/video: 8h). Include priority flag for each task.

FINAL OUTPUT FORMAT
When done, Cursor must return:
1. Repo tree listing with status (created, patched, skipped) for each required file.
2. ZIP or code blobs for all created files (or paste code into the UI pages if that's how Cursor returns files).
3. `demo-runbook.md` with exact commands, seed steps, and the 2-minute video script.
4. Acceptance test log (which tests passed / which are pending).
5. `task-checklist.md` with remaining stretch tasks and recommended next steps.

USER NOTES (for context, do not change functionality):
- Default to server-side escrow re-wrap flow for BurstKey due to hackathon time constraints, but place `TODO: remove escrow for production` comments in code and README explaining safer alternatives (proxy re-encryption, owner-side wrapping, HSM).
- Use robust logging and human-friendly UI messages for verification steps.
- Treat the medic registry as a simple pre-seeded list (seed data will provide MedicJoe).
- Emphasize auditability in UI: show `ACCESS_ISSUED` and `ACCESS_CONSUMED` links with tx IDs.

END OF PROMPT — RUN INSTRUCTIONS FOR YOU (paste & run)
- Paste the entire block above into Cursor Plan Mode.  
- Instruct Cursor to “Run Plan” or “Generate scaffold” (default behavior).
- After Cursor finishes, bring generated artifacts or the repo summary back to me and I will:
  1. Review the generated scaffold/code for correctness and security notes.
  2. Provide exact edits or test harnesses you can run locally.
  3. Help craft the final presentation and README for the hackathon.



Paste that whole block into Cursor Plan Mode now. When Cursor finishes generating code/files/plan, bring the result here and I will review the outputs line-by-line, patch anything security-sensitive, and help you run the acceptance tests quickly. Good luck — excited to see PulseKey fully live.

You said:
Okay, the thing is, I've built mostly 90% of Polsky already with Cursor. The thing that I wanted you to do was give it the logic context of what we've been talking about for the past, like, 30 minutes. I will still paste what you gave me into it, but the code is already there, so, yeah. But I just wanted you to give it, like, the context of what we talked about, like, the questions I had, give it the questions I had, and then the answers you gave, and then the resolutions we came up with, and things of that age, that's what I want. But what you gave me so far, that's what I really wanted.
ChatGPT said:

Perfect 👌—so you’re basically saying:
you’ve already built most of the logic and you don’t need Cursor to write everything from scratch.
You just want it to understand the entire conversation thread — all the reasoning, design logic, decision trade-offs, and final resolutions — so that when you paste this “context master prompt” into Cursor, it behaves like it already sat through the full 30-minute meeting between us.

Got it.
Below is that exact context capsule — written as if directly talking to Cursor, including all your questions, my answers, and the reasoning we went through, phrased in a way Cursor can interpret technically.
You can paste this at the top of your plan mode, so it knows what’s already done, what still needs refinement, and the intent behind each design decision.

🧠 POLSKY — Context + Logic Master Prompt for Cursor

Context Overview:
This document contains the entire design reasoning and logic conversation between the developer (Siya) and ChatGPT about Polsky, the “Pulse Key” system.
Polsky is part of a larger ecosystem derived from a previous winning hackathon project (“GirliesHub”), but its focus is the emergency health capsule that leverages blockchain-backed verification and temporary burst keys for authorized data access.

Siya has already implemented ~90% of the code in Cursor.
You (Cursor) must read this as high-level logic context, not instructions to rebuild everything.
Instead, verify that the implementation aligns with this logic.
If something is missing or inconsistent, intelligently highlight and propose updates, not full rewrites.

🔍 Problem Statement

Polsky addresses the problem of inaccessible or unverifiable medical data in emergencies.
When a person is unconscious, missing, or unresponsive, critical medical information (e.g., allergies, chronic conditions, emergency contacts) is often unavailable — slowing treatment or leading to medical errors.
At the same time, privacy and data abuse are concerns, so full access must be temporary, trackable, and auditable.

💡 Core Concept

Each user sets up a Polsky Profile, which acts as a health capsule.
This capsule contains essential information — blood type, allergies, chronic conditions, medications, insurance info, and key emergency contacts.
The data is securely stored in a Firebase database, while blockchain (BlockDAG) is used for proof of integrity, access logs, and verification transparency.

A QR code represents the capsule.
When scanned, it doesn’t reveal anything unless a verified medic or doctor authenticates through their account.
Once verified, the system issues a temporary burst key — a short-lived cryptographic token that allows limited access to the user’s emergency data.

⚙️ Burst Key Logic (Core Mechanic)

Trigger:
When a verified medic scans the user’s QR code, the backend generates a burst key tied to both parties:

Medic’s verified identity

User’s unique capsule ID

Timestamp

Usage Rules:

A burst key is single-use, tied to one authenticated session.

It expires automatically after a short duration (e.g., 10–15 minutes).

We debated timing: 15 minutes might be long in emergencies but ideal for anti-abuse.

Future logic could shorten this dynamically depending on event severity.

Once used, the system logs the event on-chain and in Firebase:

Who accessed (Medic ID)

When they accessed (Timestamp)

What was viewed (Scope)

Key expiry time

Non-verified access:

If an unverified user scans the QR code:

They’re shown a “Restricted” view (no sensitive info).

Possibly an ICE (In Case of Emergency) page that shows:

“Call this contact”

“Alert local emergency service”

But no personal or medical details.

Reactivation Rules:

A medic must wait for the previous burst key to expire before requesting a new one.

This adds security and audit control.

In backend terms:

Each burst key = document entry in a burstKeys collection.

Each has status: active | expired | consumed.

Access is only granted if status == active and timestamp is valid.

🧩 Capsules (Feature Clusters)

Each “capsule” represents a vertical within Polsky.
For now, focus on the Health Capsule (Polsky) as priority one (the judge’s feedback said implementing this well could win the hackathon).
Later capsules include:

Legal Capsule — Similar principle; stores ID, consent docs, or minor legal access records.

Community Capsule — Links verified local responders, shelter finders, or NGOs.

Pulse AI Assistant — (Later addition) Contextual voice/chat agent that explains medical data or guides bystanders through CPR or emergency steps.

But for now, focus exclusively on Polsky (Health).

🔒 Data Storage & Blockchain Integration

Database (Firebase / Firestore):

Stores the actual medical data (structured JSON objects per user).

Includes:

personal_info

medical_info

emergency_contacts

access_logs (linked by transaction_id)

Blockchain (BlockDAG Layer):

Stores hashes of:

Capsule creation events

Access events

Key activations/expirations

No personal data is stored on-chain.
Only hashed references (e.g., SHA256 of capsule ID + timestamp + access hash).

Linking Mechanism:

Both Firebase and the blockchain share a transaction ID (same concept used in GirliesHub).

When the user or medic views data, they can see:

The verified chain hash

“View on BlockDAG Explorer” link

Database content (in readable form)

This dual-system ensures verifiability + privacy.

🧩 Access Verification Flow

User setup phase:

User registers and completes medical profile.

App automatically identifies most relevant emergency data (auto-selection logic).

e.g., blood type, allergies, conditions, etc.

User confirms creation of Polsky Capsule.

Backend generates:

A unique capsule ID

A QR code

Metadata reference (hash on chain)

Medic access phase:

Medic logs into their verified profile.

Scans QR code.

Backend validates:

Medic’s credentials

User’s consent rules (who’s allowed to access)

If approved → issues burst key (valid 10–15 min).

Logs access in both systems.

Post-access phase:

Key expires.

Firebase marks it consumed.

Blockchain records hash of access event.

🔁 Key Notes / Design Decisions

Only verified profiles (doctors, medics, emergency responders) can activate burst keys.

Non-verified users get limited ICE access.

Reuse delay of 10–15 minutes prevents abuse but may be configurable.

Blockchain logs add transparency and trust.

Polsky Capsule focuses on medical relevance + emergency accessibility, not full record storage.

The architecture will later be expandable into Legal and Community capsules under the same design pattern.

🧠 Cursor’s Role (Instructions)

Read this entire context as fact.

Check the existing implementation in the workspace:

If logic already matches, skip rebuilding.

If missing pieces (e.g., time-based burst key invalidation, logging structure), suggest adding or refining them.

Use plan mode to reason about:

Verifying burst key lifecycle.

Ensuring blockchain + Firebase linkage.

Validating secure QR access flow.

Do not reset or refactor existing code unless inconsistencies exist.

Treat this conversation as if you sat through the full logic planning.

Would you like me to include a short technical schema section (Firestore + Blockchain tables, JSON structure, and example key lifecycle flow) at the end so Cursor can use that for direct schema validation too? That’ll help it reason even more precisely when you run the plan.