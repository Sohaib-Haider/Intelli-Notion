'use client'

import * as React from 'react'
import { getMembers, getInvites, createInvite, removeMember, updateMemberRole } from '@/lib/actions/members'
import { deleteWorkspace } from '@/lib/actions/workspace'
import { deleteAccount } from '@/app/login/actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Settings, Users, Link as LinkIcon, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const unwrappedParams = React.use(params)
  const workspaceId = unwrappedParams.workspaceId

  const [members, setMembers] = React.useState<any[]>([])
  const [invites, setInvites] = React.useState<any[]>([])
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState('editor')
  const [isInviting, setIsInviting] = React.useState(false)
  const [generatedLink, setGeneratedLink] = React.useState('')
  const router = useRouter()
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    loadData()
  }, [workspaceId])

  async function loadData() {
    setMembers(await getMembers(workspaceId))
    setInvites(await getInvites(workspaceId))
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setIsInviting(true)
    const res = await createInvite(workspaceId, email, role)
    if (res.success) {
      const link = `${window.location.origin}/invite/${res.token}`
      setGeneratedLink(link)
      setEmail('')
      loadData()
    } else {
      alert(res.error)
    }
    setIsInviting(false)
  }

  async function handleRoleChange(userId: string, newRole: string) {
    await updateMemberRole(workspaceId, userId, newRole)
    loadData()
  }

  async function handleRemove(userId: string) {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember(workspaceId, userId)
      loadData()
    }
  }

  async function handleDeleteWorkspace() {
    if (confirm('CRITICAL: This will permanently delete the workspace and all its data. Are you absolutely sure?')) {
      setIsDeleting(true)
      const res = await deleteWorkspace(workspaceId)
      if (res.success) {
        router.push('/dashboard')
      } else {
        alert(res.error)
      }
      setIsDeleting(false)
    }
  }

  async function handleDeleteAccount() {
    if (confirm('DANGER: This will permanently delete your account and ALL your workspaces. This action cannot be undone. Proceed?')) {
      setIsDeleting(true)
      const res = await deleteAccount()
      if (res?.error) {
        alert(res.error)
      }
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col bg-background text-zinc-900 dark:text-zinc-100 transition-all duration-500">
      {/* Header Section - Matches Task Tracker & Outreach Log */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Workspace Settings</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest">Active Configuration</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content - Left Side */}
          <div className="lg:col-span-8 space-y-8">
            {/* INVITE SECTION */}
            <section className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Invite Members</h2>
                  <p className="text-sm text-muted-foreground">Expand your team by sharing an invitation link.</p>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</label>
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="colleague@example.com" 
                      className="bg-background border-border rounded-xl h-11 focus-visible:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Role</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="bg-background border-border rounded-xl h-11 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="reader">Reader</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isInviting} 
                  className="w-full bg-[#4F6EF7] hover:bg-[#4F6EF7]/90 text-white rounded-xl h-11 font-bold shadow-lg shadow-[#4F6EF7]/20"
                >
                  {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Generate Invite Link'}
                </Button>
              </form>

              {generatedLink && (
                <div className="mt-6 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">Invitation link generated successfully!</p>
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="bg-background border-border text-foreground rounded-xl" />
                    <Button 
                      variant="secondary" 
                      className="rounded-xl font-bold px-6"
                      onClick={() => navigator.clipboard.writeText(generatedLink)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* MEMBERS LIST */}
            <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Team Members</h2>
                    <p className="text-sm text-muted-foreground">Manage active workspace contributors.</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest pl-8">User</TableHead>
                      <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Role</TableHead>
                      <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Joined</TableHead>
                      <TableHead className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => (
                      <TableRow key={m.user_id} className="border-border hover:bg-muted/30 group">
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-xl border border-border shadow-sm">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {m.user_id.substring(0,1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-sm text-foreground">{m.user_id.substring(0,8)}...</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={m.role} onValueChange={(r) => handleRoleChange(m.user_id, r)}>
                            <SelectTrigger className="w-[110px] h-9 bg-background border-border rounded-lg text-sm font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border rounded-xl">
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="reader">Reader</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-medium">
                          {new Date(m.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => handleRemove(m.user_id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>

          {/* Sidebar content - Right Side */}
          <div className="lg:col-span-4 space-y-8">
            {/* PENDING INVITES */}
            {invites.length > 0 && (
              <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Pending Invites</h3>
                <div className="space-y-3">
                  {invites.map(inv => (
                    <div key={inv.id} className="flex flex-col p-4 bg-muted/20 border border-border rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-foreground truncate">{inv.email}</span>
                        <Badge variant="outline" className="text-[10px] h-5 rounded-md border-blue-500/30 text-blue-500 capitalize">{inv.role}</Badge>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DANGER ZONE */}
            <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-red-500">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="font-black uppercase tracking-widest text-sm">Danger Zone</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">Delete Workspace</h4>
                  <p className="text-xs text-muted-foreground mb-3">Permanently remove this workspace and all its data.</p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteWorkspace}
                    disabled={isDeleting}
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl h-10 font-bold transition-all"
                  >
                    Delete Workspace
                  </Button>
                </div>

                <div className="pt-6 border-t border-red-500/10">
                  <h4 className="text-sm font-bold text-foreground mb-1">Delete Account</h4>
                  <p className="text-xs text-muted-foreground mb-3">Completely wipe your account and all data.</p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl h-10 font-bold transition-all"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
