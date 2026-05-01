-- Add assignee_ids array to tasks table
ALTER TABLE public.tasks ADD COLUMN assignee_ids uuid[] default '{}';

-- Copy existing assignees to the new array
UPDATE public.tasks SET assignee_ids = ARRAY[assignee_id] WHERE assignee_id IS NOT NULL;

-- Note: We can leave assignee_id as is for backward compatibility or drop it later.
