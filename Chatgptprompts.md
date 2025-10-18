heres the first Prompt it gave me: Nice — got it. You want a **true, exhaustive “master prompt”** for Cursor Plan Mode that contains *everything* from our whole conversation so Cursor can immediately generate a complete, prioritized, hackathon-ready plan + starter code/assets for the PulseKey-first EverGuard MVP (with Legacy Vault as the second priority). Below is a single, extremely detailed prompt you can paste directly into Cursor Plan Mode. It includes context, goals, exact tech choices, component/file structure, pseudo-smart contracts, crypto flows, API specs, sample data, UI/UX details, security & compliance checklist, 48-hour sprint plan, acceptance criteria, and the 2-minute demo storyboard/VO.

Paste the entire block below into Cursor Plan Mode. Don’t change anything unless you want to swap stack choices — I made specific tech choices to maximize speed and clarity for a hackathon.

---

**CURSOR PLAN MODE MASTER PROMPT — EVERGUARD (PULSEKEY FIRST, LEGACY VAULT SECOND)**

Context & high-level goal

```
You are Cursor. Build a complete, hackathon-ready plan + starter scaffold for a BlockDAG-powered secure data platform called **EverGuard** (MVP name for code: `pulsekey-vault`). The judges prioritized the emergency access feature (PulseKey) and the Digital Will / Legacy Vault. Your job is to produce the full plan and generate starter code scaffolding (frontend + backend + smart-contract pseudo + utility libs + mocks) that a team of 3–5 developers can use to implement a working MVP within ~48 hours.

This prompt contains full product context (from our chat), technical constraints, UX requirements, security requirements (NIST/ISO alignment goals at demo level), and deliverables. Prioritize PulseKey (emergency medical capsule flow) first. Legacy Vault (digital will / executor flow) is second priority. Everything else (GBV, community map, AI) is optional stretch.

Important behavioral rules for Cursor:
- Prioritize implementable, hackathon-level deliverables (something judges can demo and understand).
- Provide clear acceptance criteria for each feature and each task.
- Include sample data for demos.
- Provide code scaffolding for frontend (React + TypeScript + Next.js), backend (Node.js serverless functions / Next API routes), cryptography utilities (WebCrypto), a minimal BlockDAG client wrapper (with sandbox and mock modes), and pseudo-smart-contracts (BlockDAG contract-style pseudo-code).
- If BlockDAG sandbox APIs are unavailable in the environment, generate a **MockBlockDAG** service with identical interfaces and a visual ledger on the frontend for the demo.
- Keep everything self-contained for offline demos (i.e., mock or simulate external oracles for death verification, geofencing, and hospital attestations).
- Provide a 48-hour task breakdown with exact tasks, owners (roles), and time estimates.
- Provide a 2-minute demo storyboard, shot list, and exact voiceover lines.
- Provide README, deployment steps (Vercel for frontend, serverless functions), and commands to run locally.
```

Product summary & feature priorities

```
Product name: EverGuard (code: pulsekey-vault)
Core idea: One secure vault composed of encrypted **capsules** (Medical, Legal/Will, Financial, Education, Safety/GBV, Legacy messages). Access is granted via wallet/public-key-based identities and ephemeral BurstKeys with contextual constraints (time, geofence, single-use). All critical events are logged immutably on BlockDAG.

Hackathon MVP priorities (in this order):
1. PulseKey — Emergency Capsule emergency access flow (end-to-end demoable).
   - Create vault & medical capsule.
   - Issue QR/NFC reference (QR for speed).
   - Medic scans QR -> requests access -> server verifies medic wallet -> issues ephemeral BurstKey -> medic decrypts emergency capsule client-side -> BlockDAG logs access event -> BurstKey auto-expires & is single-use.
2. Legacy Vault — Digital Will & Executor flow (demoable).
   - Create legal capsule (will docs).
   - Configure executors (wallet addresses).
   - Simulate verified trigger (manual toggle + mock oracle) -> multi-sig approval -> release documents -> BlockDAG logs.
3. Compliance & Audit view (ledger viewer).
4. Optional stretch: AI Guardian assistant (chat-based actions), Community Map (shelters), GBV capsule features (hidden entry mode).

MVP constraints:
- Demo must be offline-friendly (use mocks). But include BlockDAG sandbox integration if team has access.
- Crypto must be client-first: symmetric encryption of capsule data on client, symmetric keys encrypted by public keys of approved parties.
- Use standard crypto algorithms implementable in Web Crypto: AES-GCM for symmetric data, ECDH (P-256) for key agreement, and Shamir Secret Sharing for multi-sig threshold examples (or simple Shamir lib).
```

Tech stack (explicit)

```
Frontend:
- Next.js + TypeScript (pages or app router fine)
- React + functional components + hooks
- Tailwind CSS for fast styling (or Chakra UI if preferred) — I chose Tailwind for rapid dev
- react-qr-scanner or html5-qrcode for QR scanning in browser
- WebCrypto APIs for client encryption/decryption
- Local IndexedDB for storing encrypted blobs when offline (idb-keyval)
- Mock BlockDAG ledger UI visualization component

Backend / Serverless:
- Next.js API routes (serverless) OR Node.js serverless functions deployed on Vercel
- Endpoints for: issueBurstKey, verifyMedic, uploadEncryptedCapsule (store metadata + link), simulateOracleTrigger
- Use dotenv config for keys/modes

Smart-Contract / BlockDAG:
- Provide pseudo-code for two contracts:
  1. `PulseKeyContract` for BurstKey issuance and logging
  2. `LegacyVaultContract` for will/executor rules and release
- Provide a BlockDAG client wrapper `blockdagClient` with methods: `writeEvent(eventType, payload)`, `readEvents(filter)`, `getTransaction(txId)` — both sandbox-mode (real API) and mock-mode (local DB).

Crypto & Key management:
- Client flow uses WebCrypto:
  - Generate symmetric content key per capsule: `AES-GCM-256` (random 256-bit)
  - Encrypt capsule content on client with AES-GCM → produce ciphertext + iv + tag
  - For each authorized actor (wallet/publicKey), encrypt the content key with their public key using ECDH + AES-KW (or use RSA-OAEP if environment supports)
  - For emergency ephemeral BurstKey: server generates a symmetric ephemeral key, encrypts it with medic’s public key for delivery, and logs a short-lived record on BlockDAG with expiry timestamp and contextual metadata (geofence, deviceId). BurstKey is single-use: once used to decrypt, server marks it consumed.
- Threshold (executor) flow:
  - For 2-of-3 executor threshold: use Shamir secret sharing to split the AES content key into 3 shares; smart contract stores commitment; when 2 shares are submitted (signed by executor keys), reconstruct symmetric key in client or via secure reconstruct function (demo via client-side reconstruction with shares provided by executors).

Storage:
- Encrypted capsule files stored in either:
  - IPFS (preferred for decentralized demo) — include fallback to S3-like mock (serverless store).
  - For hackathon speed, store encrypted JSON blobs in a simple server-side store (file or in-memory DB). Supply an `ipfsMock` implementation.

Devops:
- Deploy frontend on Vercel (Next.js)
- Serverless functions on Vercel functions
- Provide `npm` scripts: `dev`, `build`, `start`, `test`
```

Detailed functional flows (step-by-step, with data shapes)

