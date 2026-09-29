# Running welcome and voice check-in

The welcome asks “Did you run today?” with athletic sans-serif typography, a lime primary action, the approved Pip portrait, and minimal navigation. The training dashboard opens through View my training. Log a run opens the existing editable activity form; Type instead opens a draft in the text agent and does not send it automatically.

## Voice behavior

- Explicit Start voice check-in shares microphone audio with OpenAI. No microphone access occurs on page load.
- Server authenticates the existing health identity, checks origin and affirmative consent, then creates an ephemeral Realtime credential using the existing server key. Only that short-lived credential reaches the browser.
- Uses the GA WebRTC flow, `gpt-realtime-2.1`, `marin`, server voice activity detection and short responses. The legacy workout coach route is unchanged.
- The prompt asks one question at a time. It cannot access stored health history, memory, training sessions or wearable data. There are no write tools; it never promises a saved record.
- Microphone mute, end, cancel, transcript captions and blocked-playback recovery are visible. Resources are released on failure, cancel, page hide, tab hide, identity change and unmount. A three-minute client timer ends ordinary check-ins. It is not a server-enforced spend cap.
- Voice transcripts/audio are not persisted by Wolverine. Provider processing still applies. Users explicitly save any activity separately.
- Token issuance has a ten-second per-identity cooldown within each server instance; this is not a distributed rate limit.

## Evidence and limits

The user explicitly authorized reuse of the existing OpenAI key on September 28. A live credential-minting request returned HTTP 200 with the configured model and voice; no microphone audio or personal health data was transmitted in that test. Unit checks cover configuration/consent, media cleanup, origin/auth/consent rejection, ephemeral-only responses, cooldown and sanitized upstream failures. A real microphone conversation has not been acceptance-tested.

Hosted voice retains the existing sign-in requirement. The prior hosted account-service blocker is not solved by this release. Local authenticated development can use the existing `scripts/local-health-preview.mjs` wrapper without copying the key into the repo.

References:
- https://developers.openai.com/api/docs/guides/voice-webrtc
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://www.runna.com/
