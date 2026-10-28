begin;

create table public.profiles (
 id uuid primary key references auth.users(id),
 display_name text not null check (length(trim(display_name)) between 1 and 160),
 role text not null check(role in ('admin','agent')),
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.customers (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 160),
 contact_reference text check(length(contact_reference)<=255), created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create unique index customer_contact on public.customers(lower(trim(contact_reference))) where coalesce(trim(contact_reference),'')<>'';
create table public.tickets (
 id uuid primary key default gen_random_uuid(), number bigint generated always as identity unique,
 customer_id uuid not null references public.customers(id),
 subject text not null check(length(trim(subject)) between 5 and 160),
 summary text not null check(length(trim(summary)) between 5 and 4000),
 category text not null check(category in ('general','shipping','product','payment','return')),
 channel text not null check(channel in ('whatsapp','marketplace','email','phone','other')),
 order_reference text check(length(order_reference)<=100),
 priority text not null check(priority in ('normal','high')),
 status text not null default 'new' check(status in ('new','in_progress','waiting_customer','escalated','resolved')),
 assigned_to uuid references public.profiles(id), created_by uuid not null references public.profiles(id),
 request_id uuid not null, request_hash text not null,
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 received_at timestamptz not null default now(), first_response_at timestamptz, resolved_at timestamptz,
 unique(created_by,request_id),
 check(status not in ('in_progress','waiting_customer','resolved') or assigned_to is not null),
 check((status='resolved')=(resolved_at is not null))
);
create table public.ticket_notes (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.tickets(id),
 author_id uuid not null references public.profiles(id), body text not null check(length(trim(body)) between 5 and 4000),
 kind text not null check(kind in ('internal','response','resolution')),
 sent_at timestamptz, request_id uuid not null, request_hash text not null,
 created_at timestamptz not null default now(), unique(author_id,request_id),
 check((kind='response')=(sent_at is not null))
);
create table public.ticket_events (
 id bigint generated always as identity primary key, ticket_id uuid not null references public.tickets(id),
 actor_id uuid not null references public.profiles(id), event_type text not null,
 details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.faqs (
 id uuid primary key default gen_random_uuid(), question text not null check(length(trim(question)) between 5 and 300),
 answer text not null check(length(trim(answer)) between 5 and 4000), is_published boolean not null default false,
 updated_by uuid not null references public.profiles(id), updated_at timestamptz not null default now()
);
create table public.team_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id),
 target_id uuid not null references public.profiles(id), details jsonb not null, created_at timestamptz not null default now()
);
create table public.mutation_requests (
 actor_id uuid not null references public.profiles(id), request_id uuid not null, request_hash text not null,
 result jsonb not null, created_at timestamptz not null default now(), primary key(actor_id,request_id)
);
create table public.rate_buckets (
 actor_id uuid primary key references public.profiles(id), started_at timestamptz not null default now(), hits integer not null default 1
);
create index tickets_queue on public.tickets(status,priority,created_at);
create index tickets_owner on public.tickets(assigned_to,status,created_at);
create index tickets_customer on public.tickets(customer_id);
create index tickets_order on public.tickets(order_reference) where order_reference is not null;
create index notes_history on public.ticket_notes(ticket_id,created_at,id);
create index events_history on public.ticket_events(ticket_id,created_at,id);

create function public.luma_active() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active);
$$;
create function public.luma_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active and role='admin');
$$;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_notes enable row level security;
alter table public.ticket_events enable row level security;
alter table public.faqs enable row level security;
alter table public.team_events enable row level security;
alter table public.mutation_requests enable row level security;
alter table public.rate_buckets enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(public.luma_active());
create policy customers_read on public.customers for select to authenticated using(public.luma_active());
create policy tickets_read on public.tickets for select to authenticated using(public.luma_active());
create policy notes_read on public.ticket_notes for select to authenticated using(public.luma_active());
create policy events_read on public.ticket_events for select to authenticated using(public.luma_active());
create policy faqs_read on public.faqs for select to authenticated using(public.luma_active() and (is_published or public.luma_admin()));
create policy team_events_read on public.team_events for select to authenticated using(public.luma_admin());
create policy requests_read on public.mutation_requests for select to authenticated using(actor_id=auth.uid() and public.luma_active());
revoke all on public.profiles,public.customers,public.tickets,public.ticket_notes,public.ticket_events,public.faqs,public.team_events,public.mutation_requests,public.rate_buckets from anon,authenticated;
grant select on public.profiles,public.customers,public.tickets,public.ticket_notes,public.ticket_events,public.faqs,public.team_events,public.mutation_requests to authenticated;

create function public.luma_rate_limit() returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if not public.luma_active() then raise exception 'FORBIDDEN' using errcode='P0001'; end if;
 insert into public.rate_buckets(actor_id) values(auth.uid()) on conflict(actor_id) do update
 set hits=case when public.rate_buckets.started_at<now()-interval '1 minute' then 1 else public.rate_buckets.hits+1 end,
 started_at=case when public.rate_buckets.started_at<now()-interval '1 minute' then now() else public.rate_buckets.started_at end returning hits into n;
 return n<=180;