```
I. Create Vault & Capsule (User Flow)
1. User registers (email + generate wallet keypair client-side OR connect wallet like MetaMask for demo).
   - Data: `userId`, `publicKey`, `walletAddress`, `name`, `phone`.
   - Store user metadata server-side, but never raw private keys (private keys stay client-side).
2. User creates a capsule: chooses type (medical/legal/financial...), enters data (structured JSON or file upload).
3. Client generates a `contentKey` (AES-GCM 256) and `iv`.
4. Client encrypts capsule JSON/file → ciphertext.
5. Client encrypts `contentKey` for each authorized principal (initially only user) using their public key (ECDH/AES-KW).
6. Client uploads:
   - `capsuleMetadata`: { capsuleId, ownerId, capsuleType, tags, hashOfCiphertext, storageRef }
   - `encryptedContentBlob`: ciphertext + iv (store in IPFS mock or server store).
   - `encryptedKeys`: list of { principalId, encryptedContentKey }
7. Frontend stores an on-device pointer (local index DB) to capsule for quick access.

Data shapes (example):
- Capsule metadata JSON:
```

{
capsuleId: "cap_0001",
ownerId: "user_abc",
type: "medical",
title: "Emergency Capsule",
createdAt: 2025-10-18T09:00:00Z,
storageRef: "ipfs://Qm...",
contentHash: "sha256:...",
encryptedKeys: [
{ principalId: "user_abc", encryptedKey: "base64..." }
]
}

```

II. PulseKey Emergency Access Flow (Medic)
1. Medic on their mobile device opens Medic App (simple mobile web).
2. Medic scans the patient’s QR code. QR contains `capsuleOwnerId` and `capsuleId` (NOT the raw data).
 - Example QR content: `{ ownerId: "user_abc", capsuleId: "cap_0001" , reference: "pulsekey:v1" }`
3. Medic app constructs access request and signs it with their medic wallet private key (demo: use local test wallet created in medic app).
4. Medic app calls backend endpoint: `POST /api/requestAccess` with:
```

{
requesterId: "medic_xyz",
requesterPubKey: "BLAH",
ownerId: "user_abc",
capsuleId: "cap_0001",
context: { location: {lat,lon}, deviceId, attestation: "ambulanceOnScene" }
}

```
5. Backend verifies request (demo: check medicPubKey against a pre-approved medic registry or mock verification).
6. If verified, backend creates an ephemeral `burstKey` (random AES 256) with metadata:
```

{
burstId: "burst_0001",
capsuleId: "cap_0001",
issuedTo: "medic_xyz",
expiresAt: NOW + 10 minutes,
singleUse: true,
contextConstraints: { geofence: {...}, deviceFingerprint: "..." }
}

```
7. Backend encrypts `burstKey` with medicPubKey -> `encryptedBurstKey`.
8. Write an `ACCESS_ISSUED` event to BlockDAG with payload: { burstId, capsuleId, ownerId, issuedTo, issuedAt, expiresAt, contextHash }.
9. Backend returns `encryptedBurstKey` and `storageRef` to medic app.
10. Medic app uses medic private key to decrypt `encryptedBurstKey` -> obtains `burstKey`.
11. Medic uses `burstKey` to fetch the encrypted capsule content (server provides ciphertext) and decrypts it client-side:
 - If the capsule’s ciphertext was encrypted by `contentKey` originally, there are two options for demo:
   A) Server-side: server wraps `contentKey` with `burstKey` (encryptedContentKeyForBurst) when issuing BurstKey — then medic decrypts encryptedContentKey -> then decrypts ciphertext.
   B) Client-side (preferred for demo): owner pre-stored an access policy where `burstKey` can be used to unwrap an ephemeral encrypted content key. For hackathon, implement server helper that returns `encryptedContentKeyForBurst` after issuing burst key.
12. Medic views limited fields (EmergencyCapsule UI shows only specified keys) — the UI should show a toggle to reveal more (only if policy allows).
13. After first successful decryption, backend marks `burstKey` as consumed. Any further attempts fail.
14. Write `ACCESS_CONSUMED` event to BlockDAG with who consumed, when, and hash of context (location).
15. BurstKey auto-expires at `expiresAt` if unused.

III. Legacy Vault Flow (Executor, Multi-sig)
1. Owner creates `legal` capsule with will documents and configures executors: `[exec1PubKey, exec2PubKey, exec3PubKey]` with threshold = 2.
2. System stores capsule as in Create flow. Additionally run Shamir to split `contentKey` into 3 shares stored encrypted with each executor’s public key (demo: store shares in server until reveal).
3. A verified trigger occurs: for demo use `POST /api/simulateTrigger` that writes `TRIGGER_OCCURRED` event to BlockDAG.
4. Each executor signs an `approveRelease` message and submits their share via `/api/submitShare`.
5. When threshold reached, server reconstructs `contentKey` and makes `encryptedContentKey` available to executors (or the reconstructed key is used to re-encrypt content for the requesting executor).
6. Log `VAULT_RELEASED` to BlockDAG and provide download link (encrypted at rest; client decrypts using reconstructed key).
7. Executor UI shows provenance: trigger verified, approvals, and ledger entries.

IV. Ledger / Compliance UI
- Provide a timeline viewer that reads events from BlockDAG (or MockBlockDAG) and renders them as an immutable sequence (eventType, actor, capsuleId, timestamp).
- Provide "Export compliance proof" that packages events and content hashes for offline audit.

V. Mockable external systems (for hackathon)
- BlockDAG Sandbox (if present): use real client; else MockBlockDAG that persists to local JSON and returns consistent tx ids.
- Medic registry: a simple list of approved medic public keys.
- Death/trigger oracle: manual UI toggle to simulate verified death.
- Geofence verification: simple lat/lon match demo.

```

API specification (endpoints & behaviors)

