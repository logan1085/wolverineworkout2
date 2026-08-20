/**
 * Whether in-app developer tools should be rendered.
 *
 * These used to be unconditional, which put a "Reset" button that wipes the
 * signed-in user's saved profile, and a memory-inspector panel, into the
 * production UI next to ordinary controls.
 *
 * Read from a `NEXT_PUBLIC_` variable so the check works in client components.
 * The comparison is against the literal string because Next inlines these at
 * build time as strings.
 */
export const DEV_TOOLS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true' ||
  process.env.NODE_ENV === 'development';
