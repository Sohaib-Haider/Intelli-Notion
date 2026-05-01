'use client'

import * as React from 'react'
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from 'date-fns'
import { Plus, BarChart3, TrendingUp, TrendingDown, MoreHorizontal, Send, Mail, Link2, Camera, Phone, MessageSquare } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { getOutreachLogs, createOutreachLog, deleteOutreachLog } from '@/lib/actions/outreach'
import { getWorkspaceMembers } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'

const MEMBER_COLORS = [
  '#4F6EF7', // blue
  '#E85D75', // pink
  '#2DB89A', // teal
  '#EF9F27', // amber
  '#7F77DD', // purple
]

export function OutreachLog({ workspaceId, featureId, currentUser }: { workspaceId: string, featureId: string, currentUser: any }) {
  const [logs, setLogs] = React.useState<any[]>([])
  const [members, setMembers] = React.useState<any[]>([])
  const [isLogModalOpen, setIsLogModalOpen] = React.useState(false)
  
  const [channel, setChannel] = React.useState('Cold email')
  const [count, setCount] = React.useState('0')
  const [note, setNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    loadData()
  }, [workspaceId, featureId])

  async function loadData() {
    const [fetchedLogs, fetchedMembers] = await Promise.all([
      getOutreachLogs(featureId),
      getWorkspaceMembers(workspaceId)
    ])
    setLogs(fetchedLogs || [])
    setMembers(fetchedMembers || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    const result = await createOutreachLog(workspaceId, featureId, {
      channel,
      count: parseInt(count),
      note
    })
    
    if (result.success) {
      setIsLogModalOpen(false)
      setCount('0')
      setNote('')
      loadData()
    } else {
      alert("Error: " + result.error)
    }
    setIsSubmitting(false)
  }

  const getMemberColor = (memberId: string) => {
    const index = members.findIndex(m => m.user_id === memberId)
    return MEMBER_COLORS[index % MEMBER_COLORS.length]
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Cold email': return <Mail className="h-4 w-4" />
      case 'LinkedIn campaign': return <Link2 className="h-4 w-4" />
      case 'Instagram DM': return <Camera className="h-4 w-4" />
      case 'Phone calls': return <Phone className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
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
    <div className="flex flex-col h-full bg-[#F8FAFF] dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 overflow-y-auto scrollbar-hide -m-8 p-8 transition-all duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest">Live: {format(now, 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
            <DialogTrigger render={<Button className="bg-[#4F6EF7] hover:bg-[#3d59d6] text-white rounded-[20px] px-8 h-12 font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-95" />}>
              <Plus className="mr-2 h-5 w-5" /> Log Outreach
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden rounded-[32px] shadow-2xl">
              <div className="bg-[#4F6EF7] p-10 text-white relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tight">Add Record</DialogTitle>
                </DialogHeader>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Outreach Channel</label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger className="h-14 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[20px] focus:ring-2 focus:ring-[#4F6EF7]/20 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-[20px]">
                      <SelectItem value="Cold email">Cold email</SelectItem>
                      <SelectItem value="LinkedIn campaign">LinkedIn campaign</SelectItem>
                      <SelectItem value="Instagram DM">Instagram DM</SelectItem>
                      <SelectItem value="Phone calls">Phone calls</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Total Count</label>
                  <Input 
                    type="number" 
                    value={count}
                    onChange={e => setCount(e.target.value)}
                    className="h-14 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[20px] focus:ring-2 focus:ring-[#4F6EF7]/20 text-lg font-bold"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Notes & Feedback</label>
                  <Textarea 
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[20px] focus:ring-2 focus:ring-[#4F6EF7]/20 min-h-[120px] p-5"
                    placeholder="Describe the outreach results..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" type="button" onClick={() => setIsLogModalOpen(false)} className="flex-1 h-14 rounded-[20px] font-bold text-zinc-500 hover:bg-zinc-100">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-[2] h-14 bg-[#4F6EF7] hover:bg-[#3d59d6] text-white rounded-[20px] font-black text-lg shadow-xl shadow-blue-500/20">
                    {isSubmitting ? 'Syncing...' : 'Log outreach'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-blue-500/[0.03] relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.1em] text-[10px] mb-2">Weekly Outreach / Day</p>
              <div className="flex items-baseline gap-4 mb-6">
                <h2 className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{thisWeekTotal}</h2>
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs",
                  percentageChange >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-600"
                )}>
                  {percentageChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(percentageChange)}% <span className="opacity-60 font-medium ml-1">last week</span>
                </div>
              </div>
              <div className="h-20 w-full mt-4 flex items-end gap-1">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg relative group/bar overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-blue-500/20 transition-all duration-700 ease-out group-hover/bar:bg-blue-500" 
                      style={{ height: `${h}%` }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-blue-500/[0.03] relative overflow-hidden">
            <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.1em] text-[10px] mb-2">Team Engagement / Day</p>
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">84%</h2>
              <div className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12% <span className="opacity-60 font-medium ml-1">last week</span>
              </div>
            </div>
            <div className="flex gap-2 items-end h-20">
               <svg className="w-full h-full text-amber-500" viewBox="0 0 100 40" fill="none" preserveAspectRatio="none">
                 <path d="M0 35 Q 20 10, 40 25 T 80 5 T 100 20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                 <path d="M0 35 Q 20 10, 40 25 T 80 5 T 100 20 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.1" />
               </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-blue-500/[0.03] relative overflow-hidden">
            <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.1em] text-[10px] mb-2">Available Capacity / Day</p>
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">6.5 hr</h2>
              <div className="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +15% <span className="opacity-60 font-medium ml-1">last week</span>
              </div>
            </div>
            <div className="flex gap-2 items-end h-20">
               <svg className="w-full h-full text-cyan-500" viewBox="0 0 100 40" fill="none" preserveAspectRatio="none">
                 <path d="M0 20 Q 25 35, 50 15 T 100 25" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                 <path d="M0 20 Q 25 35, 50 15 T 100 25 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.1" />
               </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {members.map(member => {
            const memberThisWeekLogs = thisWeekLogs.filter(log => log.member_id === member.user_id)
            const memberTotal = memberThisWeekLogs.reduce((acc, log) => acc + log.count, 0)
            const share = thisWeekTotal === 0 ? 0 : Math.round((memberTotal / thisWeekTotal) * 100)
            const color = getMemberColor(member.user_id)

            return (
              <div key={member.user_id} className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-blue-500/[0.02] hover:shadow-2xl hover:shadow-blue-500/[0.05] dark:hover:border-zinc-700 transition-all duration-500 group">
                <div className="flex items-center gap-5 mb-10">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-8 border-zinc-50 dark:border-zinc-800 shadow-sm transition-transform duration-500 group-hover:scale-110">
                      <AvatarFallback className="text-white font-black text-3xl" style={{ backgroundColor: color }}>
                        {member.profiles?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white dark:border-zinc-900" style={{ backgroundColor: color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-xl leading-tight tracking-tight">{member.profiles?.full_name?.split(' ')[0] || 'Member'}</h3>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mt-1">Lead Outreach</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100">{memberTotal}</span>
                      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 ml-2">reached</span>
                    </div>
                    <span className="text-xs font-bold text-[#4F6EF7] bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">{share}%</span>
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
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
             <BarChart3 className="h-6 w-6 text-[#4F6EF7]" /> Outreach feed
          </h2>
          <div className="space-y-6">
            {logs.map(log => {
              const color = getMemberColor(log.member_id)
              return (
                <div key={log.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-blue-500/[0.01] hover:shadow-2xl hover:shadow-blue-500/[0.04] transition-all duration-500 flex gap-8 group">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-16 w-16 border-4 border-white dark:border-zinc-800 shadow-md">
                      <AvatarFallback className="text-white font-black text-lg" style={{ backgroundColor: color }}>
                        {log.profiles?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-[2px] flex-1 bg-zinc-50 dark:bg-zinc-800/50 mt-4 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">{log.profiles?.full_name || 'Member'}</h4>
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm" />
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">{format(new Date(log.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-4 py-2 rounded-[16px] border border-zinc-100 dark:border-zinc-800">
                        {getChannelIcon(log.channel)}
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{log.channel}</span>
                      </div>
                      <span className="text-sm font-black text-[#4F6EF7] bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-[16px] border border-blue-100/50 dark:border-blue-500/20">+{log.count} reached</span>
                    </div>
                    {log.note && (
                      <div className="bg-zinc-50/30 dark:bg-zinc-950/30 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 italic text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed shadow-inner">
                        "{log.note}"
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-zinc-300 dark:text-zinc-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all rounded-[12px]" onClick={() => deleteOutreachLog(log.id)}>
                    <Plus className="rotate-45 h-6 w-6" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

}
