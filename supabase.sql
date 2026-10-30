-- 1분 MBTI 통계 수집 테이블과 집계 함수. Supabase SQL Editor에 그대로 붙여넣어 실행
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session    text not null,
  type       text not null check (type in ('visit', 'result', 'timeout')),
  mbti       text check (mbti is null or mbti ~ '^[EI][NS][TF][JP]$'),
  seconds    integer check (seconds is null or seconds between 1 and 600)
);

create index if not exists events_type_created_idx on public.events (type, created_at);

-- 익명 키로는 삽입만 가능. 원본 행 조회는 막고 집계 함수만 열어 둠
alter table public.events enable row level security;

drop policy if exists "anon insert" on public.events;
create policy "anon insert" on public.events
  for insert to anon with check (true);

create or replace function public.stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'visitors',    (select count(distinct session) from events where type = 'visit'),
    'pageviews',   (select count(*)                from events where type = 'visit'),
    'results',     (select count(*)                from events where type = 'result'),
    'timeouts',    (select count(*)                from events where type = 'timeout'),
    'avg_seconds', (select round(avg(seconds)::numeric, 1) from events where type = 'result'),
    'by_type',     (select coalesce(json_object_agg(mbti, n), '{}'::json)
                    from (select mbti, count(*) as n from events where type = 'result' group by mbti) t),
    'since',       (select min(created_at) from events)
  );
$$;

grant execute on function public.stats() to anon;
