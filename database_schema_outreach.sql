-- 6. OUTREACH LOGS TABLE
create table public.outreach_logs (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  feature_id uuid references public.workspace_features(id) on delete cascade not null,
  member_id uuid references public.profiles(id) on delete cascade not null,
  channel text not null check (channel in ('Cold email', 'LinkedIn campaign', 'Instagram DM', 'Phone calls', 'Other')),
  count integer not null default 0,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.outreach_logs enable row level security;

create policy "Users can view outreach logs of their workspaces"
  on public.outreach_logs for select
  using ( is_member_of(workspace_id) );

create policy "Users can insert their own outreach logs"
  on public.outreach_logs for insert
  with check ( member_id = auth.uid() and is_member_of(workspace_id) );

create policy "Users can delete their own outreach logs"
  on public.outreach_logs for delete
  using ( member_id = auth.uid() );
