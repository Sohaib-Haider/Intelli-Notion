'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTasks(featureId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee_ids, profiles:assignee_id(full_name)')
    .eq('feature_id', featureId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks details:', JSON.stringify(error, null, 2))
    return []
  }
  return data
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*, profiles:user_id(full_name)')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error fetching members details:', JSON.stringify(error, null, 2))
    return []
  }
  return data
}

export async function createTask(workspaceId: string, featureId: string, data: any) {
  const supabase = await createClient()
  console.log("Creating task with data:", data)
  
  const { data: task, error } = await supabase
    .from('tasks')
    .insert([{
      workspace_id: workspaceId,
      feature_id: featureId,
      title: data.title,
      status: data.status || 'Not started',
      assignee_id: data.assignee_id || null,
      assignee_ids: data.assignee_ids || [],
      description: data.description || ''
    }])
    .select()
    .single()

  if (error) {
    console.error("Create Task Error Details:", JSON.stringify(error, null, 2))
    return { error: error.message }
  }

  console.log("Task created successfully:", task)
  revalidatePath('/dashboard', 'layout')
  return { success: true, task }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function updateTaskAssignees(taskId: string, assigneeIds: string[]) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ assignee_ids: assigneeIds })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
