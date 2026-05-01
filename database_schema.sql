-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 0. PROFILES TABLE
-- Extends auth.users with additional information
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Trigger to create a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles are viewable by anyone in the same workspace
create policy "Profiles are viewable by workspace members"
  on public.profiles for select
  using (
    exists (
      select 1 from workspace_members wm1
      join workspace_members wm2 on wm1.workspace_id = wm2.workspace_id
      where wm1.user_id = auth.uid()
      and wm2.user_id = profiles.id
    )
    or id = auth.uid()
  );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using ( id = auth.uid() );

-- 1. WORKSPACES TABLE
create table public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. WORKSPACE MEMBERS TABLE
-- Roles: 'owner', 'editor', 'reader'
create table public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'reader')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (workspace_id, user_id)
);

-- 3. WORKSPACE INVITES TABLE
create table public.workspace_invites (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('editor', 'reader')),
  token text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- 4. WORKSPACE FEATURES TABLE
-- Type identifies the hardcoded feature (e.g., 'TASK_TRACKER')
create table public.workspace_features (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  type text not null, 
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- RLS HELPER FUNCTIONS (To prevent recursion)
-- ==========================================

-- Check if user is a member of a workspace
create or replace function public.is_member_of(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members
    where workspace_id = p_workspace_id
    and user_id = auth.uid()
  );
$$;

-- Check if user is an owner of a workspace
create or replace function public.is_owner_of(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members
    where workspace_id = p_workspace_id
    and user_id = auth.uid()
    and role = 'owner'
  );
$$;

-- check if user is an editor or owner of a workspace
create or replace function public.is_editor_or_owner(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members
    where workspace_id = p_workspace_id
    and user_id = auth.uid()
    and role in ('owner', 'editor')
  );
$$;

-- Function for a user to delete their own account
create or replace function public.delete_self()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.workspace_features enable row level security;

-- WORKSPACES POLICIES
create policy "Users can view their workspaces"
  on public.workspaces for select
  using ( is_member_of(id) );

-- Only authenticated users can insert (they become owner via trigger/logic later)
create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() is not null);

-- Only owners can update or delete
create policy "Owners can update workspaces"
  on public.workspaces for update
  using ( is_owner_of(id) );

create policy "Owners and editors can delete workspaces"
  on public.workspaces for delete
  using ( is_editor_or_owner(id) );


-- WORKSPACE MEMBERS POLICIES
-- Users can see members of workspaces they belong to
create policy "Users can view members of their workspaces"
  on public.workspace_members for select
  using ( is_member_of(workspace_id) );

-- Only owners can add/update/remove members
create policy "Owners can manage members"
  on public.workspace_members for all
  using ( is_owner_of(workspace_id) );
  
-- Allow users to insert themselves when they create a workspace or accept an invite
-- (In a real scenario, this might need security definer functions, but this is a starting point)
create policy "Users can insert themselves"
  on public.workspace_members for insert
  with check (user_id = auth.uid());


-- WORKSPACE FEATURES POLICIES
-- Users can view features of their workspaces
create policy "Users can view features of their workspaces"
  on public.workspace_features for select
  using ( is_member_of(workspace_id) );

-- Owners and editors can manage features
create policy "Owners and editors can manage features"
  on public.workspace_features for all
  using ( is_editor_or_owner(workspace_id) );
