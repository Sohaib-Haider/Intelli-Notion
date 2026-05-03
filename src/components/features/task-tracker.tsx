'use client'

import * as React from 'react'
import { Plus, CheckCircle2, Circle, Clock, Filter, Search, ArrowUpDown, Trash2, ChevronLeft, ChevronRight, Check, MessageSquare, Paperclip } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RichTextEditor } from '@/components/rich-text-editor'
import { getTasks, getWorkspaceMembers, createTask, updateTaskStatus, deleteTask, updateTaskAssignees } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'
import { getMemberColor } from '@/lib/colors'
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}


interface Task {
  id: string
  title: string
  status: string
  description?: string
  assignee_id?: string
  assignee_ids?: string[]
  created_at: string
  profiles?: {
    full_name?: string
  }
}

interface Member {
  user_id: string
  profiles?: {
    full_name?: string
  }
}

export function TaskTracker({ workspaceId, featureId, currentUser }: { workspaceId: string, featureId: string, currentUser: { id: string } }) {
  const queryClient = useQueryClient()
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', featureId],
    queryFn: () => getTasks(featureId),
    staleTime: 60_000,
    gcTime: 300_000,
    placeholderData: keepPreviousData,
  })

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId),
    staleTime: 60_000,
    gcTime: 300_000,
    placeholderData: keepPreviousData,
  })

  const tasks = tasksData || []
  const members = membersData || []
  const [isNewTaskOpen, setIsNewTaskOpen] = React.useState(false)
  
  const [newTaskTitle, setNewTaskTitle] = React.useState('')
  const [newTaskStatus, setNewTaskStatus] = React.useState<string>('To Do')
  const [isDark, setIsDark] = React.useState(true)

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  const [newTaskDescription, setNewTaskDescription] = React.useState('')
  const [newTaskAssignees, setNewTaskAssignees] = React.useState<string[]>([])
  const [newTaskDueDate, setNewTaskDueDate] = React.useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [calendarView, setCalendarView] = React.useState<'day' | 'week' | 'month'>('day')
  const [selectedDate, setSelectedDate] = React.useState(new Date())
  const dayScrollRef = React.useRef<HTMLDivElement>(null)

  const scrollDays = (direction: 'left' | 'right') => {
    if (dayScrollRef.current) {
      const scrollAmount = 300
      dayScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    const result = await createTask(workspaceId, featureId, {
      title: newTaskTitle,
      status: newTaskStatus,
      assignee_ids: newTaskAssignees,
      description: newTaskDescription,
      date: newTaskDueDate
    })
    
    if (result.success) {
      setIsNewTaskOpen(false)
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskAssignees([])
      setNewTaskStatus('To Do')
      queryClient.invalidateQueries({ queryKey: ['tasks', featureId] })
    } else {
      alert("Error creating task: " + result.error)
    }
    setIsSubmitting(false)
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    queryClient.setQueryData(['tasks', featureId], (old: Task[]) => 
      old?.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )
    const result = await updateTaskStatus(taskId, newStatus)
    if (result?.error) queryClient.invalidateQueries({ queryKey: ['tasks', featureId] })
  }

  async function handleAssigneesChange(taskId: string, newAssigneeIds: string[]) {
    queryClient.setQueryData(['tasks', featureId], (old: Task[]) => 
      old?.map(t => t.id === taskId ? { ...t, assignee_ids: newAssigneeIds } : t)
    )
    const result = await updateTaskAssignees(taskId, newAssigneeIds)
    if (result?.error) {
      queryClient.invalidateQueries({ queryKey: ['tasks', featureId] })
      alert(result.error)
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      queryClient.setQueryData(['tasks', featureId], (old: Task[]) => 
        old?.filter(t => t.id !== taskId)
      )
      const result = await deleteTask(taskId)
      if (result?.error) {
        queryClient.invalidateQueries({ queryKey: ['tasks', featureId] })
        alert(result.error)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Done':
        return <Badge variant="outline" className="bg-[#10B981] text-white border-transparent shadow-sm"><CheckCircle2 className="mr-1 h-3 w-3" /> Done</Badge>
      case 'In Progress':
        return <Badge variant="outline" className="bg-[#A855F7] text-white border-transparent shadow-sm"><Clock className="mr-1 h-3 w-3" /> In Progress</Badge>
      default:
        return <Badge variant="outline" className="bg-[#06B6D4] text-white border-transparent shadow-sm"><Circle className="mr-1 h-3 w-3" /> To Do</Badge>
    }
  }



  return (
    <div className="flex flex-col bg-background text-foreground transition-all duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter leading-tight">Tasks Tracker</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">Live Workspace Feed</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-100 dark:bg-white/5 rounded-2xl p-1 border border-zinc-200 dark:border-white/5">
             <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 dark:text-white/40 hover:text-primary rounded-xl transition-all"><Search className="h-4.5 w-4.5" /></Button>
             <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 dark:text-white/40 hover:text-primary rounded-xl transition-all"><Filter className="h-4.5 w-4.5" /></Button>
          </div>
          
          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogTrigger render={<button className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-95 text-sm" />}>
              <Plus className="mr-2 h-5 w-5" /> New Task
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col bg-card dark:bg-[#0D0E12] border border-border text-card-foreground p-0 overflow-hidden rounded-[32px] shadow-2xl transition-all duration-500">
              <div className="bg-linear-to-br from-[#4F6EF7] via-[#6366F1] to-[#8B5CF6] p-12 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-70">Task Management</span>
                  </div>
                  <DialogHeader>
                    <DialogTitle className="text-4xl font-black tracking-tighter leading-none">Create Task</DialogTitle>
                    <p className="text-white/70 text-sm mt-3 font-medium max-w-[280px] leading-relaxed">Organize your workflow by defining new objectives and assigning them.</p>
                  </DialogHeader>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-background/50 backdrop-blur-xl">
                <form onSubmit={handleCreateTask} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Task Title</label>
                    <Input 
                      placeholder="What needs to be done?"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="h-16 border-border bg-muted/30 rounded-[24px] focus:ring-4 focus:ring-primary/10 text-xl font-bold transition-all hover:bg-muted/50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Due Date</label>
                      <Input 
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="h-14 border-border bg-muted/30 rounded-[20px] focus:ring-4 focus:ring-primary/10 font-bold transition-all hover:bg-muted/50"
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Status</label>
                      <Select value={newTaskStatus} onValueChange={(val) => setNewTaskStatus(val || 'To Do')}>
                        <SelectTrigger className="h-14 border-border bg-muted/30 rounded-[20px] focus:ring-4 focus:ring-primary/10 font-bold transition-all hover:bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-[24px] border-border shadow-2xl p-2 bg-popover/90 backdrop-blur-xl">
                          <SelectItem value="To Do" className="rounded-xl h-11 font-medium">To Do</SelectItem>
                          <SelectItem value="In Progress" className="rounded-xl h-11 font-medium">In Progress</SelectItem>
                          <SelectItem value="Done" className="rounded-xl h-11 font-medium">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Assign Members</label>
                    <div className="flex flex-wrap gap-2 p-6 border border-border bg-muted/30 rounded-[28px] min-h-[100px] transition-all hover:bg-muted/40">
                      {members.map(member => (
                        <button
                          key={member.user_id}
                          type="button"
                          onClick={() => {
                            if (newTaskAssignees.includes(member.user_id)) {
                              setNewTaskAssignees(prev => prev.filter(id => id !== member.user_id))
                            } else {
                              setNewTaskAssignees(prev => [...prev, member.user_id])
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all border",
                            newTaskAssignees.includes(member.user_id)
                              ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20 scale-105"
                              : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-primary/50"
                          )}
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[11px] font-black" style={{ backgroundColor: getMemberColor(member.user_id) }}>
                              {member.profiles?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {member.profiles?.full_name?.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Description</label>
                    <div className="rounded-[28px] overflow-hidden border border-border transition-all hover:border-primary/30">
                      <RichTextEditor 
                        value={newTaskDescription} 
                        onChange={setNewTaskDescription} 
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsNewTaskOpen(false)} 
                      className="flex-1 h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="flex-[2] h-16 bg-linear-to-r from-[#4F6EF7] to-[#6366F1] hover:from-[#6366F1] hover:to-[#4F6EF7] text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
        <TabsList className="bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/5 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground shadow-sm rounded-lg transition-all px-5 py-1.5 font-bold text-[10.5px] uppercase tracking-widest text-zinc-500">
              Overview
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground shadow-sm rounded-lg transition-all px-5 py-1.5 font-bold text-[10.5px] uppercase tracking-widest text-zinc-500">
              Kanban
            </TabsTrigger>
            <TabsTrigger value="me" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground shadow-sm rounded-lg transition-all px-5 py-1.5 font-bold text-[10.5px] uppercase tracking-widest text-zinc-500">
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground shadow-sm rounded-lg transition-all px-5 py-1.5 font-bold text-[10.5px] uppercase tracking-widest text-zinc-500">
              List
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 mt-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {(isLoadingTasks || isLoadingMembers) && !tasksData ? (
              <TableSkeleton rows={5} />
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/50 hover:bg-transparent">
                   <TableHead className="text-muted-foreground font-semibold">Task name</TableHead>
                   <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                   <TableHead className="text-muted-foreground font-semibold">Assignee</TableHead>
                   <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                  <TableHead className="text-right text-muted-foreground font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="border-border hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center text-left group-hover:text-primary transition-colors">
                        <span className="truncate max-w-[300px]">{task.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select value={task.status} onValueChange={(val) => handleStatusChange(task.id, val || 'To Do')}>
                          <SelectTrigger hideIcon className="bg-transparent border-0 h-auto p-0 hover:bg-muted/50 focus:ring-0">
                            {getStatusBadge(task.status)}
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="To Do">To Do</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger className="flex h-auto p-1 hover:bg-muted justify-start w-full rounded-md border-0 items-center bg-transparent text-sm">
                            {task.assignee_ids && task.assignee_ids.length > 0 ? (
                              <div className="flex gap-1 overflow-x-auto scrollbar-hide max-w-[150px] items-center">
                                {task.assignee_ids.map((id: string) => {
                                  const m = members.find(mem => mem.user_id === id)
                                  const name = m ? (m.profiles?.full_name?.split(' ')[0] || `User`) : 'Unknown'
                                  return (
                                    <span key={id} className="text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wider whitespace-nowrap text-white" style={{ backgroundColor: getMemberColor(id) }}>
                                      {name}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-zinc-500 text-sm">Unassigned</span>
                            )}
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0 bg-card border-border">
                            <div className="p-2 space-y-1">
                              {members.map(m => {
                                const isSelected = (task.assignee_ids || []).includes(m.user_id)
                                return (
                                  <div key={m.user_id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => {
                                    const newIds = isSelected 
                                      ? (task.assignee_ids || []).filter((id: string) => id !== m.user_id)
                                      : [...(task.assignee_ids || []), m.user_id]
                                    handleAssigneesChange(task.id, newIds)
                                  }}>
                                    <Checkbox checked={isSelected} className="border-border data-[state=checked]:bg-[#4F6EF7] data-[state=checked]:border-[#4F6EF7] pointer-events-none" />
                                    <span className="text-sm text-foreground flex-1">{m.user_id === currentUser.id ? 'Me' : (m.profiles?.full_name || `User ${m.user_id.substring(0,4)}`)}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-950/30" onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTask(task.id)
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                      No tasks found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="status" className="flex-1 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {['To Do', 'In Progress', 'Done'].map(columnStatus => (
              <div key={columnStatus} className="flex flex-col bg-zinc-50/50 dark:bg-[#0D0E12] rounded-2xl p-4 border border-zinc-200/50 dark:border-white/[0.03]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">{columnStatus}</span>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 bg-zinc-200/50 dark:bg-white/5 px-2 py-0.5 rounded-md">
                      {tasks.filter(t => t.status === columnStatus).length}
                    </span>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-zinc-400 cursor-pointer hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                  {tasks.filter(t => t.status === columnStatus).map(task => {
                    const memberId = task.assignee_id || ''
                    const memberColor = getMemberColor(memberId)
                    const member = members.find(m => m.user_id === memberId)
                    const firstName = member?.profiles?.full_name?.split(' ')[0] || 'Member'

                    return (
                      <div 
                        key={task.id} 
                        onClick={() => {
                          setSelectedTask(task)
                          setIsDetailOpen(true)
                        }}
                        className={cn(
                          "group p-8 rounded-[40px] transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] min-h-[260px] flex flex-col justify-between",
                          "bg-white/70 dark:bg-white/[0.03] backdrop-blur-[10px] border border-zinc-200 dark:border-white/10",
                          "shadow-xl shadow-black/5 dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]"
                        )}
                      >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 flex flex-col h-full justify-between">
                          {/* Header Row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5 border border-zinc-200/50 dark:border-white/10 shadow-sm">
                                <AvatarFallback className="text-[9px] font-bold text-white" style={{ backgroundColor: memberColor }}>
                                  {firstName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 tracking-tight">{firstName}</span>
                            </div>
                            <div className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                              task.status === 'Done' ? "bg-emerald-500/10 text-emerald-500" : task.status === 'In Progress' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                              {task.status}
                            </div>
                          </div>

                          <div className="space-y-1.5 mb-4">
                            <h4 className="text-[13.5px] font-bold text-zinc-900 dark:text-white leading-tight tracking-tight">{task.title}</h4>
                            {task.description && (
                              <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 line-clamp-2 leading-normal" dangerouslySetInnerHTML={{ __html: task.description }} />
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/[0.03]">
                            <div className="flex -space-x-1.5">
                              {task.assignee_ids?.slice(0, 3).map((id: string) => (
                                <Avatar key={id} className="h-5 w-5 border-2 border-white dark:border-[#0D0E12] shadow-sm">
                                  <AvatarFallback className="text-[9px] font-bold text-white" style={{ backgroundColor: getMemberColor(id) }}>
                                    {members.find(m => m.user_id === id)?.profiles?.full_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                               <div className="flex items-center gap-1">
                                 <MessageSquare className="h-3 w-3" />
                                 <span className="text-[10px] font-medium">0</span>
                               </div>
                               <div className="flex items-center gap-1">
                                 <Paperclip className="h-3 w-3" />
                                 <span className="text-[10px] font-medium">0</span>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/60 justify-start" onClick={() => {
                    setNewTaskStatus(columnStatus)
                    setIsNewTaskOpen(true)
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> New task
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="me" className="flex-1 mt-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-semibold">Task name</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.filter(t => t.assignee_id === currentUser?.id).map((task) => (
                  <TableRow key={task.id} className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <button 
                        onClick={() => setSelectedTask(task)}
                        className="hover:text-[#4F6EF7] transition-colors"
                      >
                        {task.title}
                      </button>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.filter(t => t.assignee_id === currentUser?.id).length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No tasks assigned to you.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="flex-1 mt-4">
          <div className="max-w-3xl space-y-2">
            {tasks.map(task => {
              const memberColor = getMemberColor(task.assignee_id || '')
              return (
                <div 
                  key={task.id} 
                  className="flex items-center gap-3 p-3 rounded-xl group transition-colors border-2"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(5px)',
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                <Checkbox 
                  checked={task.status === 'Done'}
                  onCheckedChange={(checked) => handleStatusChange(task.id, checked ? 'Done' : 'To Do')}
                  className="border-border data-[state=checked]:bg-[#4F6EF7] data-[state=checked]:border-[#4F6EF7]"
                />
                {getStatusBadge(task.status)}
                <div className="flex items-center -space-x-2 mr-2">
                  {(task.assignee_ids && task.assignee_ids.length > 0) ? (
                    task.assignee_ids.map((id) => {
                      const member = members.find(m => m.user_id === id)
                      return (
                        <Avatar key={id} className="h-8 w-8 border-2 border-white/10 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(5px)' }}>
                          <AvatarFallback className="text-[11px] font-black text-white" style={{ backgroundColor: getMemberColor(id) }}>
                            {(member?.profiles?.full_name || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )
                    })
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30" />
                  )}
                </div>
                <span className={cn(
                  "text-sm flex-1 text-foreground",
                  task.status === 'Done' ? "text-muted-foreground line-through" : ""
                )}>
                  {task.title}
                </span>
                </div>
              )
            })}
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/60 mt-2 px-2" onClick={() => setIsNewTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New task
            </Button>
          </div>
        </TabsContent>


      </Tabs>
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[700px] bg-card border border-border text-foreground p-0 overflow-hidden rounded-[32px] shadow-2xl">
          {selectedTask && (
            <div className="flex flex-col">
              <div className="relative h-48 bg-muted flex items-center justify-center overflow-hidden transition-colors">
                 <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                 <h2 className="relative text-3xl font-black text-foreground px-8 text-center tracking-tight">{selectedTask.title}</h2>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between pb-8 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    {selectedTask.assignee_ids && selectedTask.assignee_ids[0] && (
                       <Avatar className="h-12 w-12 border-2 border-white dark:border-zinc-800 shadow-sm">
                         <AvatarFallback className="text-lg font-bold text-white" style={{ backgroundColor: getMemberColor(selectedTask.assignee_ids[0]) }}>
                           {members.find(m => m.user_id === selectedTask.assignee_ids?.[0])?.profiles?.full_name?.[0] || 'U'}
                         </AvatarFallback>
                       </Avatar>
                    )}
                    <div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest">Assigned to</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedTask.assignee_ids?.map((id: string) => members.find(m => m.user_id === id)?.profiles?.full_name?.split(' ')[0]).join(', ') || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest mb-1">Status</p>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest">Date Created</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{format(new Date(selectedTask.created_at), 'MMMM do, yyyy')}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest">Workspace</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Task Tracker</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest">Description</p>
                  <div className="text-foreground leading-relaxed text-lg bg-muted/30 p-6 rounded-2xl border border-border shadow-inner">
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedTask.description || '<span class="italic opacity-50">No description provided.</span>' }} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-zinc-800">
                   <div className="flex -space-x-2">
                      {selectedTask.assignee_ids?.map((id: string) => (
                        <Avatar key={id} className="h-10 w-10 border-4 border-zinc-900" style={{ 
                          background: 'rgba(255, 255, 255, 0.03)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 10px 30px -15px rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <AvatarFallback className="text-sm font-bold text-white" style={{ backgroundColor: getMemberColor(id) }}>
                            {members.find(m => m.user_id === id)?.profiles?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                   </div>
                   <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => {
                     handleDeleteTask(selectedTask.id)
                     setSelectedTask(null)
                   }}>
                     Delete Task
                   </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
