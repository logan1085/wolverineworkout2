# MEMORY.md — How Wolverine remembers

Policy version: 2026-09-18.1
Scope: the personal health agent at the main Wolverine app. The original workout coach is a separate experience and may use different memory services.

This is the public description of memory behavior, not a user's memory database. No personal facts, account details, health records, tokens, or conversations are published in this file.

## 1. Two kinds of memory

Confirmed facts cover goals, preferences, routines, and self-reported constraints. You can add them manually. After a conversation, the agent may propose up to three facts with an exact quote from your latest message; each proposal needs your confirmation before it is saved. A quote is evidence to review, not proof that the agent interpreted it correctly.

Conversation history lets you resume a chat. When memory is on, the app saves successful exchanges, keeping up to 10 conversations with up to 40 messages each, subject to a total size limit. Saving chat history is separate from approving a new durable fact. The fact store supports up to 100 entries.

Memory starts off for a fresh store. Returning users retain their own setting. Sample chats do not read personal memories, propose saved facts, or save conversation history.

## 2. Where it lives

Without sign-in, memory is stored in this browser's localStorage under wolverine.memory.v1. It does not automatically follow you to a different browser or device. Clearing browser storage removes it. Anyone with access to this browser profile may be able to read it; it is not an encrypted vault.

With a configured account, memory is stored in the Supabase health_memory table, scoped to the signed-in user. Row-level access and authenticated server routes protect account separation. The app uses revision checks to reject stale saves rather than silently overwrite newer edits. This is not end-to-end encryption.

Local memory is not automatically uploaded or merged when you sign in. The app switches to the account's own memory store. Export and restore are explicit user actions. Account storage requires the Supabase configuration and migrations; code support is not a claim that it is activated in every deployment.

## 3. What a reply receives

When memory is enabled, the server selects up to eight non-expired facts. Ranking uses word overlap with the latest message, extra weight for constraints and goals, and recency to break ties. This is bounded keyword retrieval, not a vector database, a complete life history, or model training. Facts can be included even without a keyword match because categories have baseline priority.

The agent also receives the current conversation and a limited health context: profile, up to 14 check-ins, 14 daily wearable records, and 20 activities. These health records are separate from durable memory. Imported Garmin records are wearable estimates; check-ins and confirmed memories are self-reports.

The main agent sends context to OpenAI only when you allow sharing and send a message. Requests use store:false. That setting does not mean zero retention by external providers. Turning memory off does not turn off the health context or current conversation used for an explicitly consented reply.

The Memory included display lists facts supplied as context. It does not prove that each fact influenced the answer. The agent can make mistakes about relevance, meaning, and whether a statement is durable.

## 4. Your controls

Pause: stops saved-fact recall and new conversation saves, while keeping existing records. The interface clears the current conversation when toggling memory. A future message can still use the new current conversation and health context after you consent.

Expiry: a fact's use-until date excludes it from saved-fact retrieval after that date; it remains visible for review. Expiry does not erase mentions inside old saved conversations. Resuming an old chat may bring those mentions back into the conversation context.

Edit or forget: editing/replacing or forgetting a fact clears saved conversations so the old text cannot be reintroduced by resuming them. Other facts remain. The interface discloses this before destructive changes. Asking the agent to forget is not itself deletion; use the Memory controls.

Export and restore: you can download a backup and explicitly restore one. Backups are private user files and are not this public MEMORY.md. Copies you download are outside the app's deletion controls; restoring an old backup can reintroduce old facts.

Clear: use the app's memory controls to remove stored memory. Memory deletion is separate from disconnecting Garmin/Strava and removing health records. Clearing app data does not retroactively erase requests already handled by an external provider.

## 5. What stays outside memory

Strava live questions run in a separate Connections view through the official connector. Their answers are not added to Wolverine's saved health history, conversations, or durable memories. Leaving that view clears its local answer. The connection stores encrypted OAuth credentials and connection timestamps separately.

The main health memory does not use the original workout coach's Mem0 integration. It does not autonomously monitor you, silently connect accounts, create reminders, or learn by training a model on your records.

The prompt instructs the agent not to propose one-off symptoms, temporary availability, other people's statements, hypothetical examples, or inferred diagnoses as durable facts. These are intended behaviors, not guarantees; your confirmation is the final gate.

## 6. Public files are not personal files

SOUL.md publishes the agent's intended behavior. MEMORY.md publishes this storage and recall policy. Neither file reads your browser storage, Supabase account, provider connections, or saved chats. These documents are available without signing in. Your actual memory remains in the private Memory view and its explicit export flow.

## Inspectable context brief

The Memory view shows the same derived brief sent with personal-context chat requests: editable profile settings, up to 12 most recently updated active confirmed facts (only when memory is on), and records from the last seven UTC calendar dates. Additional relevant memories can be retrieved for the question. Included-memory disclosures cover both sources. The brief is rebuilt on read, never persisted or committed to Git. Forgetting, editing and expiry therefore affect the next brief without a separate summary to delete.

Recent records are observations, not inferred traits. Same-date self-reported and Garmin sleep differences of at least one hour are flagged for clarification. This is not general contradiction detection; free-text conflicts still require user review. The personal Memory view excludes fictional sample records. Pausing memory removes confirmed facts from the brief but does not turn off explicitly shared health context.
