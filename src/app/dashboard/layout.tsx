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
        <header className="flex h-16 items-center justify-between bg-card border-b border-border px-8 transition-all">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
            <div className="h-5 w-[1px] bg-border" />
            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border">
               <span className="text-[11px] font-semibold text-muted-foreground">Search anything...</span>
               <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                 <span className="text-xs">⌘</span>K
               </kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <ThemeToggle />
             <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm font-bold text-xs">
                {user.email?.[0].toUpperCase()}
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto px-8 py-8 transition-all">
          <div className="h-full w-full">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
