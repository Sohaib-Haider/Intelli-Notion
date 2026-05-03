'use client'

import * as React from 'react'
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from 'date-fns'
import { Plus, BarChart3, Mail, Link2, Camera, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getOutreachLogs, createOutreachLog, deleteOutreachLog, updateOutreachStatus } from '@/lib/actions/outreach'
import { getWorkspaceMembers } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'
import { getMemberColor } from '@/lib/colors'
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

function LogSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-[32px]" />
      ))}
    </div>
  )
}
interface OutreachLogRecord {
  id: string
  created_at: string
  channel: string
  count: number
  note?: string
  member_id: string
  outreach_type?: 'Manual' | 'Campaign'
  campaign_status?: 'Live' | 'Completed'
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

export function OutreachLog({ workspaceId, featureId, currentUser }: { workspaceId: string, featureId: string, currentUser: { id: string } }) {
  const queryClient = useQueryClient()

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['outreach_logs', featureId],
    queryFn: () => getOutreachLogs(featureId),
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

  const logs = logsData || []
  const members = membersData || []
  const [isLogModalOpen, setIsLogModalOpen] = React.useState(false)
  
  const [channel, setChannel] = React.useState('Cold email')
  const [count, setCount] = React.useState('0')
  const [note, setNote] = React.useState('')
  const [outreachType, setOutreachType] = React.useState<'Manual' | 'Campaign'>('Manual')
  const [campaignStatus, setCampaignStatus] = React.useState<'Live' | 'Completed'>('Live')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDark, setIsDark] = React.useState(true)

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    const result = await createOutreachLog(workspaceId, featureId, {
      channel,
      count: parseInt(count),
      note,
      outreach_type: outreachType,
      campaign_status: outreachType === 'Campaign' ? campaignStatus : undefined
    })
    
