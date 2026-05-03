import { createClient } from '@/utils/supabase/server'
import { getWorkspaces } from '@/lib/actions/workspace'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const [{ data: { user } }, workspaces] = await Promise.all([
    supabase.auth.getUser(),
    getWorkspaces()
  ])

  if (!user) {
    redirect('/login')
  }

  if (workspaces && workspaces.length > 0) {
    redirect(`/dashboard/${workspaces[0].id}`)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-zinc-100">
      <div className="flex max-w-[420px] flex-col items-center space-y-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
          <Plus className="h-10 w-10 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">No workspaces found</h2>
        <p className="text-sm text-zinc-400">
          You don&apos;t have any workspaces yet. Create one from the sidebar to get started.
        </p>
      </div>
    </div>
  )
}
