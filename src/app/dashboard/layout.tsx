import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import { createClient } from "@/utils/supabase/server"
import { getWorkspaces } from "@/lib/actions/workspace"
import { redirect } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const workspaces = await getWorkspaces()

  return (
    <SidebarProvider>
      <WorkspaceSidebar workspaces={workspaces || []} user={user} />
      <main className="flex flex-1 flex-col overflow-hidden bg-background transition-all duration-300">
        <header className="flex h-20 items-center justify-between px-10 transition-all">
          <div className="flex items-center gap-6">
            <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors h-10 w-10" />
            <div className="flex flex-col">
               <h1 className="text-2xl font-black text-foreground tracking-tight">Morning, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}!</h1>
               <p className="text-xs text-muted-foreground font-medium">Here's what's on your agenda today.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-2xl border border-border/50 w-64 shadow-sm">
               <span className="text-[11px] font-semibold text-muted-foreground">Search for some activities...</span>
               <kbd className="ml-auto h-5 select-none items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                 <span className="text-xs">⌘</span>K
               </kbd>
            </div>
            <ThemeToggle />
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 font-bold text-sm">
               {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto px-10 pb-10 transition-all">
          <div className="h-full w-full">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
