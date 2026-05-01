import { getWorkspaceFeatures } from '@/lib/actions/workspace'
import { TaskTracker } from '@/components/features/task-tracker'
import { OutreachLog } from '@/components/features/outreach-log'
import { createClient } from '@/utils/supabase/server'

interface PageProps {
  params: Promise<{ workspaceId: string, featureId: string }>
}

export default async function FeaturePage({ params }: PageProps) {
  const { workspaceId, featureId } = await params
  const features = await getWorkspaceFeatures(workspaceId)
  const activeFeature = features.find(f => f.id === featureId)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!activeFeature) {
    return <div className="text-zinc-400 p-8">Feature not found</div>
  }

  return (
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
  )
}
