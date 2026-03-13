-- Step 2: 문의/리드 수집용 최소 테이블
create extension if not exists pgcrypto;

create table if not exists public.lead_inquiries (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  source text not null default 'website',
  client_ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists lead_inquiries_created_at_idx
  on public.lead_inquiries (created_at desc);

-- 운영 기본안 A: Supabase Dashboard에서 조회
-- service role key를 사용하는 API route에서만 insert하도록 운영합니다.
alter table public.lead_inquiries enable row level security;