end;
$$;

create function public.luma_mutate(action text, payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor public.profiles; t public.tickets; old_status text; obj jsonb; saved public.mutation_requests;
 rid uuid; h text; target uuid; note_id uuid; next_status text; reason text; sent timestamptz; old_profile public.profiles;
begin
 if action='team.update' then perform pg_advisory_xact_lock(6102801); end if;
 select * into actor from public.profiles where id=auth.uid() and is_active for share;
 if actor.id is null then raise exception 'FORBIDDEN' using errcode='P0001'; end if;
 if action not in ('customer.create','ticket.create','ticket.update','ticket.claim','ticket.assign','ticket.note','ticket.response','ticket.status','ticket.faq','faq.save','team.update') then
  raise exception 'VALIDATION_ERROR' using errcode='P0001';
 end if;
 rid:=(payload->>'request_id')::uuid;
 if rid is null then raise exception 'VALIDATION_ERROR' using errcode='P0001'; end if;
 h:=encode(sha256(convert_to(jsonb_build_object('action',action,'payload',payload)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(actor.id::text||rid::text,0));
 select * into saved from public.mutation_requests where actor_id=actor.id and request_id=rid;
 if found then
  if saved.request_hash<>h then raise exception 'REQUEST_CONFLICT' using errcode='P0001'; end if;
  return saved.result;
 end if;
 if action='customer.create' then
  insert into public.customers(name,contact_reference,created_by) values(trim(payload->>'name'),nullif(trim(payload->>'contact_reference'),''),actor.id)
  returning to_jsonb(customers.*) into obj;
 elsif action='faq.save' then
  if actor.role<>'admin' then raise exception 'FORBIDDEN' using errcode='P0001'; end if;
  target:=coalesce((payload->>'id')::uuid,gen_random_uuid());
  insert into public.faqs(id,question,answer,is_published,updated_by)
  values(target,trim(payload->>'question'),trim(payload->>'answer'),(payload->>'is_published')::boolean,actor.id)
  on conflict(id) do update set question=excluded.question,answer=excluded.answer,is_published=excluded.is_published,updated_by=actor.id,updated_at=now()
  returning to_jsonb(faqs.*) into obj;
 elsif action='team.update' then
  if actor.role<>'admin' then raise exception 'FORBIDDEN' using errcode='P0001'; end if;
  select * into old_profile from public.profiles where id=(payload->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0001'; end if;
  if old_profile.role='admin' and old_profile.is_active and ((payload->>'role')<>'admin' or not (payload->>'is_active')::boolean)
   and (select count(*) from public.profiles where role='admin' and is_active)<=1 then
   raise exception 'LAST_ADMIN' using errcode='P0001';
  end if;
  update public.profiles set role=payload->>'role',is_active=(payload->>'is_active')::boolean where id=old_profile.id returning to_jsonb(profiles.*) into obj;
  insert into public.team_events(actor_id,target_id,details) values(actor.id,old_profile.id,jsonb_build_object('before',to_jsonb(old_profile),'after',obj));
 elsif action='ticket.create' then
  if (payload->>'received_at')::timestamptz>now() then raise exception 'INVALID_TIME' using errcode='P0001'; end if;
  insert into public.tickets(customer_id,subject,summary,category,channel,order_reference,priority,created_by,request_id,request_hash,received_at)
  values((payload->>'customer_id')::uuid,trim(payload->>'subject'),trim(payload->>'summary'),payload->>'category',payload->>'channel',nullif(trim(payload->>'order_reference'),''),payload->>'priority',actor.id,rid,h,coalesce((payload->>'received_at')::timestamptz,now())) returning * into t;
  insert into public.ticket_events(ticket_id,actor_id,event_type) values(t.id,actor.id,'created');
  obj:=to_jsonb(t)||jsonb_build_object('number',t.number::text);
 else
  select * into t from public.tickets where id=(payload->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0001'; end if;
  if action='ticket.claim' then
   if t.assigned_to is not null or t.status<>'new' then raise exception 'ASSIGNMENT_CONFLICT' using errcode='P0001'; end if;
  elsif action='ticket.assign' then
   if actor.role<>'admin' then raise exception 'FORBIDDEN' using errcode='P0001'; end if;
  elsif actor.role<>'admin' and t.assigned_to is distinct from actor.id then raise exception 'FORBIDDEN' using errcode='P0001';
  end if;
  if (payload->>'version')::integer is distinct from t.version then raise exception 'VERSION_CONFLICT' using errcode='P0001'; end if;
  old_status:=t.status;
  if action='ticket.claim' then
   t.assigned_to:=actor.id; t.status:='in_progress';
  elsif action='ticket.assign' then
   if t.status='resolved' then raise exception 'INVALID_TRANSITION' using errcode='P0001'; end if;
   target:=(payload->>'assigned_to')::uuid;
   perform 1 from public.profiles where id=target and is_active for share;
   if not found then raise exception 'INVALID_OWNER' using errcode='P0001'; end if;
   if length(trim(coalesce(payload->>'reason','')))<5 then raise exception 'VALIDATION_ERROR' using errcode='P0001'; end if;
   t.assigned_to:=target; t.status:='in_progress';
  elsif action='ticket.update' then
   t.subject:=trim(payload->>'subject'); t.summary:=trim(payload->>'summary'); t.category:=payload->>'category';
   t.channel:=payload->>'channel'; t.priority:=payload->>'priority'; t.order_reference:=nullif(trim(payload->>'order_reference'),'');
  elsif action in ('ticket.note','ticket.response') then
   sent:=case when action='ticket.response' then (payload->>'sent_at')::timestamptz end;
   if action='ticket.response' and (sent is null or sent<t.received_at or sent>now()) then raise exception 'INVALID_TIME' using errcode='P0001'; end if;
   insert into public.ticket_notes(ticket_id,author_id,body,kind,sent_at,request_id,request_hash)
   values(t.id,actor.id,trim(payload->>'body'),case when action='ticket.response' then 'response' else 'internal' end,sent,rid,h) returning id into note_id;
   if sent is not null then t.first_response_at:=least(t.first_response_at,sent); end if;
  elsif action='ticket.faq' then
   perform 1 from public.faqs where id=(payload->>'faq_id')::uuid and is_published;
   if not found then raise exception 'NOT_FOUND' using errcode='P0001'; end if;
  elsif action='ticket.status' then
   next_status:=payload->>'status';
   if not ((t.status='new' and next_status='escalated')
    or (t.status='in_progress' and next_status in ('waiting_customer','escalated','resolved'))
    or (t.status='waiting_customer' and next_status in ('in_progress','resolved'))
    or (t.status='escalated' and next_status='in_progress' and actor.role='admin')
    or (t.status='resolved' and next_status in ('in_progress','escalated'))) then raise exception 'INVALID_TRANSITION' using errcode='P0001'; end if;
   reason:=trim(coalesce(payload->>'resolution',payload->>'reason',''));
   if (next_status='resolved' or t.status='resolved') and length(reason)<5 then raise exception 'VALIDATION_ERROR' using errcode='P0001'; end if;
   if next_status in ('in_progress','waiting_customer','resolved') then
    perform 1 from public.profiles where id=t.assigned_to and is_active for share;
    if not found then raise exception 'INVALID_OWNER' using errcode='P0001'; end if;
   end if;
   if next_status='resolved' then
    insert into public.ticket_notes(ticket_id,author_id,body,kind,request_id,request_hash) values(t.id,actor.id,reason,'resolution',rid,h);
   end if;
   t.status:=next_status; t.resolved_at:=case when next_status='resolved' then now() end;
  end if;
  update public.tickets set subject=t.subject,summary=t.summary,category=t.category,channel=t.channel,priority=t.priority,
   order_reference=t.order_reference,assigned_to=t.assigned_to,status=t.status,resolved_at=t.resolved_at,first_response_at=t.first_response_at,
   version=version+1,updated_at=now() where id=t.id returning * into t;
  insert into public.ticket_events(ticket_id,actor_id,event_type,details)
  values(t.id,actor.id,action,jsonb_strip_nulls(jsonb_build_object('from_status',old_status,'status',t.status,'assigned_to',t.assigned_to,'reason',reason,'assignment_reason',payload->>'reason','faq_id',payload->>'faq_id','note_id',note_id)));
  obj:=to_jsonb(t)||jsonb_build_object('number',t.number::text);
 end if;
 insert into public.mutation_requests(actor_id,request_id,request_hash,result) values(actor.id,rid,h,obj);
 return obj;
end;
$$;

create function public.luma_metrics(days integer default 7) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.luma_active() then raise exception 'FORBIDDEN' using errcode='P0001'; end if;
 if days not in (7,30) then raise exception 'VALIDATION_ERROR' using errcode='P0001'; end if;
 select jsonb_build_object(
  'open',count(*) filter(where status<>'resolved'),
  'unassigned',count(*) filter(where assigned_to is null and status<>'resolved'),
  'waiting',count(*) filter(where status='waiting_customer'),
  'resolved',count(*) filter(where resolved_at>=now()-make_interval(days=>days)),
  'mine',count(*) filter(where assigned_to=auth.uid() and status<>'resolved'),
  'response_minutes',percentile_cont(0.5) within group(order by extract(epoch from(first_response_at-received_at))/60)
   filter(where first_response_at is not null and created_at>=now()-make_interval(days=>days)),
  'period',days) into result from public.tickets;
 return result;
end;
$$;

-- Only invite-created users get a profile. Bootstrap the first admin manually.
create function public.luma_invited_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.invited_at is not null then
  insert into public.profiles(id,display_name,role) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1)),'agent');
 end if;
 return new;
end;
$$;
create trigger invited_profile after insert on auth.users for each row execute function public.luma_invited_profile();
revoke all on function public.luma_active(),public.luma_admin(),public.luma_rate_limit(),public.luma_mutate(text,jsonb),public.luma_metrics(integer),public.luma_invited_profile() from public,anon;
grant execute on function public.luma_active(),public.luma_admin(),public.luma_rate_limit(),public.luma_mutate(text,jsonb),public.luma_metrics(integer) to authenticated;
commit;
