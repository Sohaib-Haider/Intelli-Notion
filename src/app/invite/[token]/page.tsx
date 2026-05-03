import { getInvite, acceptInvite } from '@/lib/actions/members'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  const invite = await getInvite(token)

  if (!invite) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Invalid Invite</h1>
          <p className="text-zinc-400">This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  async function handleAccept() {
    'use server'
    const res = await acceptInvite(token)
    if (res.success) {
      redirect(`/dashboard/${res.workspaceId}`)
    } else {
      redirect(`/dashboard?error=failed_to_join`)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-6 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-900/30 border border-blue-800">
          <CheckCircle className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">You&apos;ve been invited!</h1>
          <p className="text-zinc-400">
            You have been invited to join the workspace as a <strong className="text-zinc-200 capitalize">{invite.role}</strong>.
          </p>
        </div>
        <form action={handleAccept}>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 text-lg rounded-lg">
            Accept Invitation
          </Button>
        </form>
      </div>
    </div>
  )
}
