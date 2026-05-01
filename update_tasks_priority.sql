alter table public.tasks add column if not exists priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High'));
