'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

export const getOutreachLogs = unstable_cache(
  async (featureId: string) => {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('outreach_logs')
      .select('*, profiles:member_id(full_name)')
      .eq('feature_id', featureId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching outreach logs:', error)
      return []
    }
    return data
  },
  ['outreach_logs'],
  { revalidate: 30, tags: ['outreach_logs'] }
)

export async function createOutreachLog(workspaceId: string, featureId: string, data: { 
  channel: string, 
  count: number, 
  note?: string,
  outreach_type?: string,
  campaign_status?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const { data: log, error } = await supabase
    .from('outreach_logs')
    .insert([{
      workspace_id: workspaceId,
      feature_id: featureId,
      member_id: user.id,
      channel: data.channel,
      count: data.count,
      note: data.note,
      outreach_type: data.outreach_type,
      campaign_status: data.campaign_status
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating outreach log:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  revalidateTag('outreach_logs', 'max')
  return { success: true, log }
}

export async function deleteOutreachLog(logId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('outreach_logs')
    .delete()
    .eq('id', logId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  revalidateTag('outreach_logs', 'max')
  return { success: true }
}

export async function updateOutreachStatus(logId: string, status: 'Live' | 'Completed') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('outreach_logs')
    .update({ campaign_status: status })
    .eq('id', logId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  revalidateTag('outreach_logs', 'max')
  return { success: true }
}
