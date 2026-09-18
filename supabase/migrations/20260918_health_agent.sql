-- Apply through the existing project's Supabase migration workflow.
create table if not exists public.health_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.health_profiles enable row level security;
create policy health_owner_select on public.health_profiles for select to authenticated using (auth.uid() = user_id);
create policy health_owner_insert on public.health_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy health_owner_update on public.health_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy health_owner_delete on public.health_profiles for delete to authenticated using (auth.uid() = user_id);
grant select,insert,update,delete on public.health_profiles to authenticated;
revoke all on public.health_profiles from anon;
create table if not exists public.garmin_connections (
 user_id uuid primary key references auth.users(id) on delete cascade,
 garmin_user_id text not null unique,
 tokens text not null,
 permissions jsonb not null default '[]',
 expires_at timestamptz not null,
 connected_at timestamptz not null default now(),
 last_sync_at timestamptz,
 lock_until timestamptz
);
alter table public.garmin_connections enable row level security;
-- No browser policies: encrypted tokens can only be read by server service-role code.
revoke all on public.garmin_connections from anon, authenticated;
grant all on public.garmin_connections to service_role;

-- A single locked merge keeps Garmin imports from overwriting manual history.
create or replace function public.merge_garmin_health(new_metrics jsonb,new_activities jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare current_state jsonb; merged_metrics jsonb; merged_activities jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.health_profiles(user_id,state) values(auth.uid(),'{"profile":{"name":"","goal":"Build a sustainable routine","minutes":30},"checkIns":[],"metrics":[],"activities":[],"completed":[]}') on conflict do nothing;
 select state into current_state from public.health_profiles where user_id=auth.uid() for update;
 select coalesce(jsonb_agg(m order by m->>'date'),'[]') into merged_metrics from (
  select (coalesce(old.value,'{}') || incoming.value) m from jsonb_array_elements(new_metrics) incoming left join jsonb_array_elements(current_state->'metrics') old on old.value->>'date'=incoming.value->>'date'
  union all select old.value from jsonb_array_elements(current_state->'metrics') old where not exists(select 1 from jsonb_array_elements(new_metrics) incoming where incoming.value->>'date'=old.value->>'date')
 ) records;
 select coalesce(jsonb_agg(a order by a->>'date' desc),'[]') into merged_activities from (
  select value a from jsonb_array_elements(new_activities)
  union all select value from jsonb_array_elements(current_state->'activities') old where old.value->>'source'='manual' or not exists(select 1 from jsonb_array_elements(new_activities) incoming where incoming.value->>'id'=old.value->>'id')
 ) records;
 -- Bound stored data to the UI's supported history windows.
 select coalesce(jsonb_agg(value order by value->>'date'),'[]') into merged_metrics from (select value from jsonb_array_elements(merged_metrics) order by value->>'date' desc limit 366) recent;
 select coalesce(jsonb_agg(value order by value->>'date' desc),'[]') into merged_activities from (select value from jsonb_array_elements(merged_activities) order by value->>'date' desc limit 1000) recent;
 update public.health_profiles set state=jsonb_set(jsonb_set(current_state,'{metrics}',merged_metrics),'{activities}',merged_activities),updated_at=now() where user_id=auth.uid();
end $$;
revoke all on function public.merge_garmin_health(jsonb,jsonb) from public,anon;
grant execute on function public.merge_garmin_health(jsonb,jsonb) to authenticated;

create or replace function public.save_manual_health(new_state jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare current_state jsonb; result jsonb; manual_activities jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.health_profiles(user_id,state) values(auth.uid(),'{"profile":{"name":"","goal":"Build a sustainable routine","minutes":30},"checkIns":[],"metrics":[],"activities":[],"completed":[]}') on conflict do nothing;
 select state into current_state from public.health_profiles where user_id=auth.uid() for update;
 select coalesce(jsonb_agg(value order by value->>'date' desc),'[]') into manual_activities from (
  select value from jsonb_array_elements(new_state->'activities') where value->>'source'='manual'
  union all select value from jsonb_array_elements(current_state->'activities') where value->>'source'='garmin'
 ) activities;
 result=jsonb_set(jsonb_set(new_state,'{metrics}',current_state->'metrics'),'{activities}',manual_activities);
 update public.health_profiles set state=result,updated_at=now() where user_id=auth.uid();
 return result;
end $$;
revoke all on function public.save_manual_health(jsonb) from public,anon;
grant execute on function public.save_manual_health(jsonb) to authenticated;

-- Durable per-user daily spend guard. Only this function can write the counter.
create table if not exists public.health_agent_usage(user_id uuid references auth.users(id) on delete cascade,day date,requests integer not null,primary key(user_id,day));
alter table public.health_agent_usage enable row level security;
revoke all on public.health_agent_usage from public,anon,authenticated;
create or replace function public.consume_health_agent_quota() returns boolean
language plpgsql security definer set search_path=public as $$
declare count integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.health_agent_usage(user_id,day,requests) values(auth.uid(),(now() at time zone 'utc')::date,1)
 on conflict(user_id,day) do update set requests=health_agent_usage.requests+1 where health_agent_usage.requests<60
 returning requests into count;
 return count is not null;
end $$;
revoke all on function public.consume_health_agent_quota() from public,anon;
grant execute on function public.consume_health_agent_quota() to authenticated;
