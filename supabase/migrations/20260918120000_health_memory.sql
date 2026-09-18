-- First-party, user-owned memory. No Mem0 account or vector service required.
create table if not exists public.health_memory (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null,
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 constraint bounded_memory check(octet_length(state::text)<=650000)
);
alter table public.health_memory enable row level security;
create policy memory_owner_select on public.health_memory for select to authenticated using(auth.uid()=user_id);
revoke all on public.health_memory from public,anon,authenticated;
grant select on public.health_memory to authenticated;
-- All writes use CAS, including deletion (an empty state tombstone). A stale
-- browser cannot resurrect memory after another session has forgotten it.
create or replace function public.save_health_memory(new_state jsonb,expected_revision integer)
returns integer language plpgsql security definer set search_path=public as $$
declare result integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if expected_revision<0 or octet_length(new_state::text)>650000 or jsonb_typeof(new_state) is distinct from 'object'
 or jsonb_typeof(new_state->'enabled') is distinct from 'boolean'
 or jsonb_typeof(new_state->'entries') is distinct from 'array'
 or jsonb_typeof(new_state->'conversations') is distinct from 'array' then raise exception 'Invalid memory state'; end if;
 if jsonb_array_length(new_state->'entries')>100 or jsonb_array_length(new_state->'conversations')>10 then raise exception 'Memory limit exceeded'; end if;
 if expected_revision=0 then
  insert into public.health_memory(user_id,state,revision) values(auth.uid(),new_state,1) on conflict do nothing returning revision into result;
 else
  update public.health_memory set state=new_state,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=expected_revision returning revision into result;
 end if;
 return result;
end $$;
revoke all on function public.save_health_memory(jsonb,integer) from public,anon;
grant execute on function public.save_health_memory(jsonb,integer) to authenticated;