```
Base URL: `/api/*` (Next.js API routes)

1. POST /api/registerUser
   - Body: { name, email, walletPubKey } -> returns { userId, createdAt }
   - Client: stores local private key for demo (never send private key)

2. POST /api/createCapsule
   - Body: { ownerId, capsuleType, title, metadata, encryptedBlobRef, encryptedKeys[] }
   - Response: { capsuleId, storageRef, contentHash }

3. POST /api/requestAccess
   - Body (medic): { requesterId, requesterPubKey, ownerId, capsuleId, context }
   - Behavior: verifies requester -> creates burstKey -> encrypts burstKey to requesterPubKey -> writes `ACCESS_ISSUED` event to BlockDAG -> returns { encryptedBurstKey, burstId, storageRef, expiresAt }

4. POST /api/consumeBurst
   - Body: { burstId, requesterId, proofOfDecryptionAttempt }
   - Behavior: mark burst consumed, write `ACCESS_CONSUMED` event to BlockDAG.

5. POST /api/simulateTrigger
   - Body: { ownerId, triggerType: 'verifiedDeath'|'inactivity', details }
   - Behavior: writes `TRIGGER_OCCURRED` event to BlockDAG and notify executors (for demo produce UI notification)

6. POST /api/submitExecutorShare
   - Body: { executorId, capsuleId, shareEncrypted, signature }
   - Behavior: store share, if threshold reached reconstruct contentKey, write `VAULT_RELEASED`.

7. GET /api/capsule/:capsuleId
   - Response: { capsuleMetadata, storageRef } and optionally encrypted blob.

8. GET /api/ledger?ownerId=&capsuleId=&type=
   - Response: list of BlockDAG events (mock or real)

Security headers:
- For demo environment, use a simple JWT for authenticated API calls, but still require client to sign critical messages (e.g., medic signatures) for realism.

Errors & edge cases:
- Invalid medic -> return 403
- Burst expired -> 410
- Double-consume -> 409
- Share missing threshold -> 202 pending
```

BlockDAG contract pseudo-code & events

```
PulseKeyContract pseudo:

EVENT ACCESS_ISSUED(burstId, capsuleId, ownerId, issuedTo, issuedAt, expiresAt, contextHash)
EVENT ACCESS_CONSUMED(burstId, capsuleId, consumedBy, consumedAt, contextHash)
EVENT TRIGGER_OCCURRED(ownerId, triggerType, details, timestamp)
EVENT VAULT_RELEASED(capsuleId, ownerId, releasedTo, releasedAt)

FUNCTION issueBurstKey(capsuleId, issuedTo, expiresAt, contextHash) -> burstId
  - require(capsuleExists && issuerIsAuthorizedNode)
  - create event ACCESS_ISSUED(...)

FUNCTION markBurstConsumed(burstId, consumedBy, contextHash)
  - require(burstId exists && not consumed && now <= expiresAt)
  - create event ACCESS_CONSUMED(...)

FUNCTION submitExecutorApproval(capsuleId, executor, shareCommitment)
  - store shareCommitment
  - if threshold reached: create VAULT_RELEASED(...)

Notes:
- For hackathon, implement contract logic as pseudo-code and actual on-chain is optional depending on BlockDAG access. If BlockDAG SDK available, create minimal writes for events (store JSON with signatures).
```

Frontend component & file structure (exact)

```
Root: /pulsekey-vault
- /apps/web (Next.js app)
  - /pages
    - index.tsx (Landing / Dashboard)
    - /capsule/[id].tsx (Capsule detail)
    - /emergency/scan.tsx (QR scanner page)
    - /executor/approvals.tsx
    - /ledger.tsx
    - /api-demo.tsx (simulation panel for admin triggers)
  - /components
    - Header.tsx
    - CapsuleCard.tsx
    - CapsuleDetail.tsx
    - QRScanner.tsx
    - EmergencyView.tsx
    - BurstKeyToast.tsx
    - LedgerViewer.tsx
    - AIChatWidget.tsx (optional)
  - /lib
    - crypto.ts (WebCrypto helpers: generateContentKey(), encryptAESGCM(), decryptAESGCM(), deriveSharedSecretECDH(), wrapKey(), unwrapKey())
    - blockdagClient.ts (real + mock modes)
    - storageClient.ts (IPFS mock or server store wrappers)
    - shamir.ts (shamir helper or use `secrets.js-grempe` lib)
  - /pages/api
    - registerUser.ts
    - createCapsule.ts
    - requestAccess.ts
    - consumeBurst.ts
    - simulateTrigger.ts
    - submitShare.ts
    - ledger.ts
  - /styles (Tailwind config)
  - /public (images, QR examples)
- /scripts
  - seedDemoData.js (create sample user, sample capsule, sample medic)
- README.md
- package.json, tsconfig.json, .env.example

Component props specifics:
- CapsuleCard: { capsuleId, title, type, lastAccessed, thumbnail }
- CapsuleDetail: { capsuleId } -> fetch metadata -> render tabs (Overview, Permissions, History)
- QRScanner: emits { ownerId, capsuleId }
- EmergencyView: props { capsuleData, burstMeta } shows limited fields (configurable by capsule schema)
```

UI details & microcopy

```
Colors & type:
- Primary: #0B6B63 (teal)
- Accent: #FF6B6B (coral)
- Neutral bg: #F7F6F4
- Body font: Inter
- Headline: Poppins SemiBold

Microcopy examples:
- Emergency CTA: “Emergency — Show critical info”
- Burst toast: “BurstKey issued — expires in 09:59”
- Approve button: “Approve & Sign (2 of 3 required)”
- Ledger export: “Export Proof of Access”

UX behaviors:
- When medic scans QR, show animated “verifying medic” then “issuing BurstKey” micro-interaction.
- Limit displayed fields in Emergency view: [bloodType, allergies, currentMeds, allergiesSeverity, emergencyContactName, emergencyContactPhone]
- Provide a small “Why this is shared” note under Emergency capsule explaining least-privilege rationale.
```

Demo data (seed set)

```
Users:
1. Alice (owner)
   - userId: user_alice
   - name: Alice M.
   - walletPubKey: alicePub
   - emergencyContact: John Doe (john_phone)
2. Medic: MedicJoe
   - userId: medic_joe
   - walletPubKey: medicJoePub (listed in medic registry)
3. Executor1: ExecSam
4. Executor2: ExecNadia
Capsules:
- cap_med_001 (owner: user_alice) — Emergency capsule:
  - bloodType: "O-"
  - allergies: ["Penicillin"]
  - meds: ["Metformin"]
- cap_will_001 (owner: user_alice) — Legal capsule:
  - willDocument: samplePDF (encrypted)
Simulation events:
- Simulate 1: MedicJoe scans Alice's QR -> PulseKey flow
- Simulate 2: Manual trigger "verifiedDeath" for Alice -> Executor approval flow
```

Testing & acceptance criteria

```
Acceptance test checklist (must pass for hackathon demo):

PulseKey (Emergency)
- [ ] Create a user and an Emergency capsule with medical fields encrypted at client.
- [ ] Generate and display QR for that capsule owner.
- [ ] Medic scans QR and can request access.
- [ ] Backend verifies medic (from mock registry) and issues encrypted BurstKey.
- [ ] Medic decrypts BurstKey and correctly decrypts only the Emergency fields client-side.
- [ ] BurstKey is single-use and is marked consumed after first use.
- [ ] BlockDAG (or mock) logs `ACCESS_ISSUED` and `ACCESS_CONSUMED` with correct metadata. Ledger UI shows both events.

Legacy Vault (Digital Will)
- [ ] User uploads will document and configures 3 executors with threshold 2.
- [ ] Trigger simulation writes `TRIGGER_OCCURRED` event to BlockDAG.
- [ ] Two executors submit approvals/shares, server reconstructs contentKey, and the will document becomes available for download (encrypted at rest; client decrypts).
- [ ] Ledger shows `TRIGGER_OCCURRED` and `VAULT_RELEASED` events with signatures.

Compliance & UI
- [ ] Ledger viewer displays all events with timestamps and actor IDs.
- [ ] Export compliance proof produces a downloadable JSON containing event list and content hashes.
```

48-hour hackathon schedule & role tasks (practical)

```
Team composition (3–5):
- Frontend dev (2): UI + QR scanner + UI interactions + Tailwind styling
- Backend dev (1): Next API routes + BlockDAG mock + server logic for BurstKey issuance
- Blockchain / Integration dev (1): BlockDAG client wrapper, pseudo-contracts & ledger integration
- UI / Video & Demo (1): copy, slides, 2-min video edit, storyboarding

Day 1 (Saturday) — Core functionality (PulseKey)
- 09:00–10:30: Project setup + repo scaffold + seed data (All)
- 10:30–13:00: Implement capsule creation (frontend + api + crypto lib) — Frontend + Backend (Acceptance: create capsule encrypted and stored)
- 13:00–14:00: Lunch
- 14:00–17:00: Implement QR generation + QRScanner + requestAccess API + medic registry mock (Acceptance: medic can request access and backend returns encryptedBurstKey)
- 17:00–19:00: Implement burstKey consume flow + BlockDAG mock logging + ledger viewer (Acceptance: medic decrypts data; events logged)
- 19:00–20:00: Integration testing + fix blockers

Day 2 (Sunday) — Legacy Vault + polish + video
- 09:00–11:00: Implement Legacy vault create flow + Shamir shares + simulateTrigger (Acceptance: create will capsule)
- 11:00–13:00: Implement executor flow + reconstruct key + deliver decrypted document (Acceptance: 2-of-3 works)
- 13:00–14:00: Lunch
- 14:00–16:00: UI polish, error handling, ledger export, README
- 16:00–18:00: Record 2-minute demo video (use the storyboard below), final testing
- 18:00–19:00: Package README & slides & repo; final run-through

Deliverables at end of hackathon:
- Live demo link (Vercel) or local instructions
- README + demo script
- 2-minute video file
- Git repo with seeded demo data and working flows
```

2-minute video storyboard (scenes & voiceover)

```
Total length: 2:00

Scene 0 (0:00-0:05) Title
- Visual: logo + tagline
- VO: “EverGuard — Your life’s data. Protected when it matters.”

Scene 1 (0:05-0:30) Emergency (PulseKey)
- Visual: Car crash cut → paramedic arrives → scans wristband QR on victim
- On-screen: QR scan animation -> “Issuing BurstKey”
- Visual: Emergency capsule reveals allergies & blood type
- VO: “In an emergency, every second matters. PulseKey gives first responders immediate, limited access to life-saving information — and nothing more.”

Scene 2 (0:30-0:55) Quick share (Personal Vault)
- Visual: User sends ephemeral link to landlord or doctor -> shows self-destruct timer
- VO: “Share only what’s needed, for as long as it’s needed.”

Scene 3 (0:55-1:20) Legacy (Digital Will)
- Visual: Family gets a notification after verified trigger -> executor signs -> will unlocked
- On-screen ledger shows `TRIGGER_OCCURRED` and `VAULT_RELEASED`
- VO: “When it matters most, your wishes are honored — transparently and immutably.”

Scene 4 (1:20-1:45) Compliance & AI
- Visual: Ledger UI and AI assistant summarizing a capsule
- VO: “Every access is logged to a tamper-proof ledger, and our AI Guardian helps organize and safeguard your data.”

Scene 5 (1:45-2:00) Close & CTA
- Visual: tagline + team slate + contact
- VO: “EverGuard — built on BlockDAG. Protect life. Protect legacy.”

Shot notes:
- Keep UI shots close, zoom on interactions, use text overlays for event names (ACCESS_ISSUED, ACCESS_CONSUMED).
- Use lightweight background music; keep VO calm and confident.
```

Security, compliance & threat model (concise)

```
Security priorities for hackathon demo:
- Never transmit plaintext capsule content to server. Only encrypted blobs and encrypted content keys are managed server-side.
- Private keys remain client-side in demo. If using wallets (MetaMask), prefer signing flows.
- BurstKeys must be single-use, short-lived, and logged on BlockDAG.
- Implement simple protections for replay attacks: include `nonce` and `contextHash` in signed messages.
- Provide a minimal threat model doc in README: attacker goals, mitigations, known demo limitations.

NIST/ISO alignment (demo-level):
- Audit logging (immutable ledger events)
- Cryptographic controls (AES-GCM, ECDH)
- Access control (key-based, multi-sig for executors)
- Data minimization (capsules + least privilege)
- Notes: This is a demo-level compliance story. For production, an external audit & KMS + hardware security modules are required.
```

README skeleton (auto-generated)

```
README.md sections:
- Project Overview
- Demo Priorities & What to show judges
- Architecture Diagram (link)
- How it works (User flows)
- Running locally (commands)
- Seed data & how to simulate events
- API reference (endpoints)
- Security notes & limitations
- Future work
- Team & contact
```

Final instructions for Cursor

```
1. Generate the full project scaffold outlined above (files & folders), with functional placeholders for API routes, React pages, and crypto helpers. Where actual BlockDAG calls are required, implement a MockBlockDAG with a switch controlled by ENV var `USE_REAL_BLOCKDAG=false` defaulting to mock.
2. Implement working client-side encryption helpers using WebCrypto with clear exportable functions: `generateContentKey`, `encryptContent`, `decryptContent`, `wrapKeyForPrincipal`, `unwrapKeyForPrincipal`.
3. Implement the PulseKey flow end-to-end with demo seed data so a medic can scan a QR and view only emergency fields. Provide clear UI state transitions and ledger writes (to mock BlockDAG).
4. Implement the Legacy Vault executor threshold reconstruction flow using a Shamir library or a simulated share mechanism.
5. Provide `scripts/seedDemoData.js` to pre-populate the mock DB with Alice, MedicJoe, sample capsules, and QR images/links.
6. Provide a `docs/demo-script.md` containing step-by-step instructions of what to click and what to say during the hackathon demo, and the exact tests from the Acceptance Criteria to verify.
7. Generate the README.md from the skeleton above and a `/deployment.md` file with Vercel deploy steps and environment variables.
8. Export a small set of UI PNGs (dashboard, emergency scan, legacy executor) for quick slide insertion (low-res placeholders are fine).

IMPORTANT: Output format expectations:
- Provide the repo structure as a tree.
- Provide essential files with code (not just pseudocode) for: `lib/crypto.ts`, `pages/api/requestAccess.ts`, `pages/emergency/scan.tsx`, `components/EmergencyView.tsx`, `lib/blockdagClient.ts` (mock), `scripts/seedDemoData.js`, `README.md`.
- For heavy files (large UI CSS or long libs), provide concise, functional code with comments; do not leave TODOs for critical crypto or flow logic.
- At the end, output a task checklist with each task marked with estimated hours and the minimum acceptance test to pass.

If any external secret (e.g., BlockDAG API key) is required, create `.env.example` and use `USE_REAL_BLOCKDAG=false` as default for safe offline demo.

Once you finish generating the scaffold + tasks, produce a single consolidated `demo-runbook.md` that lists the exact commands to run locally, the steps to seed demo data, and the 2-minute script for the video, so a non-dev can follow it and run the demo.

That is all. Prioritize PulseKey first, Legacy Vault second, ledger & compliance third. Keep the output succinct but extremely detailed and actionable for a hackathon team.
```

---

Paste that entire block into Cursor Plan Mode. It contains the **complete context** from our conversation and precise actionable instructions.

When Cursor finishes, bring the generated files or the plan here and I’ll:

1. Review the scaffold for correctness and security.
2. Produce a **Cursor Plan Mode master prompt** for the exact "Plan -> Execute" steps in Cursor’s Plan mode if you want it to produce code automatically.
3. Help you refine the 2-minute video script and README for judges.

Want me to also produce the exact `seedDemoData.js` and `lib/crypto.ts` implementations right now in this chat (so you can copy them straight into Cursor or your editor)?










Heres the second prompt it gave me(i tried to get it ton hone in on the first feature): Nice — got it. You want a **true, exhaustive “master prompt”** for Cursor Plan Mode that contains *everything* from our whole conversation so Cursor can immediately generate a complete, prioritized, hackathon-ready plan + starter code/assets for the PulseKey-first EverGuard MVP (with Legacy Vault as the second priority). Below is a single, extremely detailed prompt you can paste directly into Cursor Plan Mode. It includes context, goals, exact tech choices, component/file structure, pseudo-smart contracts, crypto flows, API specs, sample data, UI/UX details, security & compliance checklist, 48-hour sprint plan, acceptance criteria, and the 2-minute demo storyboard/VO.

Paste the entire block below into Cursor Plan Mode. Don’t change anything unless you want to swap stack choices — I made specific tech choices to maximize speed and clarity for a hackathon.

---

**CURSOR PLAN MODE MASTER PROMPT — EVERGUARD (PULSEKEY FIRST, LEGACY VAULT SECOND)**

Context & high-level goal

```
You are Cursor. Build a complete, hackathon-ready plan + starter scaffold for a BlockDAG-powered secure data platform called **EverGuard** (MVP name for code: `pulsekey-vault`). The judges prioritized the emergency access feature (PulseKey) and the Digital Will / Legacy Vault. Your job is to produce the full plan and generate starter code scaffolding (frontend + backend + smart-contract pseudo + utility libs + mocks) that a team of 3–5 developers can use to implement a working MVP within ~48 hours.

This prompt contains full product context (from our chat), technical constraints, UX requirements, security requirements (NIST/ISO alignment goals at demo level), and deliverables. Prioritize PulseKey (emergency medical capsule flow) first. Legacy Vault (digital will / executor flow) is second priority. Everything else (GBV, community map, AI) is optional stretch.

Important behavioral rules for Cursor:
- Prioritize implementable, hackathon-level deliverables (something judges can demo and understand).
- Provide clear acceptance criteria for each feature and each task.
- Include sample data for demos.
- Provide code scaffolding for frontend (React + TypeScript + Next.js), backend (Node.js serverless functions / Next API routes), cryptography utilities (WebCrypto), a minimal BlockDAG client wrapper (with sandbox and mock modes), and pseudo-smart-contracts (BlockDAG contract-style pseudo-code).
- If BlockDAG sandbox APIs are unavailable in the environment, generate a **MockBlockDAG** service with identical interfaces and a visual ledger on the frontend for the demo.
- Keep everything self-contained for offline demos (i.e., mock or simulate external oracles for death verification, geofencing, and hospital attestations).
- Provide a 48-hour task breakdown with exact tasks, owners (roles), and time estimates.
- Provide a 2-minute demo storyboard, shot list, and exact voiceover lines.
- Provide README, deployment steps (Vercel for frontend, serverless functions), and commands to run locally.
```

Product summary & feature priorities

```
Product name: EverGuard (code: pulsekey-vault)
Core idea: One secure vault composed of encrypted **capsules** (Medical, Legal/Will, Financial, Education, Safety/GBV, Legacy messages). Access is granted via wallet/public-key-based identities and ephemeral BurstKeys with contextual constraints (time, geofence, single-use). All critical events are logged immutably on BlockDAG.

Hackathon MVP priorities (in this order):
1. PulseKey — Emergency Capsule emergency access flow (end-to-end demoable).
   - Create vault & medical capsule.
   - Issue QR/NFC reference (QR for speed).
   - Medic scans QR -> requests access -> server verifies medic wallet -> issues ephemeral BurstKey -> medic decrypts emergency capsule client-side -> BlockDAG logs access event -> BurstKey auto-expires & is single-use.
2. Legacy Vault — Digital Will & Executor flow (demoable).
   - Create legal capsule (will docs).
   - Configure executors (wallet addresses).
   - Simulate verified trigger (manual toggle + mock oracle) -> multi-sig approval -> release documents -> BlockDAG logs.
3. Compliance & Audit view (ledger viewer).
4. Optional stretch: AI Guardian assistant (chat-based actions), Community Map (shelters), GBV capsule features (hidden entry mode).

MVP constraints:
- Demo must be offline-friendly (use mocks). But include BlockDAG sandbox integration if team has access.
- Crypto must be client-first: symmetric encryption of capsule data on client, symmetric keys encrypted by public keys of approved parties.
- Use standard crypto algorithms implementable in Web Crypto: AES-GCM for symmetric data, ECDH (P-256) for key agreement, and Shamir Secret Sharing for multi-sig threshold examples (or simple Shamir lib).
```

Tech stack (explicit)

```
Frontend:
- Next.js + TypeScript (pages or app router fine)
- React + functional components + hooks
- Tailwind CSS for fast styling (or Chakra UI if preferred) — I chose Tailwind for rapid dev
- react-qr-scanner or html5-qrcode for QR scanning in browser
- WebCrypto APIs for client encryption/decryption
- Local IndexedDB for storing encrypted blobs when offline (idb-keyval)
- Mock BlockDAG ledger UI visualization component

Backend / Serverless:
- Next.js API routes (serverless) OR Node.js serverless functions deployed on Vercel
- Endpoints for: issueBurstKey, verifyMedic, uploadEncryptedCapsule (store metadata + link), simulateOracleTrigger
- Use dotenv config for keys/modes

Smart-Contract / BlockDAG:
- Provide pseudo-code for two contracts:
  1. `PulseKeyContract` for BurstKey issuance and logging
  2. `LegacyVaultContract` for will/executor rules and release
- Provide a BlockDAG client wrapper `blockdagClient` with methods: `writeEvent(eventType, payload)`, `readEvents(filter)`, `getTransaction(txId)` — both sandbox-mode (real API) and mock-mode (local DB).

Crypto & Key management:
- Client flow uses WebCrypto:
  - Generate symmetric content key per capsule: `AES-GCM-256` (random 256-bit)
  - Encrypt capsule content on client with AES-GCM → produce ciphertext + iv + tag
  - For each authorized actor (wallet/publicKey), encrypt the content key with their public key using ECDH + AES-KW (or use RSA-OAEP if environment supports)
  - For emergency ephemeral BurstKey: server generates a symmetric ephemeral key, encrypts it with medic’s public key for delivery, and logs a short-lived record on BlockDAG with expiry timestamp and contextual metadata (geofence, deviceId). BurstKey is single-use: once used to decrypt, server marks it consumed.
- Threshold (executor) flow:
  - For 2-of-3 executor threshold: use Shamir secret sharing to split the AES content key into 3 shares; smart contract stores commitment; when 2 shares are submitted (signed by executor keys), reconstruct symmetric key in client or via secure reconstruct function (demo via client-side reconstruction with shares provided by executors).

Storage:
- Encrypted capsule files stored in either:
  - IPFS (preferred for decentralized demo) — include fallback to S3-like mock (serverless store).
  - For hackathon speed, store encrypted JSON blobs in a simple server-side store (file or in-memory DB). Supply an `ipfsMock` implementation.

Devops:
- Deploy frontend on Vercel (Next.js)
- Serverless functions on Vercel functions
- Provide `npm` scripts: `dev`, `build`, `start`, `test`
```

Detailed functional flows (step-by-step, with data shapes)

```
I. Create Vault & Capsule (User Flow)
1. User registers (email + generate wallet keypair client-side OR connect wallet like MetaMask for demo).
   - Data: `userId`, `publicKey`, `walletAddress`, `name`, `phone`.
   - Store user metadata server-side, but never raw private keys (private keys stay client-side).
2. User creates a capsule: chooses type (medical/legal/financial...), enters data (structured JSON or file upload).
3. Client generates a `contentKey` (AES-GCM 256) and `iv`.
4. Client encrypts capsule JSON/file → ciphertext.
5. Client encrypts `contentKey` for each authorized principal (initially only user) using their public key (ECDH/AES-KW).
6. Client uploads:
   - `capsuleMetadata`: { capsuleId, ownerId, capsuleType, tags, hashOfCiphertext, storageRef }
   - `encryptedContentBlob`: ciphertext + iv (store in IPFS mock or server store).
   - `encryptedKeys`: list of { principalId, encryptedContentKey }
7. Frontend stores an on-device pointer (local index DB) to capsule for quick access.

Data shapes (example):
- Capsule metadata JSON:
```

{
capsuleId: "cap_0001",
ownerId: "user_abc",
type: "medical",
title: "Emergency Capsule",
createdAt: 2025-10-18T09:00:00Z,
storageRef: "ipfs://Qm...",
contentHash: "sha256:...",
encryptedKeys: [
{ principalId: "user_abc", encryptedKey: "base64..." }
]
}

```

II. PulseKey Emergency Access Flow (Medic)
1. Medic on their mobile device opens Medic App (simple mobile web).
2. Medic scans the patient’s QR code. QR contains `capsuleOwnerId` and `capsuleId` (NOT the raw data).
 - Example QR content: `{ ownerId: "user_abc", capsuleId: "cap_0001" , reference: "pulsekey:v1" }`
3. Medic app constructs access request and signs it with their medic wallet private key (demo: use local test wallet created in medic app).
4. Medic app calls backend endpoint: `POST /api/requestAccess` with:
```

{
requesterId: "medic_xyz",
requesterPubKey: "BLAH",
ownerId: "user_abc",
capsuleId: "cap_0001",
context: { location: {lat,lon}, deviceId, attestation: "ambulanceOnScene" }
}

```
5. Backend verifies request (demo: check medicPubKey against a pre-approved medic registry or mock verification).
6. If verified, backend creates an ephemeral `burstKey` (random AES 256) with metadata:
```

{
burstId: "burst_0001",
capsuleId: "cap_0001",
issuedTo: "medic_xyz",
expiresAt: NOW + 10 minutes,
singleUse: true,
contextConstraints: { geofence: {...}, deviceFingerprint: "..." }
}

```
7. Backend encrypts `burstKey` with medicPubKey -> `encryptedBurstKey`.
8. Write an `ACCESS_ISSUED` event to BlockDAG with payload: { burstId, capsuleId, ownerId, issuedTo, issuedAt, expiresAt, contextHash }.
9. Backend returns `encryptedBurstKey` and `storageRef` to medic app.
10. Medic app uses medic private key to decrypt `encryptedBurstKey` -> obtains `burstKey`.
11. Medic uses `burstKey` to fetch the encrypted capsule content (server provides ciphertext) and decrypts it client-side:
 - If the capsule’s ciphertext was encrypted by `contentKey` originally, there are two options for demo:
   A) Server-side: server wraps `contentKey` with `burstKey` (encryptedContentKeyForBurst) when issuing BurstKey — then medic decrypts encryptedContentKey -> then decrypts ciphertext.
   B) Client-side (preferred for demo): owner pre-stored an access policy where `burstKey` can be used to unwrap an ephemeral encrypted content key. For hackathon, implement server helper that returns `encryptedContentKeyForBurst` after issuing burst key.
12. Medic views limited fields (EmergencyCapsule UI shows only specified keys) — the UI should show a toggle to reveal more (only if policy allows).
13. After first successful decryption, backend marks `burstKey` as consumed. Any further attempts fail.
14. Write `ACCESS_CONSUMED` event to BlockDAG with who consumed, when, and hash of context (location).
15. BurstKey auto-expires at `expiresAt` if unused.

III. Legacy Vault Flow (Executor, Multi-sig)
1. Owner creates `legal` capsule with will documents and configures executors: `[exec1PubKey, exec2PubKey, exec3PubKey]` with threshold = 2.
2. System stores capsule as in Create flow. Additionally run Shamir to split `contentKey` into 3 shares stored encrypted with each executor’s public key (demo: store shares in server until reveal).
3. A verified trigger occurs: for demo use `POST /api/simulateTrigger` that writes `TRIGGER_OCCURRED` event to BlockDAG.
4. Each executor signs an `approveRelease` message and submits their share via `/api/submitShare`.
5. When threshold reached, server reconstructs `contentKey` and makes `encryptedContentKey` available to executors (or the reconstructed key is used to re-encrypt content for the requesting executor).
6. Log `VAULT_RELEASED` to BlockDAG and provide download link (encrypted at rest; client decrypts using reconstructed key).
7. Executor UI shows provenance: trigger verified, approvals, and ledger entries.

IV. Ledger / Compliance UI
- Provide a timeline viewer that reads events from BlockDAG (or MockBlockDAG) and renders them as an immutable sequence (eventType, actor, capsuleId, timestamp).
- Provide "Export compliance proof" that packages events and content hashes for offline audit.

V. Mockable external systems (for hackathon)
- BlockDAG Sandbox (if present): use real client; else MockBlockDAG that persists to local JSON and returns consistent tx ids.
- Medic registry: a simple list of approved medic public keys.
- Death/trigger oracle: manual UI toggle to simulate verified death.
- Geofence verification: simple lat/lon match demo.

```

API specification (endpoints & behaviors)

```
Base URL: `/api/*` (Next.js API routes)

1. POST /api/registerUser
   - Body: { name, email, walletPubKey } -> returns { userId, createdAt }
   - Client: stores local private key for demo (never send private key)

2. POST /api/createCapsule
   - Body: { ownerId, capsuleType, title, metadata, encryptedBlobRef, encryptedKeys[] }
   - Response: { capsuleId, storageRef, contentHash }

3. POST /api/requestAccess
   - Body (medic): { requesterId, requesterPubKey, ownerId, capsuleId, context }
   - Behavior: verifies requester -> creates burstKey -> encrypts burstKey to requesterPubKey -> writes `ACCESS_ISSUED` event to BlockDAG -> returns { encryptedBurstKey, burstId, storageRef, expiresAt }

4. POST /api/consumeBurst
   - Body: { burstId, requesterId, proofOfDecryptionAttempt }
   - Behavior: mark burst consumed, write `ACCESS_CONSUMED` event to BlockDAG.

5. POST /api/simulateTrigger
   - Body: { ownerId, triggerType: 'verifiedDeath'|'inactivity', details }
   - Behavior: writes `TRIGGER_OCCURRED` event to BlockDAG and notify executors (for demo produce UI notification)

6. POST /api/submitExecutorShare
   - Body: { executorId, capsuleId, shareEncrypted, signature }
   - Behavior: store share, if threshold reached reconstruct contentKey, write `VAULT_RELEASED`.

7. GET /api/capsule/:capsuleId
   - Response: { capsuleMetadata, storageRef } and optionally encrypted blob.

8. GET /api/ledger?ownerId=&capsuleId=&type=
   - Response: list of BlockDAG events (mock or real)

Security headers:
- For demo environment, use a simple JWT for authenticated API calls, but still require client to sign critical messages (e.g., medic signatures) for realism.

Errors & edge cases:
- Invalid medic -> return 403
- Burst expired -> 410
- Double-consume -> 409
- Share missing threshold -> 202 pending
```

BlockDAG contract pseudo-code & events

```
PulseKeyContract pseudo:

EVENT ACCESS_ISSUED(burstId, capsuleId, ownerId, issuedTo, issuedAt, expiresAt, contextHash)
EVENT ACCESS_CONSUMED(burstId, capsuleId, consumedBy, consumedAt, contextHash)
EVENT TRIGGER_OCCURRED(ownerId, triggerType, details, timestamp)
EVENT VAULT_RELEASED(capsuleId, ownerId, releasedTo, releasedAt)

FUNCTION issueBurstKey(capsuleId, issuedTo, expiresAt, contextHash) -> burstId
  - require(capsuleExists && issuerIsAuthorizedNode)
  - create event ACCESS_ISSUED(...)

FUNCTION markBurstConsumed(burstId, consumedBy, contextHash)
  - require(burstId exists && not consumed && now <= expiresAt)
  - create event ACCESS_CONSUMED(...)

FUNCTION submitExecutorApproval(capsuleId, executor, shareCommitment)
  - store shareCommitment
  - if threshold reached: create VAULT_RELEASED(...)

Notes:
- For hackathon, implement contract logic as pseudo-code and actual on-chain is optional depending on BlockDAG access. If BlockDAG SDK available, create minimal writes for events (store JSON with signatures).
```

Frontend component & file structure (exact)

```
Root: /pulsekey-vault
- /apps/web (Next.js app)
  - /pages
    - index.tsx (Landing / Dashboard)
    - /capsule/[id].tsx (Capsule detail)
    - /emergency/scan.tsx (QR scanner page)
    - /executor/approvals.tsx
    - /ledger.tsx
    - /api-demo.tsx (simulation panel for admin triggers)
  - /components
    - Header.tsx
    - CapsuleCard.tsx
    - CapsuleDetail.tsx
    - QRScanner.tsx
    - EmergencyView.tsx
    - BurstKeyToast.tsx
    - LedgerViewer.tsx
    - AIChatWidget.tsx (optional)
  - /lib
    - crypto.ts (WebCrypto helpers: generateContentKey(), encryptAESGCM(), decryptAESGCM(), deriveSharedSecretECDH(), wrapKey(), unwrapKey())
    - blockdagClient.ts (real + mock modes)
    - storageClient.ts (IPFS mock or server store wrappers)
    - shamir.ts (shamir helper or use `secrets.js-grempe` lib)
  - /pages/api
    - registerUser.ts
    - createCapsule.ts
    - requestAccess.ts
    - consumeBurst.ts
    - simulateTrigger.ts
    - submitShare.ts
    - ledger.ts
  - /styles (Tailwind config)
  - /public (images, QR examples)
- /scripts
  - seedDemoData.js (create sample user, sample capsule, sample medic)
- README.md
- package.json, tsconfig.json, .env.example

Component props specifics:
- CapsuleCard: { capsuleId, title, type, lastAccessed, thumbnail }
- CapsuleDetail: { capsuleId } -> fetch metadata -> render tabs (Overview, Permissions, History)
- QRScanner: emits { ownerId, capsuleId }
- EmergencyView: props { capsuleData, burstMeta } shows limited fields (configurable by capsule schema)
```

UI details & microcopy

```
Colors & type:
- Primary: #0B6B63 (teal)
- Accent: #FF6B6B (coral)
- Neutral bg: #F7F6F4
- Body font: Inter
- Headline: Poppins SemiBold

Microcopy examples:
- Emergency CTA: “Emergency — Show critical info”
- Burst toast: “BurstKey issued — expires in 09:59”
- Approve button: “Approve & Sign (2 of 3 required)”
- Ledger export: “Export Proof of Access”

UX behaviors:
- When medic scans QR, show animated “verifying medic” then “issuing BurstKey” micro-interaction.
- Limit displayed fields in Emergency view: [bloodType, allergies, currentMeds, allergiesSeverity, emergencyContactName, emergencyContactPhone]
- Provide a small “Why this is shared” note under Emergency capsule explaining least-privilege rationale.
```

Demo data (seed set)

```
Users:
1. Alice (owner)
   - userId: user_alice
   - name: Alice M.
   - walletPubKey: alicePub
   - emergencyContact: John Doe (john_phone)
2. Medic: MedicJoe
   - userId: medic_joe
   - walletPubKey: medicJoePub (listed in medic registry)
3. Executor1: ExecSam
4. Executor2: ExecNadia
Capsules:
- cap_med_001 (owner: user_alice) — Emergency capsule:
  - bloodType: "O-"
  - allergies: ["Penicillin"]
  - meds: ["Metformin"]
- cap_will_001 (owner: user_alice) — Legal capsule:
  - willDocument: samplePDF (encrypted)
Simulation events:
- Simulate 1: MedicJoe scans Alice's QR -> PulseKey flow
- Simulate 2: Manual trigger "verifiedDeath" for Alice -> Executor approval flow
```

Testing & acceptance criteria

```
Acceptance test checklist (must pass for hackathon demo):

PulseKey (Emergency)
- [ ] Create a user and an Emergency capsule with medical fields encrypted at client.
- [ ] Generate and display QR for that capsule owner.
- [ ] Medic scans QR and can request access.
- [ ] Backend verifies medic (from mock registry) and issues encrypted BurstKey.
- [ ] Medic decrypts BurstKey and correctly decrypts only the Emergency fields client-side.
- [ ] BurstKey is single-use and is marked consumed after first use.
- [ ] BlockDAG (or mock) logs `ACCESS_ISSUED` and `ACCESS_CONSUMED` with correct metadata. Ledger UI shows both events.

Legacy Vault (Digital Will)
- [ ] User uploads will document and configures 3 executors with threshold 2.
- [ ] Trigger simulation writes `TRIGGER_OCCURRED` event to BlockDAG.
- [ ] Two executors submit approvals/shares, server reconstructs contentKey, and the will document becomes available for download (encrypted at rest; client decrypts).
- [ ] Ledger shows `TRIGGER_OCCURRED` and `VAULT_RELEASED` events with signatures.

Compliance & UI
- [ ] Ledger viewer displays all events with timestamps and actor IDs.
- [ ] Export compliance proof produces a downloadable JSON containing event list and content hashes.
```

48-hour hackathon schedule & role tasks (practical)

```
Team composition (3–5):
- Frontend dev (2): UI + QR scanner + UI interactions + Tailwind styling
- Backend dev (1): Next API routes + BlockDAG mock + server logic for BurstKey issuance
- Blockchain / Integration dev (1): BlockDAG client wrapper, pseudo-contracts & ledger integration
- UI / Video & Demo (1): copy, slides, 2-min video edit, storyboarding

Day 1 (Saturday) — Core functionality (PulseKey)
- 09:00–10:30: Project setup + repo scaffold + seed data (All)
- 10:30–13:00: Implement capsule creation (frontend + api + crypto lib) — Frontend + Backend (Acceptance: create capsule encrypted and stored)
- 13:00–14:00: Lunch
- 14:00–17:00: Implement QR generation + QRScanner + requestAccess API + medic registry mock (Acceptance: medic can request access and backend returns encryptedBurstKey)
- 17:00–19:00: Implement burstKey consume flow + BlockDAG mock logging + ledger viewer (Acceptance: medic decrypts data; events logged)
- 19:00–20:00: Integration testing + fix blockers

Day 2 (Sunday) — Legacy Vault + polish + video
- 09:00–11:00: Implement Legacy vault create flow + Shamir shares + simulateTrigger (Acceptance: create will capsule)
- 11:00–13:00: Implement executor flow + reconstruct key + deliver decrypted document (Acceptance: 2-of-3 works)
- 13:00–14:00: Lunch
- 14:00–16:00: UI polish, error handling, ledger export, README
- 16:00–18:00: Record 2-minute demo video (use the storyboard below), final testing
- 18:00–19:00: Package README & slides & repo; final run-through

Deliverables at end of hackathon:
- Live demo link (Vercel) or local instructions
- README + demo script
- 2-minute video file
- Git repo with seeded demo data and working flows
```

2-minute video storyboard (scenes & voiceover)

```
Total length: 2:00

Scene 0 (0:00-0:05) Title
- Visual: logo + tagline
- VO: “EverGuard — Your life’s data. Protected when it matters.”

Scene 1 (0:05-0:30) Emergency (PulseKey)
- Visual: Car crash cut → paramedic arrives → scans wristband QR on victim
- On-screen: QR scan animation -> “Issuing BurstKey”
- Visual: Emergency capsule reveals allergies & blood type
- VO: “In an emergency, every second matters. PulseKey gives first responders immediate, limited access to life-saving information — and nothing more.”

Scene 2 (0:30-0:55) Quick share (Personal Vault)
- Visual: User sends ephemeral link to landlord or doctor -> shows self-destruct timer
- VO: “Share only what’s needed, for as long as it’s needed.”

Scene 3 (0:55-1:20) Legacy (Digital Will)
- Visual: Family gets a notification after verified trigger -> executor signs -> will unlocked
- On-screen ledger shows `TRIGGER_OCCURRED` and `VAULT_RELEASED`
- VO: “When it matters most, your wishes are honored — transparently and immutably.”

Scene 4 (1:20-1:45) Compliance & AI
- Visual: Ledger UI and AI assistant summarizing a capsule
- VO: “Every access is logged to a tamper-proof ledger, and our AI Guardian helps organize and safeguard your data.”

Scene 5 (1:45-2:00) Close & CTA
- Visual: tagline + team slate + contact
- VO: “EverGuard — built on BlockDAG. Protect life. Protect legacy.”

Shot notes:
- Keep UI shots close, zoom on interactions, use text overlays for event names (ACCESS_ISSUED, ACCESS_CONSUMED).
- Use lightweight background music; keep VO calm and confident.
```

Security, compliance & threat model (concise)

```
Security priorities for hackathon demo:
- Never transmit plaintext capsule content to server. Only encrypted blobs and encrypted content keys are managed server-side.
- Private keys remain client-side in demo. If using wallets (MetaMask), prefer signing flows.
- BurstKeys must be single-use, short-lived, and logged on BlockDAG.
- Implement simple protections for replay attacks: include `nonce` and `contextHash` in signed messages.
- Provide a minimal threat model doc in README: attacker goals, mitigations, known demo limitations.

NIST/ISO alignment (demo-level):
- Audit logging (immutable ledger events)
- Cryptographic controls (AES-GCM, ECDH)
- Access control (key-based, multi-sig for executors)
- Data minimization (capsules + least privilege)
- Notes: This is a demo-level compliance story. For production, an external audit & KMS + hardware security modules are required.
```

README skeleton (auto-generated)

```
README.md sections:
- Project Overview
- Demo Priorities & What to show judges
- Architecture Diagram (link)
- How it works (User flows)
- Running locally (commands)
- Seed data & how to simulate events
- API reference (endpoints)
- Security notes & limitations
- Future work
- Team & contact
```

Final instructions for Cursor

```
1. Generate the full project scaffold outlined above (files & folders), with functional placeholders for API routes, React pages, and crypto helpers. Where actual BlockDAG calls are required, implement a MockBlockDAG with a switch controlled by ENV var `USE_REAL_BLOCKDAG=false` defaulting to mock.
2. Implement working client-side encryption helpers using WebCrypto with clear exportable functions: `generateContentKey`, `encryptContent`, `decryptContent`, `wrapKeyForPrincipal`, `unwrapKeyForPrincipal`.
3. Implement the PulseKey flow end-to-end with demo seed data so a medic can scan a QR and view only emergency fields. Provide clear UI state transitions and ledger writes (to mock BlockDAG).
4. Implement the Legacy Vault executor threshold reconstruction flow using a Shamir library or a simulated share mechanism.
5. Provide `scripts/seedDemoData.js` to pre-populate the mock DB with Alice, MedicJoe, sample capsules, and QR images/links.
6. Provide a `docs/demo-script.md` containing step-by-step instructions of what to click and what to say during the hackathon demo, and the exact tests from the Acceptance Criteria to verify.
7. Generate the README.md from the skeleton above and a `/deployment.md` file with Vercel deploy steps and environment variables.
8. Export a small set of UI PNGs (dashboard, emergency scan, legacy executor) for quick slide insertion (low-res placeholders are fine).

IMPORTANT: Output format expectations:
- Provide the repo structure as a tree.
- Provide essential files with code (not just pseudocode) for: `lib/crypto.ts`, `pages/api/requestAccess.ts`, `pages/emergency/scan.tsx`, `components/EmergencyView.tsx`, `lib/blockdagClient.ts` (mock), `scripts/seedDemoData.js`, `README.md`.
- For heavy files (large UI CSS or long libs), provide concise, functional code with comments; do not leave TODOs for critical crypto or flow logic.
- At the end, output a task checklist with each task marked with estimated hours and the minimum acceptance test to pass.

If any external secret (e.g., BlockDAG API key) is required, create `.env.example` and use `USE_REAL_BLOCKDAG=false` as default for safe offline demo.

Once you finish generating the scaffold + tasks, produce a single consolidated `demo-runbook.md` that lists the exact commands to run locally, the steps to seed demo data, and the 2-minute script for the video, so a non-dev can follow it and run the demo.

That is all. Prioritize PulseKey first, Legacy Vault second, ledger & compliance third. Keep the output succinct but extremely detailed and actionable for a hackathon team.
```

---

Paste that entire block into Cursor Plan Mode. It contains the **complete context** from our conversation and precise actionable instructions.

When Cursor finishes, bring the generated files or the plan here and I’ll:

1. Review the scaffold for correctness and security.
2. Produce a **Cursor Plan Mode master prompt** for the exact "Plan -> Execute" steps in Cursor’s Plan mode if you want it to produce code automatically.
3. Help you refine the 2-minute video script and README for judges.

Want me to also produce the exact `seedDemoData.js` and `lib/crypto.ts` implementations right now in this chat (so you can copy them straight into Cursor or your editor)?
 
