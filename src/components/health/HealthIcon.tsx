type IconName = "today" | "agent" | "activity" | "journal" | "memory" | "connections" | "more";

/** A consistent, small stroke system for the app's primary navigation. */
export default function HealthIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    today: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    agent: <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z" />,
    activity: <path d="M3 13h4l3-8 4 14 3-6h4" />,
    journal: <><rect x="5" y="3" width="15" height="18" rx="3" /><path d="M9 3v18m4-12h3m-3 4h3M3 7h3m-3 5h3m-3 5h3" /></>,
    memory: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></>,
    connections: <><path d="m9 15 6-6m-5-3 1-1a5 5 0 0 1 7 7l-1 1m-3 5-1 1a5 5 0 0 1-7-7l1-1" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
