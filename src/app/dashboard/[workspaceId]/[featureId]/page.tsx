import { getWorkspaceFeatures } from '@/lib/actions/workspace'
import { TaskTracker } from '@/components/features/task-tracker'
import { OutreachLog } from '@/components/features/outreach-log'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getTasks, getWorkspaceMembers } from '@/lib/actions/tasks'
import { getOutreachLogs } from '@/lib/actions/outreach'

interface PageProps {
  params: Promise<{ workspaceId: string, featureId: string }>
}

export default async function FeaturePage({ params }: PageProps) {
  const { workspaceId, featureId } = await params
  const supabase = await createClient()
  const [features, { data: { user } }] = await Promise.all([
    getWorkspaceFeatures(workspaceId),
    supabase.auth.getUser()
  ])
  const activeFeature = features.find(f => f.id === featureId)
  
  if (!user) {
    redirect('/login')
  }

  if (!activeFeature) {
    return <div className="text-zinc-400 p-8">Feature not found</div>
  }

  const queryClient = new QueryClient()

  const prefetchPromises = [
    queryClient.prefetchQuery({
      queryKey: ['members', workspaceId],
      queryFn: () => getWorkspaceMembers(workspaceId),
    })
  ]

  if (activeFeature.type === 'TASK_TRACKER') {
    prefetchPromises.push(queryClient.prefetchQuery({
      queryKey: ['tasks', featureId],
      queryFn: () => getTasks(featureId),
    }))
  } else if (activeFeature.type === 'OUTREACH_LOG') {
    prefetchPromises.push(queryClient.prefetchQuery({
      queryKey: ['outreach_logs', featureId],
      queryFn: () => getOutreachLogs(featureId),
    }))
  }

  await Promise.all(prefetchPromises)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-full w-full">
        {activeFeature.type === 'TASK_TRACKER' ? (
          <TaskTracker 
            workspaceId={workspaceId} 
            featureId={featureId} 
            currentUser={user} 
          />
        ) : activeFeature.type === 'OUTREACH_LOG' ? (
          <OutreachLog
            workspaceId={workspaceId}
            featureId={featureId}
            currentUser={user}
          />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 flex items-center justify-center min-h-[400px]">
            <p className="text-zinc-500">
              This is where the <strong className="text-zinc-300">{activeFeature.type}</strong> component will be rendered.
            </p>
          </div>
        )}
      </div>
    </HydrationBoundary>
  )
}
