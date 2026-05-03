'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Clock, Circle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getMemberColor } from '@/lib/colors'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQueryClient } from "@tanstack/react-query"
import { updateOutreachStatus } from "@/lib/actions/outreach"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

interface Log {
  id: string
  workspace_id: string
  feature_id: string
  member_id: string
  channel: string
  count: number
  note?: string
  outreach_type?: 'Manual' | 'Campaign'
  campaign_status?: 'Live' | 'Completed'
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

interface UnifiedCalendarProps {
  tasks: Task[]
  outreachLogs: Log[]
  members: Member[]
  currentUser: { id: string }
}

type CalendarItem = {
  id: string
  type: 'task' | 'log'
  title: string
  date: Date
  memberIds: string[]
  rawTask?: Task
  rawLog?: Log
}

type ViewConfig = {
  currentDate: Date
  selectedDate: Date
}

type CalendarStore = {
  view: 'day' | 'week' | 'month'
  day: ViewConfig
  week: ViewConfig
  month: ViewConfig
}

const getToday = () => new Date()

const calendarStore: CalendarStore = {
  view: 'month',
  day: { currentDate: getToday(), selectedDate: getToday() },
  week: { currentDate: getToday(), selectedDate: getToday() },
  month: { currentDate: getToday(), selectedDate: getToday() },
}

export function UnifiedCalendar({ tasks, outreachLogs, members, currentUser }: UnifiedCalendarProps) {
  const queryClient = useQueryClient()
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  
  const [calendarView, _setCalendarView] = React.useState<'day' | 'week' | 'month'>(calendarStore.view)
  const [currentDate, _setCurrentDate] = React.useState(calendarStore[calendarStore.view].currentDate)
  const [selectedDate, _setSelectedDate] = React.useState(calendarStore[calendarStore.view].selectedDate)

  const setCalendarView = React.useCallback((view: 'day' | 'week' | 'month') => {
    calendarStore.view = view
    _setCalendarView(view)
    _setCurrentDate(calendarStore[view].currentDate)
    _setSelectedDate(calendarStore[view].selectedDate)
  }, [])

  const setCurrentDate = React.useCallback((date: Date | ((prev: Date) => Date)) => {
    _setCurrentDate(prev => {
      const nextDate = typeof date === 'function' ? date(prev) : date
      calendarStore[calendarStore.view].currentDate = nextDate
      return nextDate
    })
  }, [])

  const setSelectedDate = React.useCallback((date: Date | ((prev: Date) => Date)) => {
    _setSelectedDate(prev => {
      const nextDate = typeof date === 'function' ? date(prev) : date
      calendarStore[calendarStore.view].selectedDate = nextDate
      return nextDate
    })
  }, [])

  const [visibleMembers, setVisibleMembers] = React.useState<Set<string>>(new Set(members.map(m => m.user_id)))
  const [showTasks, setShowTasks] = React.useState(true)
  const [showLogs, setShowLogs] = React.useState(true)

  const visibleDaysRange = React.useMemo(() => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - 14)
    const end = new Date(selectedDate)
    end.setDate(end.getDate() + 14)
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  const getDayOffset = React.useCallback((date: Date, baseDate: Date) => {
    const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const utcBase = Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    return Math.floor((utcDate - utcBase) / (1000 * 60 * 60 * 24));
  }, [])

  const timeIndicatorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (timeIndicatorRef.current && isSameDay(selectedDate, new Date())) {
      const container = timeIndicatorRef.current.closest('.overflow-y-auto') as HTMLElement
      if (container) {
        // Adding a small delay to ensure rendering is complete before calculating offset
        setTimeout(() => {
          if (!timeIndicatorRef.current) return
          const offset = timeIndicatorRef.current.offsetTop
          const containerHeight = container.clientHeight
          container.scrollTo({ top: Math.max(0, offset - (containerHeight / 2)), behavior: 'smooth' })
        }, 50)
      }
    }
  }, [selectedDate, calendarView])

  // Keyboard navigation support
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (calendarView !== 'month') {
      if (e.key === 'ArrowLeft') {
        setSelectedDate(prev => {
          const d = new Date(prev)
          d.setDate(d.getDate() - 1)
          setCurrentDate(d)
          return d
        })
      }
      if (e.key === 'ArrowRight') {
        setSelectedDate(prev => {
          const d = new Date(prev)
          d.setDate(d.getDate() + 1)
          setCurrentDate(d)
          return d
        })
      }
    }
  }, [calendarView, setSelectedDate, setCurrentDate])

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const moveDay = (direction: 'left' | 'right') => {
    setSelectedDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + (direction === 'left' ? -1 : 1))
      setCurrentDate(d)
      return d
    })
  }

  const allItems: CalendarItem[] = [
    ...tasks.map(t => ({
      id: `task-${t.id}`,
      type: 'task' as const,
      title: t.title,
      date: new Date(t.created_at),
      memberIds: t.assignee_ids && t.assignee_ids.length > 0 ? t.assignee_ids : (t.assignee_id ? [t.assignee_id] : []),
      rawTask: t
    })),
    ...outreachLogs.map(l => ({
      id: `log-${l.id}`,
      type: 'log' as const,
      title: `${l.channel} Outreach`,
      date: new Date(l.created_at),
      memberIds: [l.member_id],
      rawLog: l
    }))
  ]

  const filteredItems = allItems.filter(item => {
    if (item.type === 'task' && !showTasks) return false
    if (item.type === 'log' && !showLogs) return false
    if (item.memberIds.length === 0) return true
    return item.memberIds.some(id => visibleMembers.has(id))
  })

  const renderCard = (item: CalendarItem, isCompact = false) => {
    const memberId = item.memberIds[0] || ''
    const memberColor = getMemberColor(memberId)
    const member = members.find(m => m.user_id === memberId)
    const firstName = member?.profiles?.full_name?.split(' ')[0] || 'Member'

    return (
      <div 
        key={item.id} 
        onClick={() => {
          if (item.type === 'task' && item.rawTask) {
            setSelectedTask(item.rawTask)
          }
        }}
        className={cn(
          "group rounded-[32px] transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] flex flex-col justify-between",
          "bg-white/70 dark:bg-white/[0.03] backdrop-blur-[10px] border border-zinc-200 dark:border-white/10",
          "shadow-xl shadow-black/5 dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]",
          "group rounded-[24px] transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] flex flex-col justify-between",
          "bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800",
          "shadow-sm hover:shadow-md",
          isCompact ? "p-3 h-auto" : "p-4 min-h-[140px]"
        )}
      >
        <div className="flex flex-col h-full justify-between gap-3 relative z-10">
          {/* Top Row: Colored Name Tag + Transparent Status/Channel */}
          <div className={cn("flex justify-between", isCompact ? "flex-col items-start gap-1.5" : "items-center")}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 border border-zinc-200/50 dark:border-white/10 shadow-sm">
                <AvatarFallback className="text-[9px] font-bold text-white" style={{ backgroundColor: memberColor }}>
                  {firstName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 tracking-tight">{firstName}</span>
            </div>

            {item.type === 'log' && item.rawLog?.campaign_status && (
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer",
                    item.rawLog.campaign_status === 'Live' 
                      ? "bg-emerald-500/10 text-emerald-500 animate-pulse" 
                      : "bg-zinc-500/10 text-zinc-500"
                  )}
                >
                  {item.rawLog.campaign_status}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover/90 backdrop-blur-xl">
                  {(['Live', 'Completed'] as const).map((status) => (
                    <DropdownMenuItem 
                      key={status}
                      className={cn(
                        "rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        status === 'Live' ? "text-emerald-500" : "text-zinc-500"
                      )}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (item.rawLog) {
                          const logId = item.rawLog.id
                          // Optimistic update
                          queryClient.setQueryData(['outreach_logs'], (old: Log[] | undefined) => 
                            old?.map(l => l.id === logId ? { ...l, campaign_status: status } : l)
                          )
                          await updateOutreachStatus(logId, status)
                        }
                      }}
                    >
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {item.type === 'task' && (
              <div className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                item.rawTask?.status === 'Done' ? "bg-emerald-500/10 text-emerald-500" : item.rawTask?.status === 'In Progress' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
              )}>
                {item.rawTask?.status}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="space-y-2">
            {item.type === 'log' ? (
              <div className="space-y-1">
                <h4 className={cn("font-bold text-zinc-900 dark:text-white leading-tight tracking-tight lowercase", isCompact ? "text-[11px]" : "text-sm")}>
                  {item.rawLog?.count} people reached
                </h4>
                <div className={cn(
                  "inline-flex px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider w-fit",
                  item.rawLog?.channel === 'Cold email' ? "bg-cyan-500/10 text-cyan-500" :
                  item.rawLog?.channel === 'LinkedIn campaign' ? "bg-indigo-500/10 text-indigo-500" :
                  item.rawLog?.channel === 'Instagram DM' ? "bg-rose-500/10 text-rose-500" :
                  item.rawLog?.channel === 'Phone calls' ? "bg-emerald-500/10 text-emerald-500" :
                  "bg-orange-500/10 text-orange-500"
                )}>
                  {item.rawLog?.channel}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className={cn("font-bold text-zinc-900 dark:text-white leading-tight tracking-tight", isCompact ? "text-[10.5px]" : "text-sm")}>
                  {item.title}
                </h3>
              </div>
            )}
            
            {!isCompact && (item.type === 'task' ? item.rawTask?.description : item.rawLog?.note) && (
              <div className="text-xs text-zinc-700 dark:text-white/80 line-clamp-2 leading-relaxed font-medium">
                {item.type === 'task' ? (
                  <div dangerouslySetInnerHTML={{ __html: item.rawTask?.description || '' }} />
                ) : (
                  item.rawLog?.note
                )}
              </div>
            )}
          </div>

          {/* Footer: Progress or Date */}
          {item.type === 'task' && !isCompact && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-zinc-700 dark:text-white/70">
                <span>Progress</span>
                <span>{item.rawTask?.status === 'Done' ? '100%' : item.rawTask?.status === 'In Progress' ? '50%' : '0%'}</span>
              </div>
              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                  style={{ width: item.rawTask?.status === 'Done' ? '100%' : item.rawTask?.status === 'In Progress' ? '50%' : '0%' }}
                />
              </div>
            </div>
          )}

          {!isCompact && (
            <div className="text-[11px] font-black text-zinc-600 dark:text-white/60 uppercase tracking-widest text-right">
              {format(item.date, 'do MMM')}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDayContent = (day: Date, items: CalendarItem[]) => {
    const dayItems = items.filter(t => isSameDay(t.date, day)).sort((a, b) => a.date.getTime() - b.date.getTime())
    const isToday = isSameDay(day, new Date())
    const now = new Date()

    if (dayItems.length === 0 && !isToday) {
      return (
        <div className="col-span-full py-24 text-center bg-zinc-50 dark:bg-white/[0.02] rounded-[40px] border border-dashed border-zinc-200 dark:border-white/10">
          <p className="text-zinc-400 dark:text-white/20 font-bold uppercase tracking-[0.2em] text-sm">No items</p>
        </div>
      )
    }

    if (isToday) {
      const pastItems = dayItems.filter(item => item.date.getTime() <= now.getTime())
      const futureItems = dayItems.filter(item => item.date.getTime() > now.getTime())
      
      return (
        <>
          {pastItems.map(item => renderCard(item))}
          
          <div ref={timeIndicatorRef} className="col-span-full flex items-center gap-3 py-2 w-full relative z-10 opacity-80">
            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">{format(now, 'h:mm a')}</div>
            <div className="flex-1 h-px bg-red-500/50 relative">
              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </div>
          </div>

          {futureItems.map(item => renderCard(item))}
          
          {dayItems.length === 0 && (
            <div className="col-span-full py-12 text-center opacity-50">
              <p className="text-zinc-400 dark:text-white/20 font-bold uppercase tracking-[0.2em] text-xs">No items today</p>
            </div>
          )}
        </>
      )
    }

    return (
      <>
        {dayItems.map(item => renderCard(item))}
      </>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex flex-col border-b border-white/5 bg-white/[0.02] p-4 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-foreground tracking-tight leading-none">
              {format(currentDate, 'MMMM')} <span className="text-zinc-500 dark:text-white/40 font-medium ml-2">{format(currentDate, 'yyyy')}</span>
            </h3>
            <div className="flex bg-zinc-100 dark:bg-white/5 rounded-2xl p-1 border border-zinc-200 dark:border-white/5">
              {(['day', 'week', 'month'] as const).map((view) => (
                <Button 
                  key={view}
                  variant="ghost" size="sm" 
                  className={cn(
                    "h-8 px-4 text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-lg", 
                    calendarView === view ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/5"
                  )}
                  onClick={() => setCalendarView(view)}
                >{view}</Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/5">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-600 dark:text-white/60" 
              onClick={() => {
                const newDate = subMonths(currentDate, 1)
                setCurrentDate(newDate)
                setSelectedDate(startOfMonth(newDate))
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-4 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-600 dark:text-white/60" 
              onClick={() => {
                const now = new Date()
                setCurrentDate(now)
                setSelectedDate(now)
              }}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-600 dark:text-white/60" 
              onClick={() => {
                const newDate = addMonths(currentDate, 1)
                setCurrentDate(newDate)
                setSelectedDate(startOfMonth(newDate))
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-white/10 pr-4">
            <button
              onClick={() => setShowTasks(!showTasks)}
              className={cn("px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border", showTasks ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20" : "bg-transparent text-zinc-500 dark:text-white/40 border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20")}
            >
              Tasks
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={cn("px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border", showLogs ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg" : "bg-transparent text-zinc-500 dark:text-white/40 border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20")}
            >
              Outreach Logs
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {members.map(member => {
              const isVisible = visibleMembers.has(member.user_id)
              const color = getMemberColor(member.user_id)
              return (
                <button
                  key={member.user_id}
                  onClick={() => {
                    const newSet = new Set(visibleMembers)
                    if (isVisible) newSet.delete(member.user_id)
                    else newSet.add(member.user_id)
                    setVisibleMembers(newSet)
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border",
                    isVisible ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white border-zinc-200 dark:border-white/20 shadow-sm" : "bg-transparent text-zinc-400 dark:text-white/20 border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {member.profiles?.full_name?.split(' ')[0] || 'User'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {calendarView === 'day' && (
          <div className="flex-1 flex flex-col">
            <div className="relative h-[96px] w-full overflow-hidden bg-white/[0.01] border-b border-white/5">
              {/* Fixed Center Pointer */}
              <div className="absolute top-3 bottom-3 left-1/2 w-[60px] bg-primary/10 border-2 border-primary/30 rounded-xl -translate-x-1/2 z-0 pointer-events-none transition-all" />
              
              <div className="absolute top-0 left-0 w-full h-full">
                {visibleDaysRange.map(day => {
                  const offset = getDayOffset(day, selectedDate)
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "absolute top-3 flex flex-col items-center justify-center min-w-[60px] h-[72px] rounded-xl transition-transform duration-300 ease-out",
                        isSameDay(day, selectedDate) 
                          ? "bg-primary text-white shadow-xl shadow-primary/30 scale-105 z-10" 
                          : "bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-white/40 hover:border-zinc-300 dark:hover:border-white/20 hover:text-zinc-900 dark:hover:text-white",
                        isSameDay(day, new Date()) && !isSameDay(day, selectedDate) && "ring-1 ring-primary ring-offset-1 dark:ring-offset-zinc-900"
                      )}
                      style={{
                        left: '50%',
                        transform: `translateX(calc(-50% + ${offset * 68}px))` // 60px width + 8px gap
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{format(day, 'eee')}</span>
                      <span className="text-xl font-bold">{format(day, 'd')}</span>
                    </button>
                  )
                })}
              </div>
            </div>

              {/* Navigation Arrows Below */}
              <div className="flex items-center justify-center gap-4 py-2.5 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
                <Button 
                  variant="ghost" size="sm" 
                  className="h-9 px-4 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/5 shadow-sm"
                  onClick={() => moveDay('left')}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Previous Days</span>
                </Button>
                
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-white/10" />

                <Button 
                  variant="ghost" size="sm" 
                  className="h-9 px-4 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/5 shadow-sm"
                  onClick={() => moveDay('right')}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Next Days</span>
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-background">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight leading-none">{format(selectedDate, 'EEEE')}</h2>
                    <p className="text-zinc-500 dark:text-white/60 font-medium uppercase tracking-wider mt-2 text-xs leading-relaxed">{format(selectedDate, 'MMMM do, yyyy')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderDayContent(selectedDate, filteredItems)}
                </div>
              </div>
            </div>
          </div>
        )}

        {calendarView === 'week' && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 grid grid-cols-7 overflow-hidden bg-background">
              {(() => {
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
                const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
                
                return weekDays.map(day => {
                  const isSelected = isSameDay(day, selectedDate)
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "flex flex-col border-r border-zinc-200 dark:border-white/5 bg-background transition-all",
                        isSelected && "bg-primary/[0.02] relative"
                      )}
                    >
                      {isSelected && <div className="absolute inset-0 border-2 border-primary/30 z-10 pointer-events-none" />}
                      <div className={cn(
                        "p-3 border-b border-zinc-200 dark:border-white/5 flex flex-col gap-1 transition-colors shrink-0",
                        isToday ? "bg-primary/5" : "bg-white/[0.01]"
                      )}>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40">{format(day, 'EEEE')}</span>
                        <span className={cn(
                          "text-lg font-bold tracking-tight leading-none",
                          isToday ? "text-primary" : "text-zinc-900 dark:text-white"
                        )}>{format(day, 'MMM d')}</span>
                      </div>
                      <div className="flex-1 p-2 space-y-3 overflow-y-auto no-scrollbar bg-background hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-colors">
                        {renderDayContent(day, filteredItems)}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Navigation Arrows Below */}
            <div className="flex items-center justify-center gap-4 py-2.5 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
              <Button 
                variant="ghost" size="sm" 
                className="h-9 px-4 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/5 shadow-sm"
                onClick={() => moveDay('left')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Previous Days</span>
              </Button>
              
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-white/10" />

              <Button 
                variant="ghost" size="sm" 
                className="h-9 px-4 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/5 shadow-sm"
                onClick={() => moveDay('right')}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Next Days</span>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {calendarView === 'month' && (
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-4 text-center text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500 dark:text-white/40">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 flex-1 overflow-y-auto no-scrollbar">
              {(() => {
                const monthStart = startOfMonth(currentDate)
                const monthEnd = endOfMonth(monthStart)
                const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
                const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
                const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

                return calendarDays.map(day => {
                  const dayItems = filteredItems.filter(t => isSameDay(t.date, day))
                  const isCurrentMonth = isSameMonth(day, monthStart)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "min-h-fit p-3 border-r border-b border-white/5 transition-all duration-300 hover:bg-white/[0.02] flex flex-col gap-3",
                        !isCurrentMonth && "opacity-10",
                        isToday && "bg-primary/[0.02]"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "text-base font-black w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-lg",
                          isToday ? "bg-primary text-white shadow-primary/30" : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                        {dayItems.map(item => (
                          <React.Fragment key={item.id}>
                            {renderCard(item, true)}
                          </React.Fragment>
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
      {/* Task Details Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-xl rounded-3xl border-border bg-white dark:bg-[#0D0E12] p-8">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                selectedTask?.status === 'Done' ? "bg-emerald-500/10 text-emerald-500" : 
                selectedTask?.status === 'In Progress' ? "bg-purple-500/10 text-purple-500" : 
                "bg-blue-500/10 text-blue-500"
              )}>
                {selectedTask?.status}
              </div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                {selectedTask?.created_at && format(new Date(selectedTask.created_at), 'do MMM yyyy')}
              </span>
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-8 space-y-8">
            {selectedTask?.description && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Description</h4>
                <div 
                  className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-zinc-100 dark:border-white/5">
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Assignees</h4>
                <div className="flex -space-x-2">
                  {selectedTask?.assignee_ids?.map((id: string) => (
                    <Avatar key={id} className="h-8 w-8 border-2 border-white dark:border-[#0D0E12] shadow-sm">
                      <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: getMemberColor(id) }}>
                        {members.find(m => m.user_id === id)?.profiles?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
              <div className="space-y-3 text-right">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Progress</h4>
                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                  {selectedTask?.status === 'Done' ? '100%' : selectedTask?.status === 'In Progress' ? '50%' : '0%'}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