    if (result.success) {
      setIsLogModalOpen(false)
      setCount('0')
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['outreach_logs', featureId] })
    } else {
      alert("Error: " + result.error)
    }
    setIsSubmitting(false)
  }



  const getChannelStyle = (channel: string) => {
    switch (channel) {
      case 'Cold email': 
        return { icon: <Mail className="h-4 w-4" />, className: "bg-[#06B6D4] text-white border-transparent" }
      case 'LinkedIn campaign': 
        return { icon: <Link2 className="h-4 w-4" />, className: "bg-[#4F6EF7] text-white border-transparent" }
      case 'Instagram DM': 
        return { icon: <Camera className="h-4 w-4" />, className: "bg-[#EC4899] text-white border-transparent" }
      case 'Phone calls': 
        return { icon: <Phone className="h-4 w-4" />, className: "bg-[#10B981] text-white border-transparent" }
      default: 
        return { icon: <MessageSquare className="h-4 w-4" />, className: "bg-[#F97316] text-white border-transparent" }
    }
  }

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })

  const thisWeekLogs = logs.filter(log => isWithinInterval(new Date(log.created_at), { start: weekStart, end: weekEnd }))
  const lastWeekLogs = logs.filter(log => isWithinInterval(new Date(log.created_at), { start: lastWeekStart, end: lastWeekEnd }))

  const thisWeekTotal = thisWeekLogs.reduce((acc, log) => acc + log.count, 0)
  const lastWeekTotal = lastWeekLogs.reduce((acc, log) => acc + log.count, 0)
  
  const percentageChange = lastWeekTotal === 0 ? 100 : Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)

  return (
    <div className="flex flex-col bg-background text-foreground transition-all duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight leading-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">Live Tracking Feed</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4F6EF7] hover:bg-[#4F6EF7]/90 text-white rounded-xl px-8 h-12 font-bold shadow-xl shadow-blue-500/30 transition-all active:scale-95">
                <Plus className="mr-2 h-5 w-5" /> Log Outreach
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] w-[95vw] bg-card dark:bg-[#0D0E12] border border-border text-card-foreground p-0 overflow-hidden rounded-[32px] shadow-2xl transition-all duration-500">
              <div className="bg-linear-to-br from-[#4F6EF7] via-[#6366F1] to-[#8B5CF6] p-12 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-70">New Activity</span>
                  </div>
                  <DialogHeader>
                    <DialogTitle className="text-4xl font-black tracking-tighter leading-none">Log Outreach</DialogTitle>
                    <p className="text-white/70 text-sm mt-3 font-medium max-w-[280px] leading-relaxed">Record your latest outreach efforts and campaign metrics here.</p>
                  </DialogHeader>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-background/50 backdrop-blur-xl">
                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Channel</label>
                      <Select value={channel} onValueChange={setChannel}>
                        <SelectTrigger className="h-14 border-border bg-muted/30 rounded-[20px] focus:ring-4 focus:ring-primary/10 font-bold transition-all hover:bg-muted/50">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[24px] border-border shadow-2xl p-2 bg-popover/90 backdrop-blur-xl">
                          <SelectItem value="Cold email" className="rounded-xl h-11 font-medium">Cold email</SelectItem>
                          <SelectItem value="LinkedIn campaign" className="rounded-xl h-11 font-medium">LinkedIn campaign</SelectItem>
                          <SelectItem value="Instagram DM" className="rounded-xl h-11 font-medium">Instagram DM</SelectItem>
                          <SelectItem value="Phone calls" className="rounded-xl h-11 font-medium">Phone calls</SelectItem>
                          <SelectItem value="Other" className="rounded-xl h-11 font-medium">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Outreach Type</label>
                      <div className="flex bg-muted/30 p-1.5 rounded-[20px] border border-border h-14">
                        {(['Manual', 'Campaign'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setOutreachType(type)}
                            className={cn(
                              "flex-1 rounded-[14px] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                              outreachType === type 
                                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg" 
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Total Reached</label>
                      <div className="relative group">
                        <Input
                          type="number"
                          value={count}
                          onChange={(e) => setCount(e.target.value)}
                          placeholder="0"
                          className="h-14 border-border bg-muted/30 rounded-[20px] focus:ring-4 focus:ring-primary/10 font-bold text-lg pl-12 transition-all group-hover:bg-muted/50"
                          required
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">
                          <Plus className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    {outreachType === 'Campaign' && (
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Campaign Status</label>
                        <Select value={campaignStatus} onValueChange={(v: any) => setCampaignStatus(v)}>
                          <SelectTrigger className="h-14 border-border bg-muted/30 rounded-[20px] focus:ring-4 focus:ring-primary/10 font-bold transition-all hover:bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-[24px] border-border shadow-2xl p-2 bg-popover/90 backdrop-blur-xl">
                            <SelectItem value="Live" className="rounded-xl h-11 font-medium text-emerald-500">Live</SelectItem>
                            <SelectItem value="Completed" className="rounded-xl h-11 font-medium text-zinc-500">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400 ml-1">Notes & Details</label>
                    <Textarea 
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="border-border bg-muted/30 rounded-[24px] focus:ring-4 focus:ring-primary/10 min-h-[140px] p-6 text-[15px] font-medium leading-relaxed transition-all hover:bg-muted/50"
                      placeholder="Add any specific results or feedback from this outreach..."
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsLogModalOpen(false)}
                      className="flex-1 h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="flex-[2] h-16 bg-linear-to-r from-[#4F6EF7] to-[#6366F1] hover:from-[#6366F1] hover:to-[#4F6EF7] text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Logging...' : 'Save Activity'}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-10">
        {/* Unified Team Total Card */}
        <div className="bg-gradient-to-br from-[#312e81] via-[#4c1d95] to-[#8b5cf6] rounded-[32px] p-10 text-white shadow-2xl shadow-purple-900/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between min-h-[180px]">
          <div className="relative z-10 space-y-2">
            <p className="text-blue-100 font-bold text-sm tracking-tight">Team total this week</p>
            <h2 className="text-5xl font-black tracking-tight flex items-baseline gap-3">
              {thisWeekTotal.toLocaleString()} <span className="text-2xl font-bold opacity-90">people reached</span>
            </h2>
            <p className="text-blue-100 font-medium text-sm opacity-80">
              {logs.filter(log => isWithinInterval(new Date(log.created_at), { start: weekStart, end: weekEnd }))
                .map(log => log.channel)
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(' · ') || 'No outreach yet'}
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-end justify-center mt-6 md:mt-0">
            <p className="text-blue-100 font-bold text-sm tracking-tight mb-1">vs last week</p>
            <div className={cn(
              "text-4xl font-black flex items-center gap-1",
              percentageChange >= 0 ? "text-emerald-300" : "text-red-300"
            )}>
              {percentageChange >= 0 ? '+' : ''}{percentageChange}%
            </div>
          </div>
          
          {/* Decorative circles to match high-end feel */}
          <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50%] left-[-10%] w-60 h-60 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="flex flex-wrap gap-8">
          {members.map(member => {
            const memberThisWeekLogs = thisWeekLogs.filter(log => log.member_id === member.user_id)
            const memberTotal = memberThisWeekLogs.reduce((acc, log) => acc + log.count, 0)
            const share = thisWeekTotal === 0 ? 0 : Math.round((memberTotal / thisWeekTotal) * 100)
            const color = getMemberColor(member.user_id)

            return (
              <div key={member.user_id} className="flex-1 min-w-[320px] max-w-full bg-card p-10 rounded-[32px] border border-border shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div className="flex items-center gap-5 mb-10">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-8 border-zinc-50 dark:border-zinc-800 shadow-sm transition-transform duration-500 group-hover:scale-110">
                      <AvatarFallback className="text-white font-black text-3xl" style={{ backgroundColor: color }}>
                        {member.profiles?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white dark:border-zinc-900 bg-[#10B981]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-foreground text-xl leading-tight tracking-tight">{member.profiles?.full_name?.split(' ')[0] || 'Member'}</h3>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-1">Lead Outreach</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-black text-foreground tabular-nums">{memberTotal}</span>
                      <span className="text-xs font-bold text-muted-foreground ml-2 whitespace-nowrap uppercase tracking-tighter">reached</span>
                    </div>
                    <div />
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out rounded-full" 
                      style={{ width: `${share}%`, backgroundColor: color }} 
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 space-y-6">
          <h2 className="text-xl font-black text-foreground flex items-center gap-3">
             <BarChart3 className="h-6 w-6 text-purple-500" /> Outreach feed
          </h2>
          <div className="space-y-6">
            {(isLoadingLogs || isLoadingMembers) && !logsData ? (
              <LogSkeleton rows={3} />
            ) : (
            logs.map(log => {
              const color = getMemberColor(log.member_id)
              const firstName = log.profiles?.full_name?.split(' ')[0] || 'Member'
              return (
                <div 
                  key={log.id} 
                  className={cn(
                    "group p-8 rounded-[40px] transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] min-h-[280px] flex flex-col justify-between",
                    "bg-white/70 dark:bg-white/[0.03] backdrop-blur-[10px] border border-zinc-200 dark:border-white/10",
                    "shadow-xl shadow-black/5 dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]"
                  )}
                >
                    {/* Header Row: Member on left, Status on right */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border border-zinc-200/50 dark:border-white/10 shadow-sm">
                          <AvatarFallback className="text-[10px] font-bold text-white" style={{ backgroundColor: color }}>
                            {firstName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white tracking-tight">{log.profiles?.full_name?.split(' ')[0] || 'Member'}</span>
                      </div>
                      {log.outreach_type === 'Campaign' && (
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          log.campaign_status === 'Live' 
                            ? "bg-emerald-500/10 text-emerald-500 animate-pulse" 
                            : "bg-zinc-500/10 text-zinc-500"
                        )}>
                          {log.campaign_status || 'Live'}
                        </div>
                      )}
                    </div>

                    {/* Content Section: Title and Channel */}
                    <div className="space-y-1 mb-6">
                      <h4 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight lowercase">
                        {log.count} reached today
                      </h4>
                      <p className="text-[13px] text-zinc-400 dark:text-zinc-500 font-medium lowercase">
                        via {log.channel}
                      </p>
                    </div>

                    {/* Note/Description */}
                    {log.note && (
                      <p className="text-[14px] text-zinc-700 dark:text-zinc-300 font-medium leading-normal mb-6">
                        {log.note}
                      </p>
                    )}

                    {/* Footer Area: Divider and Date + Delete Button */}
                    <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 dark:text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                        onClick={async (e) => {
                          e.stopPropagation()
                          queryClient.setQueryData(['outreach_logs', featureId], (old: OutreachLogRecord[]) => 
                            old?.filter(l => l.id !== log.id)
                          )
                          await deleteOutreachLog(log.id)
                        }}
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {format(new Date(log.created_at), 'do MMM')}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
