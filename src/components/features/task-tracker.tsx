'use client'

import * as React from 'react'
import { Plus, CheckCircle2, Circle, Clock, Filter, Search, ArrowUpDown, ChevronDown, CalendarIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RichTextEditor } from '@/components/rich-text-editor'
import { getTasks, getWorkspaceMembers, createTask, updateTaskStatus, deleteTask, updateTaskAssignees } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'

export function TaskTracker({ workspaceId, featureId, currentUser }: { workspaceId: string, featureId: string, currentUser: any }) {
  const [tasks, setTasks] = React.useState<any[]>([])
  const [members, setMembers] = React.useState<any[]>([])
  const [isNewTaskOpen, setIsNewTaskOpen] = React.useState(false)
  
  const [newTaskTitle, setNewTaskTitle] = React.useState('')
  const [newTaskStatus, setNewTaskStatus] = React.useState('Not started')
  const [newTaskDescription, setNewTaskDescription] = React.useState('')
  const [newTaskAssignees, setNewTaskAssignees] = React.useState<string[]>([])
  const [newTaskDueDate, setNewTaskDueDate] = React.useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTask, setSelectedTask] = React.useState<any>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [calendarView, setCalendarView] = React.useState<'day' | 'week' | 'month'>('day')
  const [selectedDate, setSelectedDate] = React.useState(new Date())

  React.useEffect(() => {
    loadData()
  }, [workspaceId, featureId])

  async function loadData() {
    const fetchedTasks = await getTasks(featureId)
    const fetchedMembers = await getWorkspaceMembers(workspaceId)
    setTasks(fetchedTasks || [])
    setMembers(fetchedMembers || [])
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
      setNewTaskStatus('Not started')
      loadData()
    } else {
      alert("Error creating task: " + result.error)
    }
    setIsSubmitting(false)
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    const originalTasks = [...tasks]
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    const result = await updateTaskStatus(taskId, newStatus)
    if (result?.error) setTasks(originalTasks)
  }

  async function handleAssigneesChange(taskId: string, newAssigneeIds: string[]) {
    const originalTasks = [...tasks]
    setTasks(tasks.map(t => t.id === taskId ? { ...t, assignee_ids: newAssigneeIds } : t))
    const result = await updateTaskAssignees(taskId, newAssigneeIds)
    if (result?.error) {
      setTasks(originalTasks)
      alert(result.error)
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      const originalTasks = [...tasks]
      setTasks(tasks.filter(t => t.id !== taskId))
      const result = await deleteTask(taskId)
      if (result?.error) {
        setTasks(originalTasks)
        alert(res.error)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Done':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" /> Done</Badge>
      case 'In progress':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><Clock className="mr-1 h-3 w-3" /> In progress</Badge>
      default:
        return <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700"><Circle className="mr-1 h-3 w-3" /> Not started</Badge>
    }
  }

  const getUserColor = (userId: string) => {
    if (!userId) return 'bg-zinc-800 text-zinc-400'
    const colors = [
      'bg-red-500/10 text-red-400 border border-red-500/20',
      'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      'bg-pink-500/10 text-pink-400 border border-pink-500/20',
      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    ]
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }



  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto scrollbar-hide -m-8 p-8 transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Tasks Tracker</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-muted-foreground font-semibold text-xs uppercase tracking-widest">Active Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card rounded-xl p-1 border border-border shadow-sm mr-2">
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary rounded-lg"><Search className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary rounded-lg"><Filter className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary rounded-lg"><ArrowUpDown className="h-4 w-4" /></Button>
          </div>
          
          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-10 font-semibold shadow-sm transition-all active:scale-95" />}>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border border-border text-card-foreground p-0 overflow-hidden rounded-2xl shadow-xl">
               <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                 <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                 <DialogHeader>
                   <DialogTitle className="text-3xl font-black tracking-tight">Create Task</DialogTitle>
                 </DialogHeader>
               </div>
               <form onSubmit={handleCreateTask} className="p-10 space-y-8">
                 <div className="space-y-3">
                   <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Task Title</label>
                   <Input 
                     placeholder="What needs to be done?"
                     value={newTaskTitle}
                     onChange={(e) => setNewTaskTitle(e.target.value)}
                     className="h-14 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[20px] focus:ring-2 focus:ring-[#4F6EF7]/20 text-lg font-bold"
                     required
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Due Date</label>
                     <Input 
                       type="date"
                       value={newTaskDueDate}
                       onChange={(e) => setNewTaskDueDate(e.target.value)}
                       className="h-14 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[20px] focus:ring-2 focus:ring-[#4F6EF7]/20 font-bold"
                       required
                     />
                   </div>
                   <div className="space-y-3">
                     <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Status</label>
                     <Select value={newTaskStatus} onValueChange={setNewTaskStatus}>
                       <SelectTrigger className="h-14 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[20px] focus:ring-2 focus:ring-[#4F6EF7]/20 font-bold">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-[20px]">
                         <SelectItem value="To Do">To Do</SelectItem>
                         <SelectItem value="In Progress">In Progress</SelectItem>
                         <SelectItem value="Done">Done</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Assign Members</label>
                   <div className="flex flex-wrap gap-2 p-4 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[24px] min-h-[80px]">
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
                           "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                           newTaskAssignees.includes(member.user_id)
                             ? "bg-[#4F6EF7] text-white border-transparent shadow-lg shadow-blue-500/20 scale-105"
                             : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-blue-500/50"
                         )}
                       >
                         <Avatar className="h-5 w-5">
                           <AvatarFallback className="text-[8px] font-black" style={{ backgroundColor: getUserColor(member.user_id) }}>
                             {member.profiles?.full_name?.[0] || 'U'}
                           </AvatarFallback>
                         </Avatar>
                         {member.profiles?.full_name?.split(' ')[0]}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Description</label>
                   <RichTextEditor 
                     value={newTaskDescription} 
                     onChange={setNewTaskDescription} 
                     placeholder="Add details about this task..."
                   />
                 </div>

                 <div className="flex gap-4 pt-4">
                   <Button variant="ghost" type="button" onClick={() => setIsNewTaskOpen(false)} className="flex-1 h-14 rounded-[20px] font-bold text-zinc-500 hover:bg-zinc-100">
                     Cancel
                   </Button>
                   <Button type="submit" className="flex-[2] h-14 bg-[#4F6EF7] hover:bg-[#3d59d6] text-white rounded-[20px] font-black text-lg shadow-xl shadow-blue-500/20">
                     Create Task
                   </Button>
                 </div>
               </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
        <TabsList className="bg-card p-1.5 rounded-xl border border-border shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-lg transition-all px-6 py-2 font-semibold text-[11px] uppercase tracking-wider">
              ★ Overview
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-lg transition-all px-6 py-2 font-semibold text-[11px] uppercase tracking-wider">
              ➔ Kanban
            </TabsTrigger>
            <TabsTrigger value="me" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-lg transition-all px-6 py-2 font-semibold text-[11px] uppercase tracking-wider">
              👤 Mine
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-lg transition-all px-6 py-2 font-semibold text-[11px] uppercase tracking-wider">
              ✓ List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-lg transition-all px-6 py-2 font-semibold text-[11px] uppercase tracking-wider">
              📅 Calendar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 mt-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
                  <TableRow key={task.id} className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <button 
                        onClick={() => setSelectedTask(task)}
                        className="flex items-center text-left hover:text-primary transition-colors"
                      >
                        <span className="truncate max-w-[300px]">{task.title}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Select value={task.status} onValueChange={(val) => handleStatusChange(task.id, val)}>
                        <SelectTrigger hideIcon className="bg-transparent border-0 h-auto p-0 hover:bg-zinc-800/50 focus:ring-0">
                          {getStatusBadge(task.status)}
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectItem value="Not started">Not started</SelectItem>
                          <SelectItem value="In progress">In progress</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger className="flex h-auto p-1 hover:bg-zinc-800/50 justify-start w-full rounded-md border-0 items-center bg-transparent text-sm">
                          {task.assignee_ids && task.assignee_ids.length > 0 ? (
                            <div className="flex gap-1 overflow-x-auto scrollbar-hide max-w-[150px] items-center">
                              {task.assignee_ids.map((id: string) => {
                                const m = members.find(mem => mem.user_id === id)
                                const name = m ? (m.profiles?.full_name?.split(' ')[0] || `User`) : 'Unknown'
                                return (
                                  <span key={id} className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider whitespace-nowrap", getUserColor(id))}>
                                    {name}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-sm">Unassigned</span>
                          )}
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0 bg-zinc-900 border-zinc-800">
                          <div className="p-2 space-y-1">
                            {members.map(m => {
                              const isSelected = (task.assignee_ids || []).includes(m.user_id)
                              return (
                                <div key={m.user_id} className="flex items-center space-x-2 p-2 hover:bg-zinc-800 rounded-md cursor-pointer" onClick={() => {
                                  const newIds = isSelected 
                                    ? (task.assignee_ids || []).filter((id: string) => id !== m.user_id)
                                    : [...(task.assignee_ids || []), m.user_id]
                                  handleAssigneesChange(task.id, newIds)
                                }}>
                                  <Checkbox checked={isSelected} className="border-zinc-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none" />
                                  <span className="text-sm text-zinc-300 flex-1">{m.user_id === currentUser.id ? 'Me' : (m.profiles?.full_name || `User ${m.user_id.substring(0,4)}`)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-950/30" onClick={() => handleDeleteTask(task.id)}>
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
          </div>
        </TabsContent>

        <TabsContent value="status" className="flex-1 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {['Not started', 'In progress', 'Done'].map(columnStatus => (
              <div key={columnStatus} className="flex flex-col bg-muted/40 rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  {getStatusBadge(columnStatus)}
                  {/* Count badge like reference image */}
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-bold px-1.5">
                    {tasks.filter(t => t.status === columnStatus).length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {tasks.filter(t => t.status === columnStatus).map(task => (
                    <div key={task.id} className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all group">
                      <div 
                        className="flex items-start justify-between mb-3 cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <h4 className="text-sm font-medium text-zinc-100 hover:text-blue-400 transition-colors">{task.title}</h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTask(task.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        {task.assignee_id ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-zinc-800 text-[10px]">U</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-zinc-400">
                              {task.assignee_id === currentUser.id ? 'Me' : (task.profiles?.full_name || 'User')}
                            </span>
                          </div>
                        ) : <div />}
                        <span className="text-xs text-zinc-500">{format(new Date(task.created_at), 'MMM d')}</span>

                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 justify-start" onClick={() => {
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
          <div className="rounded-md border border-zinc-800 bg-zinc-900/50">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium">Task name</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.filter(t => t.assignee_id === currentUser?.id).map((task) => (
                  <TableRow key={task.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-zinc-100">
                      <button 
                        onClick={() => setSelectedTask(task)}
                        className="hover:text-blue-400 transition-colors"
                      >
                        {task.title}
                      </button>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.filter(t => t.assignee_id === currentUser?.id).length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
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
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-900/50 group">
                <Checkbox 
                  checked={task.status === 'Done'}
                  onCheckedChange={(checked) => handleStatusChange(task.id, checked ? 'Done' : 'Not started')}
                  className="border-zinc-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                {getStatusBadge(task.status)}
                <span className={cn(
                  "text-sm flex-1",
                  task.status === 'Done' ? "text-zinc-500 line-through" : "text-zinc-200"
                )}>
                  {task.title}
                </span>
              </div>
            ))}
            <Button variant="ghost" className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 mt-2 px-2" onClick={() => setIsNewTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New task
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 mt-4">
          <div className="flex flex-col h-full bg-[#0d0d0d] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-[#121212]/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-bold text-zinc-100 tracking-tight">
                  {format(currentDate, 'MMMM')} <span className="text-zinc-500 font-medium">{format(currentDate, 'yyyy')}</span>
                </h3>
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                  <Button 
                    variant={calendarView === 'day' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => setCalendarView('day')}
                  >
                    Day
                  </Button>
                  <Button 
                    variant={calendarView === 'week' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => setCalendarView('week')}
                  >
                    Week
                  </Button>
                  <Button 
                    variant={calendarView === 'month' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => setCalendarView('month')}
                  >
                    Month
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/50">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-4 text-xs font-semibold hover:bg-zinc-800" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {calendarView === 'day' && (
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 p-4 overflow-x-auto border-b border-zinc-800/50 scrollbar-hide bg-[#121212]/20">
                  {(() => {
                    const monthStart = startOfMonth(currentDate)
                    const monthEnd = endOfMonth(monthStart)
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
                    return days.map(day => (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[60px] h-[80px] rounded-2xl border transition-all duration-300",
                          isSameDay(day, selectedDate) 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20 scale-105" 
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{format(day, 'eee')}</span>
                        <span className="text-xl font-black">{format(day, 'd')}</span>
                        {tasks.some(t => isSameDay(new Date(t.created_at), day)) && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1",
                            isSameDay(day, selectedDate) ? "bg-white" : "bg-blue-500"
                          )} />
                        )}
                      </button>
                    ))
                  })()}
                </div>
                
                <div className="flex-1 p-8 overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-4xl font-black text-zinc-100">{format(selectedDate, 'EEEE')}</h2>
                        <p className="text-zinc-500 font-medium">{format(selectedDate, 'MMMM do, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-5xl font-black text-zinc-800/50">
                          {tasks.filter(t => isSameDay(new Date(t.created_at), selectedDate)).length} Tasks
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tasks.filter(t => isSameDay(new Date(t.created_at), selectedDate)).map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => setSelectedTask(task)}
                          className={cn(
                            "p-6 rounded-2xl border-2 bg-[#121212]/80 shadow-xl transition-all group cursor-pointer border-zinc-800/50 hover:border-blue-500/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div />
                            {getStatusBadge(task.status)}
                          </div>
                          
                          <h3 className="text-2xl font-bold text-zinc-100 mb-4 group-hover:text-blue-400 transition-colors">
                            {task.title}
                          </h3>

                          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center gap-3">
                              {task.assignee_ids && task.assignee_ids.length > 0 ? (
                                <div className="flex gap-1.5 flex-wrap">
                                  {task.assignee_ids.map((id: string) => {
                                    const m = members.find(mem => mem.user_id === id)
                                    const name = m ? (m.profiles?.full_name?.split(' ')[0] || `User`) : 'Unknown'
                                    return (
                                      <span key={id} className={cn("text-xs px-2 py-1 rounded-full font-bold tracking-wider", getUserColor(id))}>
                                        {name}
                                      </span>
                                    )
                                  })}
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-zinc-500">Unassigned</span>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-red-400" onClick={() => handleDeleteTask(task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {tasks.filter(t => isSameDay(new Date(t.created_at), selectedDate)).length === 0 && (
                        <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                          <p className="text-zinc-500 font-medium">No tasks scheduled for this day.</p>
                          <Button variant="ghost" className="mt-4 text-blue-500" onClick={() => setIsNewTaskOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create a task
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {calendarView === 'week' && (
              <div className="flex flex-1 overflow-x-auto bg-[#0d0d0d] scrollbar-hide">
                {(() => {
                  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
                  const days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(weekStart)
                    d.setDate(d.getDate() + i)
                    return d
                  })

                  return days.map(day => (
                    <div key={day.toISOString()} className="flex-1 min-w-[300px] border-r border-zinc-800/50 flex flex-col">
                      <div className={cn(
                        "p-6 border-b border-zinc-800/50 flex items-center justify-between bg-[#121212]/30",
                        isSameDay(day, new Date()) && "bg-blue-600/10"
                      )}>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">{format(day, 'EEEE')}</span>
                          <span className={cn(
                            "text-2xl font-black",
                            isSameDay(day, new Date()) ? "text-blue-500" : "text-zinc-100"
                          )}>{format(day, 'MMM d')}</span>
                        </div>
                        <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-500 px-3 py-1 font-bold">
                          {tasks.filter(t => isSameDay(new Date(t.created_at), day)).length}
                        </Badge>
                      </div>
                      <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-[#0d0d0d] scrollbar-thin scrollbar-thumb-zinc-800">
                        {tasks.filter(t => isSameDay(new Date(t.created_at), day)).map(task => (
                          <div 
                            key={task.id} 
                            className={cn(
                              "p-5 rounded-2xl border-2 bg-[#121212]/80 shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-zinc-800/50 hover:border-blue-500/50"
                            )}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div />
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                              </div>
                            </div>
                            <h4 className="text-base font-bold text-zinc-100 mb-4 line-clamp-2 leading-tight hover:text-blue-400 transition-colors">{task.title}</h4>
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                              <div className="flex gap-1 flex-wrap">
                                {task.assignee_ids && task.assignee_ids.length > 0 ? (
                                  task.assignee_ids.map((id: string) => {
                                    const m = members.find(mem => mem.user_id === id)
                                    const name = m ? (m.profiles?.full_name?.split(' ')[0] || `User`) : 'Unknown'
                                    return (
                                      <span key={id} className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wider", getUserColor(id))}>
                                        {name}
                                      </span>
                                    )
                                  })
                                ) : (
                                  <span className="text-[9px] text-zinc-500 font-medium">Unassigned</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600">
                                <Clock className="h-3 w-3" />
                                <span>2 days</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {calendarView === 'month' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="grid grid-cols-7 bg-[#121212]/30">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] uppercase tracking-widest font-bold text-zinc-600 border-b border-zinc-800/50">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 flex-1">
              {(() => {
                const monthStart = startOfMonth(currentDate)
                const monthEnd = endOfMonth(monthStart)
                const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
                const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
                const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

                return calendarDays.map(day => {
                  const dayTasks = tasks.filter(t => isSameDay(new Date(t.created_at), day))
                  const isCurrentMonth = isSameMonth(day, monthStart)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "min-h-[160px] p-2 border-r border-b border-zinc-800/30 transition-all duration-300 group hover:bg-zinc-800/10 flex flex-col",
                        !isCurrentMonth && "opacity-20",
                        isToday && "bg-blue-500/5"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2 px-1">
                        <span className={cn(
                          "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                          isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-zinc-500 group-hover:text-zinc-300"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                        {dayTasks.map(task => (
                          <div 
                            key={task.id} 
                            className={cn(
                              "p-3 rounded-2xl border-2 bg-[#121212]/80 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col gap-2 border-zinc-800/50 hover:border-blue-500/50",
                              task.status === 'Done' && "opacity-50 grayscale"
                            )}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex items-center justify-between">
                              <div />
                              <div className="flex gap-0.5 opacity-50">
                                <div className="w-1 h-1 rounded-full bg-zinc-500" />
                                <div className="w-1 h-1 rounded-full bg-zinc-500" />
                                <div className="w-1 h-1 rounded-full bg-zinc-500" />
                              </div>
                            </div>
                            
                            <div className={cn(
                              "font-bold text-zinc-100 text-[11px] leading-tight line-clamp-2",
                              task.status === 'Done' && "line-through text-zinc-500"
                            )}>
                              {task.title}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <div className="flex gap-0.5 flex-wrap">
                                {task.assignee_ids && task.assignee_ids.length > 0 ? (
                                  task.assignee_ids.map((id: string) => {
                                    const m = members.find(mem => mem.user_id === id)
                                    const name = m ? (m.profiles?.full_name?.split(' ')[0] || `User`) : 'Unknown'
                                    return (
                                      <span key={id} className={cn("text-[8px] px-1 py-0.5 rounded font-bold tracking-wider", getUserColor(id))}>
                                        {name}
                                      </span>
                                    )
                                  })
                                ) : (
                                  <span className="text-[8px] text-zinc-500">Unassigned</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-zinc-500 text-[8px] font-bold">
                                <Clock className="h-3 w-3" />
                                <span>2 days</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[700px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden rounded-[32px] shadow-2xl">
          {selectedTask && (
            <div className="flex flex-col">
              <div className="relative h-48 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden transition-colors">
                 <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
                 <h2 className="relative text-3xl font-black text-zinc-900 dark:text-white px-8 text-center tracking-tight">{selectedTask.title}</h2>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between pb-8 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    {selectedTask.assignee_ids?.[0] && (
                       <Avatar className="h-12 w-12 border-2 border-white dark:border-zinc-800 shadow-sm">
                         <AvatarFallback className={cn("text-lg font-bold text-white", getUserColor(selectedTask.assignee_ids[0]))}>
                           {members.find(m => m.user_id === selectedTask.assignee_ids[0])?.profiles?.full_name?.[0] || 'U'}
                         </AvatarFallback>
                       </Avatar>
                    )}
                    <div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">Assigned to</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedTask.assignee_ids?.map((id: string) => members.find(m => m.user_id === id)?.profiles?.full_name?.split(' ')[0]).join(', ') || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1">Status</p>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">Date Created</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{format(new Date(selectedTask.created_at), 'MMMM do, yyyy')}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">Workspace</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Task Tracker</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">Description</p>
                  <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg bg-zinc-50 dark:bg-zinc-950/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedTask.description || '<span className="italic opacity-50">No description provided.</span>' }} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-zinc-800">
                   <div className="flex -space-x-2">
                      {selectedTask.assignee_ids?.map((id: string) => (
                        <Avatar key={id} className="h-10 w-10 border-4 border-zinc-900">
                          <AvatarFallback className={cn("text-sm font-bold text-white", getUserColor(id))}>
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
