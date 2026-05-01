-- 5. TASKS TABLE
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  feature_id uuid references public.workspace_features(id) on delete cascade not null,
  title text not null,
  status text not null default 'Not started' check (status in ('Not started', 'In progress', 'Done')),
  assignee_id uuid references public.profiles(id) on delete set null,
  assignee_ids uuid[] default array[]::uuid[],
  description text,
  date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

alter table public.tasks enable row level security;

-- Users can view tasks if they are a member of the workspace
create policy "Users can view tasks of their workspaces"
  on public.tasks for select
  using ( is_member_of(workspace_id) );

-- Users with 'owner' or 'editor' role can insert tasks
create policy "Owners and editors can insert tasks"
  on public.tasks for insert
  with check ( is_editor_or_owner(workspace_id) );

-- Users with 'owner' or 'editor' role can update tasks
create policy "Owners and editors can update tasks"
  on public.tasks for update
  using ( is_editor_or_owner(workspace_id) );

-- Users with 'owner' or 'editor' role can delete tasks
create policy "Owners and editors can delete tasks"
  on public.tasks for delete
  using ( is_editor_or_owner(workspace_id) );
