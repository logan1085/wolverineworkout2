# Verified website ↔ Photon pairing

Status: implementation design only. No pairing endpoint, shared memory access, migration, or new credential is enabled. Account-service recovery remains the prerequisite documented in PHOTON_SETUP.md.

## Intended experience

1. A signed-in runner opens Connections → Text Pip. Explain exactly which app context will become available to the text agent: their saved race goal, current training and explicitly enabled memories. Existing local-only data is not uploaded by pairing.
2. The runner chooses “Link my phone.” Create a short-lived, single-use challenge tied to the verified account and this linking attempt. Show the configured Photon line and a copyable `LINK <code>` command. No phone number is requested in the browser.
3. A signed one-to-one Photon event from an allowlisted sender redeems the challenge atomically. START consent is still required. LINK commands must never reach OpenAI or enter conversation history. Redemption creates a pending association only; it does not grant access to web context.
4. The signed-in browser displays the pending sender masked to its last four digits and asks the runner to confirm that it is their phone. The phone receives confirmation instructions, but no web profile details.
5. Browser confirmation atomically consumes the pending association and activates the scoped grant. Return the linked status only after database success. The next opted-in text may read the allowed context; it cannot edit a plan or activity.
6. Connections offers “Unlink phone.” STOP on the phone immediately revokes the shared-context grant as well as existing text consent and history. START alone does not restore a revoked link. RESET clears the text history but explicitly explains whether the account link remains. Clear separate controls and wording are required for forgetting app memory versus removing the phone link.

## Identity and storage boundaries

- Require `healthIdentity` with `local === false` and same-origin mutation checks for all browser pairing actions. A local preview identity, user ID in a request body, or sender allowlist membership cannot authorize account access.
- Identify the sender using the verified adapter author, transport project and one-to-one conversation. Do not accept phone identifiers from message text or client JSON.
- Store a keyed digest of canonical sender identity for lookup; keep a masked label for UI. Never log raw sender IDs, codes or health context. Challenge material must be cryptographically random, hashed at rest and expire after ten minutes.
- Bind every challenge to its account and attempt. Limit account creation and sender redemption attempts. Use atomic compare-and-consume operations: expired, reused, canceled and concurrently redeemed codes must fail without revealing account existence.
- Enforce one active account per sender per Photon project and one active sender per account for this pilot. Replacing either requires an explicit unlink; no implicit overwrite or transfer.
- Browser APIs use the authenticated account's row-level permissions. The webhook needs a narrowly scoped server-side context read that resolves the active grant itself. Never expose an unrestricted user-ID lookup to the browser or infer the owner's identity globally.
- Do not introduce a service-role credential simply to bypass failed authentication. Credential provisioning and migration application require the existing account decision and any applicable approval.

## Context and revocation

The initial integration is read-only context sharing. Reuse validated health/memory models and the web context builder; never concatenate raw database JSON into the system prompt. Honor memory enabled/disabled state, expiry, deletion and context budget. Exclude unrelated account data, raw provider credentials, older conversations and private sender identifiers. Text turns stay in the existing seven-day Redis history; they are not silently imported into web memory. Saving a new durable fact remains a separate explicit product decision.

Resolve an active grant for every model call. After generation, recheck grant version and consent before delivering any answer that used shared context. Unlink, STOP, account deletion or grant expiry must invalidate both new reads and undelivered context-bearing replies. Serialize these transitions with message processing; a database outage must fail closed for context access. If using text-only fallback, tell the runner the app context could not be loaded rather than imply it was used.

## Required acceptance before activation

- Two real accounts and two test senders: cross-account read, challenge substitution, redemption races, code replay/expiry, unsupported groups and spoofed sender inputs are rejected.
- A valid phone redemption cannot access app records before browser confirmation; browser confirmation cannot activate a different account's challenge.
- Browser cancel, account switch, sign-out and stale confirmation cannot accidentally complete pairing.
- START is required independently; LINK never consumes model quota or reaches model/history/logs.
- STOP/unlink during a delayed model request prevents delivery of an answer containing revoked app context; START does not re-link.
- Disabled/expired/deleted memory is excluded immediately. Account deletion removes active grants and pending challenges without relying solely on Redis expiry.
- Storage/provider failure produces a retryable state without false success, silent reassignment or duplicated grants.
- Signed webhook and database integration tests complement unit tests; a phone and signed-in browser walkthrough must prove the full flow before enabling it in production.

## Implementation sequence

Restore and verify the chosen Supabase project and current migrations first. Then add RLS-protected challenge/grant storage and atomic functions, authenticated Connections APIs, reserved Photon commands, the confirmation UI, and the scoped read-only context adapter. Test with two accounts before enabling the feature flag. Update public MEMORY.md and Photon consent/help text to describe the actual new sharing boundary at activation, not before.
