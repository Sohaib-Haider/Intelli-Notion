import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UnifiedCalendar } from '@/components/features/unified-calendar'
import { getWorkspaceTasks, getWorkspaceOutreachLogs } from '@/lib/actions/calendar'
import { getWorkspaceMembers } from '@/lib/actions/tasks'

interface PageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function CalendarPage({ params }: PageProps) {
  const { workspaceId } = await params
  const supabase = await createClient()

  // Run user session fetch and the data fetches in parallel
  const [{ data: { user } }, tasks, outreachLogs, members] = await Promise.all([
    supabase.auth.getUser(),
    getWorkspaceTasks(workspaceId),
    getWorkspaceOutreachLogs(workspaceId),
    getWorkspaceMembers(workspaceId)
  ])

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="h-full w-full">
      <UnifiedCalendar 
        tasks={tasks}
        outreachLogs={outreachLogs}
        members={members}
        currentUser={user}
      />
    </div>
  )
}
