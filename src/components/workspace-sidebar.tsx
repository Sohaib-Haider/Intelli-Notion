'use client'

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, usePathname } from "next/navigation"
import { Check, ChevronsUpDown, Plus, SquareTerminal, Loader2, LogOut, Settings, Trash2, Sun, Moon, BarChart3, ChevronRight, Calendar } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getMemberColor } from "@/lib/colors"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWorkspace, createFeature, getWorkspaceFeatures, deleteFeature } from "@/lib/actions/workspace"
import { logout } from "@/app/dashboard/actions"
import { useQueryClient } from "@tanstack/react-query"
import { getTasks, getWorkspaceMembers } from "@/lib/actions/tasks"
import { getOutreachLogs } from "@/lib/actions/outreach"

interface Workspace {
  id: string
  name: string
}

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface Feature {
  id: string
  title: string
  type: 'TASK_TRACKER' | 'OUTREACH_LOG'
}

export function WorkspaceSidebar({ 
  workspaces, 
  user 
}: { 
  workspaces: Workspace[], 
  user: User 
}) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  
  const workspaceId = params.workspaceId as string
  const activeWorkspace = workspaces.find(w => w.id === workspaceId) || workspaces[0]

  const [features, setFeatures] = React.useState<Feature[]>([])
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = React.useState(false)
  const [isFeatureModalOpen, setIsFeatureModalOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])


  React.useEffect(() => {
    let active = true
    const loadFeatures = async () => {
      if (activeWorkspace) {
        const data = await getWorkspaceFeatures(activeWorkspace.id)
        if (active) setFeatures(data || [])
      } else {
        if (active) setFeatures([])
      }
    }
    loadFeatures()
    return () => { active = false }
  }, [activeWorkspace])

  async function handleCreateWorkspace(formData: FormData) {
    setIsLoading(true)
    try {
      const result = await createWorkspace(formData)
      if (result.success) {
        setIsWorkspaceModalOpen(false)
        router.push(`/dashboard/${result.workspace.id}`)
        router.refresh()
      } else {
        alert("Error: " + (result.error || "Failed to create workspace"))
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error"
      alert("System Error: " + message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddFeature(type: string, title: string) {
    if (!activeWorkspace) return
    setIsLoading(true)
    const result = await createFeature(activeWorkspace.id, type, title)
    if (result.success) {
      setIsFeatureModalOpen(false)
      setFeatures([...features, result.feature])
      router.push(`/dashboard/${activeWorkspace.id}/${result.feature.id}`)
    }
    setIsLoading(false)
  }

  async function handleDeleteFeature(featureId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this feature? This will remove all associated data.')) {
      setIsLoading(true)
      const res = await deleteFeature(featureId)
      if (res.success) {
        if (activeWorkspace) {
          getWorkspaceFeatures(activeWorkspace.id).then(setFeatures)
        }
      } else {
        alert(res.error)
      }
      setIsLoading(false)
    }
  }

  return (
    <Sidebar collapsible="icon" variant="floating" className="p-4">
      {/* Create Workspace modal */}
      <Dialog open={isWorkspaceModalOpen} onOpenChange={setIsWorkspaceModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border border-border text-card-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold">Create Workspace</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Workspaces are isolated environments for your projects.
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreateWorkspace}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-foreground font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Workspace"
                  className="col-span-3 border-border bg-background text-foreground focus-visible:ring-primary rounded-xl"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SidebarHeader className="bg-background rounded-t-[32px] border-b border-zinc-200 dark:border-white/5 pb-2 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <SidebarMenuButton
                    {...props}
                    size="lg"
                    className="data-[state=open]:bg-accent rounded-xl hover:bg-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                  >
                    <div className="flex aspect-square size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                      <SquareTerminal className="size-5" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-bold tracking-tight text-[14px] text-foreground">
                        {activeWorkspace?.name || "Select Workspace"}
                      </span>
                      <span className="truncate text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none">Free Plan</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                )}
              />
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-card border border-border text-card-foreground p-2 shadow-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest px-2 py-1.5 leading-none">Workspaces</DropdownMenuLabel>
                </DropdownMenuGroup>
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => router.push(`/dashboard/${workspace.id}`)}
                    className="gap-2 p-2 hover:bg-accent cursor-pointer rounded-lg text-foreground"
                  >
                    <div className="flex size-6 items-center justify-center rounded-lg border border-border bg-muted">
                      <SquareTerminal className="size-4 shrink-0 text-primary" />
                    </div>
                    {workspace.name}
                    {workspace.id === activeWorkspace?.id && <Check className="ml-auto size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-border my-1" />
                <DropdownMenuItem
                  onSelect={() => setIsWorkspaceModalOpen(true)}
                  className="gap-2 p-2 hover:bg-accent cursor-pointer rounded-lg text-foreground"
                >
                  <div className="flex size-6 items-center justify-center rounded-lg border border-border bg-muted">
                    <Plus className="size-4 text-primary" />
                  </div>
                  <div className="font-medium">New Workspace</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-background group-data-[collapsible=icon]:px-0 px-0">
        <div className="flex flex-col h-full">
        {workspaces.length === 0 && (
          <div className="px-4 py-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center">
              <SquareTerminal className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">No workspaces</h3>
              <p className="text-[13px] text-zinc-600 dark:text-white/70 px-4 leading-relaxed font-medium">Create your first workspace to start collaborating.</p>
            </div>
            <Button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </div>
        )}

        {activeWorkspace && (
          <>
            <SidebarMenu className="mt-2 px-3 space-y-2 group-data-[collapsible=icon]:px-0">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 group-data-[collapsible=icon]:hidden">
              Features
            </div>
            
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(props) => <Link {...props} href={`/dashboard/${activeWorkspace.id}/calendar`} prefetch={true} />}
                isActive={pathname?.includes('/calendar') ?? false}
                tooltip="Calendar"
                className={cn(
                  "group/menu-button flex h-12 items-center gap-3 rounded-xl px-2 transition-all duration-200 font-medium text-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:h-12",
                  pathname?.includes('/calendar')
                    ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-white font-bold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                  pathname?.includes('/calendar')
                    ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/40" 
                    : "bg-muted text-muted-foreground group-hover:bg-accent-foreground/10"
                )}>
                  <Calendar className="size-4.5" />
                </div>
                <span className="flex-1 group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden font-bold tracking-tight text-sm">Calendar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {features.map((feature) => {
              const isActive = params.featureId === feature.id
              return (
                <SidebarMenuItem key={feature.id}>
                  <SidebarMenuButton
                    render={(props) => <Link {...props} href={`/dashboard/${activeWorkspace.id}/${feature.id}`} prefetch={true} onMouseEnter={() => {
                      if (feature.type === 'TASK_TRACKER') {
                        queryClient.prefetchQuery({ queryKey: ['tasks', feature.id], queryFn: () => getTasks(feature.id), staleTime: 30_000 })
                      } else if (feature.type === 'OUTREACH_LOG') {
                        queryClient.prefetchQuery({ queryKey: ['outreach_logs', feature.id], queryFn: () => getOutreachLogs(feature.id), staleTime: 30_000 })
                      }
                      queryClient.prefetchQuery({ queryKey: ['members', activeWorkspace.id], queryFn: () => getWorkspaceMembers(activeWorkspace.id), staleTime: 30_000 })
                    }} />}
                    isActive={isActive}
                    tooltip={feature.title}
                    className={cn(
                      "group/menu-button flex h-12 items-center gap-3 rounded-xl px-2 transition-all duration-200 font-medium text-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:h-12",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-white font-bold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                      isActive 
                        ? (feature.type === 'OUTREACH_LOG' 
                            ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/40" 
                            : "bg-[#10B981] text-white shadow-lg shadow-[#10B981]/40")
                        : "bg-muted text-muted-foreground group-hover:bg-accent-foreground/10"
                    )}>
                      {feature.type === 'OUTREACH_LOG' ? <BarChart3 className="size-4.5" /> : <Check className="size-4.5" />}
                    </div>
                    <span className="flex-1 group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden font-bold tracking-tight text-sm">{feature.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover/menu-button:opacity-100 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg group-data-[collapsible=icon]:hidden"
                      onClick={(e) => handleDeleteFeature(feature.id, e)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}

            {/* Add Feature */}
            <SidebarMenuItem className="mt-1">
              <Dialog open={isFeatureModalOpen} onOpenChange={setIsFeatureModalOpen}>
                <DialogTrigger render={(props) => (
                  <SidebarMenuButton 
                    className="h-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/10 transition-all font-bold text-sm text-foreground"
                    render={(props) => (
                      <button {...props}>
                        <Plus className="size-4 text-primary" />
                        <span className="group-data-[collapsible=icon]:hidden">Add Feature</span>
                      </button>
                    )}
                  />
                )}>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px] bg-card border border-border text-card-foreground rounded-2xl shadow-xl p-0 overflow-hidden">
                  <div className="bg-primary/5 border-b border-border px-6 py-5">
                    <DialogTitle className="text-lg font-bold text-foreground">Add Feature</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm mt-0.5">
                      Select a feature to add to this workspace.
                    </DialogDescription>
                  </div>
                  <div className="p-6 grid gap-3">
                    <button
                      onClick={() => handleAddFeature('TASK_TRACKER', 'Tasks Tracker')}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-[#10B981]/50 hover:bg-[#10B981]/5 transition-all text-left group shadow-sm"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[13.5px] text-foreground tracking-tight">Task Tracker</h4>
                        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 mt-0.5 leading-normal">Stay organized with tasks, your way.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddFeature('OUTREACH_LOG', 'Outreach Log')}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 transition-all text-left group shadow-sm"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[13.5px] text-foreground tracking-tight">Outreach Log</h4>
                        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 mt-0.5 leading-normal">Track and analyze your outreach efforts.</p>
                      </div>
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarMenu className="mt-auto px-3 space-y-2 group-data-[collapsible=icon]:px-0">
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(props) => (
                  <Link {...props} href={`/dashboard/${activeWorkspace.id}/settings`} prefetch={true} className="flex items-center w-full">
                     <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground group-hover:bg-accent transition-all">
                      <Settings className="size-4.5" />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden ml-3 font-bold tracking-tight">Settings</span>
                    <ChevronRight className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </Link>
                )}
                className="h-12 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-sm group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
              />
            </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
        </div>
      </SidebarContent>

      <SidebarFooter className="bg-background rounded-b-[32px] border-t border-zinc-200 dark:border-white/5 pt-2 px-3 group-data-[collapsible=icon]:px-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={(props) => (
                <SidebarMenuButton
                  {...props}
                  size="lg"
                  className="rounded-xl data-[state=open]:bg-accent hover:bg-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <Avatar className="h-9 w-9 rounded-full shrink-0 mx-auto transition-all duration-300 border-2 border-border shadow-sm">
                    <AvatarFallback 
                      className="rounded-full text-white font-bold text-sm shadow-md"
                      style={{ backgroundColor: getMemberColor(user?.id) }}
                    >
                      {(user?.user_metadata?.full_name || user?.email)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-foreground">
                      {user?.user_metadata?.full_name || user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              )} />
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-card border border-border text-card-foreground shadow-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-3 py-2.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-xl">
                        <AvatarFallback 
                          className="rounded-xl text-white font-bold"
                          style={{ backgroundColor: getMemberColor(user?.id) }}
                        >
                          {(user?.user_metadata?.full_name || user?.email)?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-bold text-[13px] text-foreground tracking-tight">{user?.user_metadata?.full_name || user?.email}</span>
                        <span className="truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-500">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="gap-2 p-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-lg text-foreground text-sm"
                  >
                    {mounted ? (
                      theme === 'dark' ? <Sun className="size-4 text-primary" /> : <Moon className="size-4 text-primary" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>{mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Loading Theme...'}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem render={
                  <form action={logout}>
                    <button type="submit" className="flex w-full items-center px-2 py-1.5 cursor-pointer hover:bg-accent text-sm text-foreground outline-none rounded-lg gap-2">
                      <LogOut className="h-4 w-4 text-destructive" />
                      Log out
                    </button>
                  </form>
                } />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
