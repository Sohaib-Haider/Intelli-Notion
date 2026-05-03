import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import { createClient } from "@/utils/supabase/server"
import { getWorkspaces } from "@/lib/actions/workspace"
import { redirect } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { getMemberColor } from "@/lib/colors"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const [{ data: { user } }, workspaces] = await Promise.all([
    supabase.auth.getUser(),
    getWorkspaces()
  ])

  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <WorkspaceSidebar workspaces={workspaces || []} user={user} />
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-zinc-400 dark:text-white/40 hover:text-primary transition-all h-8 w-8 hover:scale-105 active:scale-95" />
            <div className="flex flex-col gap-0">
               <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">Morning, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}!</h1>
               <p className="text-xs text-muted-foreground font-medium tracking-tight mt-0.5">Here&apos;s what&apos;s on your agenda today.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-zinc-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/5 w-64 transition-all hover:bg-zinc-100 dark:hover:bg-white/10 group">
               <span className="text-xs font-medium text-zinc-400 dark:text-white/30 group-hover:text-zinc-600 dark:group-hover:text-white/50 transition-colors">Search for tasks, logs...</span>
               <kbd className="ml-auto h-5 select-none items-center gap-1 rounded border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-1.5 font-mono text-[10px] font-medium text-zinc-400 dark:text-white/30">
                 <span className="text-[10px]">⌘</span>K
               </kbd>
            </div>
            <ThemeToggle />
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center text-white shadow-sm font-semibold text-xs border border-white/10"
              style={{ backgroundColor: getMemberColor(user.id) }}
            >
               {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-6 transition-all scroll-smooth">
          <div className="min-h-full w-full">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
