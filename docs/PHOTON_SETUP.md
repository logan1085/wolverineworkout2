# Text Pip through Photon

Status: implementation prepared; not activated or end-to-end verified. No Photon account, line, or Redis store has been provisioned by this change. No texts have been sent.

## Activation

1. Owner completes account creation at https://app.photon.codes/ (new password and provider terms are owner actions). Choose an iMessage project/line; check pricing before purchasing anything.
2. Configure these server-only Vercel variables securely, never in chat or Git:
   - `IMESSAGE_PROJECT_ID`
   - `IMESSAGE_PROJECT_SECRET`
   - `IMESSAGE_WEBHOOK_SECRET` from the registered webhook
   - `PHOTON_REDIS_URL` for an approved TLS Redis store
   - `PHOTON_ALLOWED_SENDERS`: comma-separated exact iMessage sender IDs, normally E.164 phone numbers. Empty means no access.
   - Existing `OPENAI_API_KEY` and optional `OPENAI_HEALTH_MODEL` are reused.
3. Register `https://wolverineworkout2.vercel.app/api/photon/webhook` in the Photon project's Webhook tab. Use one messaging line initially. Redeploy after setting variables.
4. Text the assigned line. Confirm the opt-in explanation, reply START, then send a non-sensitive test such as “Hello Pip.” Confirm exactly one answer and a follow-up that uses the prior text. Test STOP, RESET, and restarting after a deployment.

Requires Node 22. Missing configuration returns 503; nothing is silently connected. No new credential values belong in this document.

## Behavior

- Signed, fresh incoming one-to-one iMessage text events only; exact sender allowlist. Group messages, outbound messages, attachments, reactions, and unknown events ignored.
- Same Wolverine system prompt, with short plain-text channel instructions. OpenAI receives only recent opted-in text conversation, not the sender phone number or website records.
- START opts in. STOP revokes consent and clears Wolverine conversation history. RESET clears history while preserving consent. HELP shows processing/retention details. Clearing does not erase provider records or messages on the phone.
- Up to 12 recent messages retained in Redis for seven days after the last state update. Quota is 60 AI requests per UTC day per thread; STOP/START/RESET do not reset quota. Quota is reserved before model work.
- Chat SDK/Redis provide shared locks, message deduplication for 48 hours, and a transient pending-message queue. STOP/RESET take precedence over coalesced pending texts. Infrastructure may transiently hold queued message content independently of the conversation history.
- Phone allowlisting is an initial private pilot, not web-account verification. Text history is separate from web memory. No app health records, Garmin/Strava data, or local NYC Marathon goal is silently exported. The agent has no activity/plan write tools.
- The existing hosted account-service issue must be resolved before implementing verified web-account pairing and shared health memory. Do not map every phone to the owner's profile.
- Incoming webhooks acknowledge before background processing. Failures during background work are not guaranteed to be retried by Photon; application-level delivery recovery is not implemented. An ambiguous outbound failure can still lead to a missing or duplicate response; this is not exactly-once delivery.

## Verification

`npm run test:photon` covers consent, STOP/RESET, bounded history, quota, sender/group/event filtering, forged/altered/stale/future signatures. Production build checks integration types. Real Photon delivery, Redis concurrency and full inbound/outbound acceptance remain pending credentials and a line.

References: https://photon.codes/docs/webhooks/events and https://github.com/photon-hq/vercel-chat-adapter-imessage
