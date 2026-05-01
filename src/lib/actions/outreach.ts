'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { startOfWeek, endOfWeek } from 'date-fns'

export async function getOutreachLogs(featureId: string) {
  const supabase = await createClient()
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
}

export async function createOutreachLog(workspaceId: string, featureId: string, data: { channel: string, count: number, note?: string }) {
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
      note: data.note
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating outreach log:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
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
  return { success: true }
}
