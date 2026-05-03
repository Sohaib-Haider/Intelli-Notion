import { redirect } from 'next/navigation'
import { getWorkspaceFeatures } from '@/lib/actions/workspace'
import { SquareTerminal } from 'lucide-react'

// Define the params interface correctly for Next.js App Router
interface PageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: PageProps) {
  const { workspaceId } = await params
  const features = await getWorkspaceFeatures(workspaceId)
  
  if (features && features.length > 0) {
    redirect(`/dashboard/${workspaceId}/${features[0].id}`)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-zinc-100">
      <div className="flex max-w-[420px] flex-col items-center space-y-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
          <SquareTerminal className="h-10 w-10 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to your workspace</h2>
        <p className="text-sm text-zinc-400">
          Select a feature from the sidebar or click &quot;Add Feature&quot; to get started.
        </p>
      </div>
    </div>
  )
}
