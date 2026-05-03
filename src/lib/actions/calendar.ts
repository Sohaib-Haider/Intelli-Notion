'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { unstable_cache } from 'next/cache'

export const getWorkspaceTasks = unstable_cache(
  async (workspaceId: string) => {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee_ids, profiles:assignee_id(full_name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspace tasks details:', JSON.stringify(error, null, 2))
      return []
    }
    return data
  },
  ['workspace_tasks'],
  { revalidate: 30, tags: ['tasks'] }
)

export const getWorkspaceOutreachLogs = unstable_cache(
  async (workspaceId: string) => {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('outreach_logs')
      .select('*, profiles:member_id(full_name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspace outreach logs:', error)
      return []
    }
    return data
  },
  ['workspace_outreach_logs'],
  { revalidate: 30, tags: ['outreach_logs'] }
)
