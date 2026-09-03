-- 나다움 설계 리포트 · Supabase 초기 설정
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행 (한 번만)

-- 1) profiles 테이블
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  report_id  text,
  data       jsonb,
  remind_on  boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2) RLS 활성화 (필수 — 없으면 anon key로 전체 데이터 조회 가능)
alter table public.profiles enable row level security;

-- 3) 본인 행만 접근 가능한 정책
drop policy if exists "own row select" on public.profiles;
create policy "own row select" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "own row insert" on public.profiles;
create policy "own row insert" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "own row update" on public.profiles;
create policy "own row update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own row delete" on public.profiles;
create policy "own row delete" on public.profiles
  for delete using (auth.uid() = user_id);

-- 4) updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 5) 확인용 (RLS가 켜져 있어야 함)
-- select relname, relrowsecurity from pg_class where relname = 'profiles';
