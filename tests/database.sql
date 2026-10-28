-- Run against an isolated staging Supabase database as postgres, never production.
-- The entire fixture rolls back, including auth users.
begin;
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','luma-admin@example.invalid'),
 ('10000000-0000-4000-8000-000000000002','luma-agent1@example.invalid'),
 ('10000000-0000-4000-8000-000000000003','luma-agent2@example.invalid');
insert into public.profiles(id,display_name,role) values
 ('10000000-0000-4000-8000-000000000001','Test Admin','admin'),
 ('10000000-0000-4000-8000-000000000002','Test Agent 1','agent'),
 ('10000000-0000-4000-8000-000000000003','Test Agent 2','agent');
create temp table test_state(key text primary key,value jsonb);
grant all on test_state to authenticated;
create function pg_temp.assert_true(value boolean,label text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'FAILED: %',label; end if; end;
$$;
create function pg_temp.must_fail(statement text,expected text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when others then
  if position(expected in sqlerrm)>0 then return; end if;
  raise exception 'Expected %, got %',expected,sqlerrm;
 end;
 raise exception 'Expected failure %, statement succeeded',expected;
end;
$$;
set local role anon;
select pg_temp.must_fail('select * from public.tickets','permission denied');
select pg_temp.must_fail('select public.luma_mutate(''customer.create'',''{}'')','permission denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
insert into test_state values ('customer',public.luma_mutate('customer.create','{"request_id":"20000000-0000-4000-8000-000000000001","name":"Test customer","contact_reference":"test@example.invalid"}'));
insert into test_state values ('payload',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000002','customer_id',(select value->>'id' from test_state where key='customer'),'subject','Test shipping ticket','summary','Parcel has not arrived','category','shipping','channel','whatsapp','priority','normal'));
insert into test_state values ('ticket',public.luma_mutate('ticket.create',(select value from test_state where key='payload')));
select pg_temp.assert_true(public.luma_mutate('ticket.create',(select value from test_state where key='payload'))=(select value from test_state where key='ticket'),'create retry is identical');
select pg_temp.assert_true(jsonb_typeof((select value->'number' from test_state where key='ticket'))='string','bigint is returned as string');
select pg_temp.must_fail('update public.tickets set subject=''Tampered subject''','permission denied');
select pg_temp.must_fail('select public.luma_mutate(''team.update'',''{"request_id":"20000000-0000-4000-8000-000000000099","id":"10000000-0000-4000-8000-000000000001","role":"agent","is_active":false}'')','LAST_ADMIN');
select public.luma_mutate('faq.save','{"request_id":"20000000-0000-4000-8000-000000000020","question":"Draft test question","answer":"Unpublished policy for tests","is_published":false}');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select pg_temp.assert_true((select count(*) from public.faqs where question='Draft test question')=0,'agents cannot read draft FAQ');
select public.luma_mutate('ticket.claim',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000003','id',(select value->>'id' from test_state where key='ticket'),'version',1));
select pg_temp.assert_true((select count(*) from public.tickets where id=((select value->>'id' from test_state where key='ticket'))::uuid and assigned_to=auth.uid() and version=2)=1,'claim assigns and increments version');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select pg_temp.must_fail(format('select public.luma_mutate(''ticket.claim'',%L)',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000004','id',(select value->>'id' from test_state where key='ticket'),'version',1)),'ASSIGNMENT_CONFLICT');
select pg_temp.must_fail(format('select public.luma_mutate(''ticket.note'',%L)',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000005','id',(select value->>'id' from test_state where key='ticket'),'version',2,'body','Forged actor attempt','actor_id','10000000-0000-4000-8000-000000000002')),'FORBIDDEN');
select pg_temp.must_fail('select public.luma_mutate(''faq.save'',''{"request_id":"20000000-0000-4000-8000-000000000006","question":"Forbidden question","answer":"Forbidden answer","is_published":true}'')','FORBIDDEN');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select pg_temp.must_fail(format('select public.luma_mutate(''ticket.status'',%L)',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000007','id',(select value->>'id' from test_state where key='ticket'),'version',1,'status','resolved','resolution','Stale resolution attempt')),'VERSION_CONFLICT');
insert into test_state values ('note_payload',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000008','id',(select value->>'id' from test_state where key='ticket'),'version',2,'body','Contacted shipping partner'));
select public.luma_mutate('ticket.note',(select value from test_state where key='note_payload'));
select public.luma_mutate('ticket.note',(select value from test_state where key='note_payload'));
select pg_temp.assert_true((select count(*) from public.ticket_notes where ticket_id=((select value->>'id' from test_state where key='ticket'))::uuid)=1,'note retry creates one note');
select pg_temp.must_fail(format('select public.luma_mutate(''ticket.note'',%L)',(select value||'{"body":"Changed retry payload"}'::jsonb from test_state where key='note_payload')),'REQUEST_CONFLICT');
select pg_temp.must_fail(format('select public.luma_mutate(''ticket.response'',%L)',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000009','id',(select value->>'id' from test_state where key='ticket'),'version',3,'body','Response before receipt','sent_at','2000-01-01T00:00:00Z')),'INVALID_TIME');
select public.luma_mutate('ticket.status',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000010','id',(select value->>'id' from test_state where key='ticket'),'version',3,'status','resolved','resolution','Customer confirmed parcel received'));
select pg_temp.assert_true((select status='resolved' and resolved_at is not null and version=4 from public.tickets where id=((select value->>'id' from test_state where key='ticket'))::uuid),'resolution commits status, version and time');
select pg_temp.assert_true((select count(*) from public.ticket_notes where ticket_id=((select value->>'id' from test_state where key='ticket'))::uuid and kind='resolution')=1,'resolution creates note');
select public.luma_mutate('ticket.status',jsonb_build_object('request_id','20000000-0000-4000-8000-000000000011','id',(select value->>'id' from test_state where key='ticket'),'version',4,'status','in_progress','reason','Customer reported another issue'));
select pg_temp.assert_true((select status='in_progress' and resolved_at is null and version=5 from public.tickets where id=((select value->>'id' from test_state where key='ticket'))::uuid),'reopen clears resolved timestamp');
select pg_temp.assert_true((select count(*) from public.ticket_events where ticket_id=((select value->>'id' from test_state where key='ticket'))::uuid)=5,'all mutations have one event; failed/retried writes add none');
reset role;
update public.profiles set is_active=false where id='10000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.assert_true((select count(*) from public.tickets)=0,'inactive account reads no tickets');
select pg_temp.must_fail('select public.luma_mutate(''customer.create'',''{"request_id":"20000000-0000-4000-8000-000000000012","name":"Forbidden customer"}'')','FORBIDDEN');
reset role;
rollback;
