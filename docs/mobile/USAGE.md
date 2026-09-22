# Wolverine on a phone

## Implemented

- Five-item bottom navigation: Today, Agent, Activity, Journal, More. Memory, Connections, profile editing, and the original workout coach are reachable from More. Profile editing is also available in the compact header.
- Phone chat uses the visible viewport and one scrollable conversation area. The composer grows with text and stays in the chat layout above navigation. On-screen keyboard detection hides secondary chrome and navigation to make room. Pinch zoom is not disabled or treated as keyboard input.
- Touch Enter inserts a newline; the explicit send button submits. Desktop Enter sends, Shift+Enter adds a newline, and IME composition never submits. Replies do not force scrolling when the user is reading older messages; sending a new message returns to the latest conversation.
- Context is available in a sheet on phones, including the data sharing explanation and a link to Memory. Consent remains required. When typing with previously granted consent, its label is collapsed; dismissing the keyboard restores the control.
- Dialogs use bottom sheets with visible close controls, bounded scrolling, body-scroll locking, and keyboard/safe-area spacing. Form controls retain at least 16px text; primary controls target at least 44px height.
- Narrow layouts stack forms and memory controls, wrap long content, and reserve space for the bottom navigation. Reduced-motion preferences are respected.
- Web app manifest, a standalone home-screen launch, theme color, scalable icon and Apple touch icon. This does not provide offline AI, background sync, or notifications. No service worker or health-data cache was introduced.

## Validation completed

Production compilation and lint/type validation. HTTP checks cover the manifest and generated home-screen assets. Code review covers responsive breakpoints, safe-area spacing, visible-viewport listeners/cleanup, IME handling, and conditional consent visibility. This initial mobile implementation was checked in code. Subsequent browser acceptance is recorded below and in `../PRODUCT_QUALITY.md`; physical-device testing remains pending.

## Device acceptance checklist — pending

Use a secure reachable deployment for a real phone; the laptop's `127.0.0.1` URL points to the phone itself if entered there. Do not expose the development-only local authentication bypass to the network. The deployed version requires configured account authentication.

- iOS Safari: 375×667 and 390×844 portrait, landscape, address-bar collapse, keyboard open/closed, Add to Home Screen launch.
- Android Chrome: 360×800 and 412×915, keyboard resize, multiline draft, dismiss/reopen keyboard, home-screen shortcut/install behavior.
- Narrow layout: 320px width, long activity names, long email/goal text, large text and pinch zoom without clipped controls.
- Every primary destination and More destination remains reachable; sheet close/Escape and focus return work.
- Chat: allow sharing, submit via button, compose a newline without sending, use a composing IME, scroll older messages while a reply arrives, clear/new conversation, inspect Context, and revoke consent after dismissing the keyboard.
- Check-in/profile/activity sheets: focus last field, reach submit while keyboard is open, dismiss without accidental submission, and confirm background does not scroll.
- Confirm health records and memories retain their existing behavior across navigation; Strava ephemeral answers are cleared when leaving Connections as before.

Device verification remains necessary before describing this as tested on iPhone or Android. Home-screen metadata is not a guarantee of install prompts on every browser.

## Recovery improvements — September 20

Chat errors appear inside the composer area. Offline detection keeps drafts in place and disables sending until reconnection; it does not cache health data or enable offline AI. Stop response restores the submitted draft and ignores late responses, but does not promise the provider stops processing. Memory conflicts also restore the draft. The 3D launcher hides while the mobile keyboard is open; Stop remains reachable. Test these behaviors on devices before release.

## Browser acceptance — September 22

Inspected the live local app at a 390×844 browser viewport. Found and fixed an overlong first screen that hid the character, excess mobile chat chrome, missing space during lazy character-preview loading, and the framework development indicator intercepting Today taps. Verified Sunny selection propagates to Today and chat and survives reload; restored Moss after testing. The browser console showed no errors during this walkthrough. These are browser checks, not physical iPhone/Android keyboard tests. The originally open tab was stale and required a reload to load the current build.
