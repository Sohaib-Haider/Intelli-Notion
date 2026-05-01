'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getWorkspaces() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching workspaces:', error.message || JSON.stringify(error))
    return []
  }
  return data
}

export async function createWorkspace(formData: FormData) {
  const name = formData.get('name') as string
  if (!name) return { error: 'Name is required' }

  const supabase = await createClient()
  console.log("RPC Calling create_new_workspace with name:", name)
  
  const { data: workspace, error } = await supabase.rpc('create_new_workspace', {
    workspace_name: name
  })

  if (error) {
    console.error("RPC Error:", error)
    return { error: error.message }
  }

  console.log("RPC Success, new workspace:", workspace)
  revalidatePath('/dashboard', 'layout')
  return { success: true, workspace }
}

export async function getWorkspaceFeatures(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspace_features')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching features:', error)
    return []
  }
  return data
}

export async function createFeature(workspaceId: string, type: string, title: string) {
  const supabase = await createClient()
  
  const { data: feature, error } = await supabase
    .from('workspace_features')
    .insert([{ workspace_id: workspaceId, type, title }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true, feature }
}

export async function deleteWorkspace(workspaceId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function deleteFeature(featureId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_features')
    .delete()
    .eq('id', featureId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}


