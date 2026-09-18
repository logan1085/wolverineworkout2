-- Personal official Strava MCP connection. Activity data and answers are never stored here.
create table if not exists public.strava_connections (
 user_id uuid primary key references auth.users(id) on delete cascade,
 tokens text not null,
 expires_at timestamptz not null,
 connected_at timestamptz not null default now(),
 last_query_at timestamptz,
 lock_until timestamptz
);
alter table public.strava_connections enable row level security;
revoke all on public.strava_connections from public, anon, authenticated;
grant all on public.strava_connections to service_role;
