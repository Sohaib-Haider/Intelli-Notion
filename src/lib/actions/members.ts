'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

export const getMembers = unstable_cache(
  async (workspaceId: string) => {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error fetching members:', error)
      return []
    }
    return data
  },
  ['workspace_members_raw'],
  { revalidate: 30, tags: ['workspace_members_raw'] }
)

export const getInvites = unstable_cache(
  async (workspaceId: string) => {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('workspace_id', workspaceId)
      
    return data || []
  },
  ['workspace_invites'],
  { revalidate: 30, tags: ['workspace_invites'] }
)

export async function createInvite(workspaceId: string, email: string, role: string) {
  const supabase = await createClient()
  
  // Generate a random token
  const token = crypto.randomUUID()
  
  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  
  const { error } = await supabase
    .from('workspace_invites')
    .insert([{
      workspace_id: workspaceId,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString()
    }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // In production, send email here.
  revalidatePath('/dashboard', 'layout')
  revalidateTag('workspace_invites', 'max')
  return { success: true, token }
}

export const getInvite = unstable_cache(
  async (token: string) => {
    const supabase = await createAdminClient()
    // Since workspaces table has an RLS policy checking workspace_members,
    // an unauthenticated user or non-member CANNOT read the workspace name.
    // Wait! A user accepting an invite isn't a member yet, so they can't read `workspaces` table!
    // To fix this, we can just get the invite.
    const { data, error } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (error) return null
    return data
  },
  ['invite_by_token'],
  { revalidate: 30, tags: ['workspace_invites'] }
)

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to accept an invite.' }
  }

  // 1. Get the invite
  const { data: invite, error: inviteError } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return { error: 'Invalid or expired invite token.' }
  }

  // Check expiration
  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This invite has expired.' }
  }

  // 2. Add user to workspace_members
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert([{
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role
    }])

  if (memberError && memberError.code !== '23505') { 
    return { error: 'Failed to join workspace.' }
  }

  // 3. Delete the invite token
  await supabase
    .from('workspace_invites')
    .delete()
    .eq('token', token)

  revalidatePath('/dashboard', 'layout')
  revalidateTag('workspace_invites', 'max')
  revalidateTag('workspace_members_raw', 'max')
  revalidateTag('workspace_members', 'max')
  return { success: true, workspaceId: invite.workspace_id }
}

export async function updateMemberRole(workspaceId: string, userId: string, role: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_members')
    .update({ role })
    .match({ workspace_id: workspaceId, user_id: userId })

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  revalidateTag('workspace_members_raw', 'max')
  revalidateTag('workspace_members', 'max')
  return { success: true }
}

export async function removeMember(workspaceId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .match({ workspace_id: workspaceId, user_id: userId })

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  revalidateTag('workspace_members_raw', 'max')
  revalidateTag('workspace_members', 'max')
  return { success: true }
}
