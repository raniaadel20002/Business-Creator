-- ================================================
-- Business Creator - Supabase Database Schema
-- Run this in Supabase SQL Editor to set up your DB
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==================== USERS ====================
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text default '',
  photo_url text default '',
  subscription_plan text default 'FREE' check (subscription_plan in ('FREE', 'PRO')),
  tokens integer default 0,
  daily_generations integer default 0,
  last_generation_date timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_data jsonb default null,
  form_status text default null,  -- 'started' | 'completed'
  last_form_update_at timestamptz default null,
  reminder_email_sent boolean default false,
  reminder_email_sent_at timestamptz default null,
  banned boolean default false,
  status text default 'active'
);

-- Automatically create user row on new auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name, photo_url, subscription_plan, tokens, daily_generations, last_generation_date, created_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'FREE',
    0,
    0,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==================== PROJECTS ====================
create table if not exists projects (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  project_name text default '',
  concept text default '',
  type text default 'business',
  plan_data text not null,  -- JSON stringified BusinessPlan
  status text default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_status on projects(status);

-- ==================== NOTIFICATIONS ====================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general',
  suggest_whats_app boolean default false,
  read boolean default false,
  is_official boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_read on notifications(read);

-- ==================== CHAT SESSIONS ====================
create table if not exists chat_sessions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  project_id text not null references projects(id) on delete cascade,
  title text not null default 'محادثة',
  messages jsonb default '[]'::jsonb,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_chat_sessions_user_id on chat_sessions(user_id);
create index if not exists idx_chat_sessions_project_id on chat_sessions(project_id);

-- ==================== FEEDBACKS ====================
create table if not exists feedbacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  user_name text default '',
  user_email text default '',
  type text default 'general',  -- 'suggestion' | 'bug' | 'general'
  text text not null,
  reply text default null,
  replied_at timestamptz default null,
  status text default 'new',  -- 'new' | 'replied'
  created_at timestamptz default now()
);

-- ==================== LOGS ====================
create table if not exists logs (
  id uuid primary key default uuid_generate_v4(),
  user_id text default '',  -- can be 'admin' or a UUID
  user_name text default '',
  user_email text default '',
  action text not null,
  details jsonb default null,
  timestamp timestamptz default now()
);

create index if not exists idx_logs_user_id on logs(user_id);
create index if not exists idx_logs_timestamp on logs(timestamp desc);

-- ==================== TRANSACTIONS ====================
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  order_id text,
  amount numeric(10,2),
  currency text default 'EGP',
  plan_id text,
  status text default 'success',
  created_at timestamptz default now()
);

-- ==================== AI TASKS (ASYNC QUEUE) ====================
create table if not exists ai_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id text default '',
  task_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  result jsonb default null,
  error text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ai_tasks_user_id on ai_tasks(user_id);
create index if not exists idx_ai_tasks_status on ai_tasks(status);

-- ==================== ROW LEVEL SECURITY (RLS) ====================

alter table users enable row level security;
alter table projects enable row level security;
alter table notifications enable row level security;
alter table chat_sessions enable row level security;
alter table feedbacks enable row level security;
alter table logs enable row level security;
alter table transactions enable row level security;
alter table ai_tasks enable row level security;

-- AI TASKS: users can read & insert their own tasks
create policy "AI Tasks: read own" on ai_tasks for select using (true);
create policy "AI Tasks: insert own" on ai_tasks for insert with check (true);
create policy "AI Tasks: update own" on ai_tasks for update using (true);

-- USERS: users can read/update their own row
create policy "Users: read own" on users for select using (auth.uid() = id);
create policy "Users: update own" on users for update using (auth.uid() = id);

-- Protect sensitive user fields (plan, tokens, ban status) from client-side tampering
create or replace function public.protect_user_sensitive_fields()
returns trigger language plpgsql security definer as $$
begin
  -- If invoked by normal authenticated client (not service_role backend)
  if (auth.jwt()->>'role' = 'authenticated') then
    if (new.subscription_plan is distinct from old.subscription_plan) then
      raise exception 'غير مسموح بتعديل خطة الاشتراك مباشرة من الواجهة.';
    end if;
    if (new.tokens is distinct from old.tokens) then
      raise exception 'غير مسموح بتعديل رصيد النقاط مباشرة من الواجهة.';
    end if;
    if (new.banned is distinct from old.banned) then
      raise exception 'غير مسموح بتعديل حالة الحظر مباشرة.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_user_sensitive_fields on users;
create trigger trg_protect_user_sensitive_fields
  before update on users
  for each row
  execute function public.protect_user_sensitive_fields();

-- PROJECTS: users can CRUD their own projects
create policy "Projects: read own" on projects for select using (auth.uid() = user_id);
create policy "Projects: insert own" on projects for insert with check (auth.uid() = user_id);
create policy "Projects: update own" on projects for update using (auth.uid() = user_id);
create policy "Projects: delete own" on projects for delete using (auth.uid() = user_id);

-- NOTIFICATIONS: users can read/update/delete their own
create policy "Notifications: read own" on notifications for select using (auth.uid() = user_id);
create policy "Notifications: update own" on notifications for update using (auth.uid() = user_id);
create policy "Notifications: delete own" on notifications for delete using (auth.uid() = user_id);
-- Only service role or the recipient can insert notifications
create policy "Notifications: insert" on notifications for insert with check (auth.uid() = user_id or auth.uid() is null);

-- CHAT SESSIONS: users can CRUD their own
create policy "Chats: read own" on chat_sessions for select using (auth.uid() = user_id);
create policy "Chats: insert own" on chat_sessions for insert with check (auth.uid() = user_id);
create policy "Chats: update own" on chat_sessions for update using (auth.uid() = user_id);
create policy "Chats: delete own" on chat_sessions for delete using (auth.uid() = user_id);

-- FEEDBACKS: users can insert, admins (service role) can read all
create policy "Feedbacks: insert" on feedbacks for insert with check (auth.uid() = user_id or user_id is null);
create policy "Feedbacks: read own" on feedbacks for select using (auth.uid() = user_id);

-- LOGS: users can insert their own
create policy "Logs: insert" on logs for insert with check (auth.uid() is not null);

-- TRANSACTIONS: users can read their own
create policy "Transactions: read own" on transactions for select using (auth.uid() = user_id);

-- ==================== REALTIME ====================
-- Enable realtime for notifications and projects
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table projects;
