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
import { Settings, Users, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

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
    <div className="h-full w-full max-w-4xl mx-auto py-8 text-zinc-100">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center mb-2">
          <Settings className="mr-3 h-8 w-8 text-zinc-400" />
          Workspace Settings
        </h1>
        <p className="text-zinc-400">Manage members and workspace configuration.</p>
      </div>

      <div className="grid gap-8">
        {/* INVITE SECTION */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <LinkIcon className="mr-2 h-5 w-5 text-blue-500" />
            Invite Members
          </h2>
          <form onSubmit={handleInvite} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-zinc-400">Email Address</label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="colleague@example.com" 
                className="bg-zinc-950 border-zinc-800" 
                required 
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm text-zinc-400">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="reader">Reader</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isInviting} className="bg-blue-600 hover:bg-blue-500 text-white">
              {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Generate Link'}
            </Button>
          </form>

          {generatedLink && (
            <div className="mt-4 p-4 bg-blue-950/30 border border-blue-900 rounded-lg">
              <p className="text-sm text-blue-400 mb-2">Invite link generated successfully! Send this link to the user:</p>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="bg-zinc-950 border-zinc-800 text-zinc-300" />
                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(generatedLink)}>Copy</Button>
              </div>
            </div>
          )}
        </section>

        {/* MEMBERS LIST */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-emerald-500" />
            Current Members
          </h2>
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead className="text-zinc-400">Role</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                  <TableHead className="text-right text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.user_id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-zinc-800">U</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-zinc-300">{m.user_id.substring(0,8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={m.role} onValueChange={(r) => handleRoleChange(m.user_id, r)}>
                        <SelectTrigger className="w-[120px] h-8 bg-zinc-950 border-zinc-800 text-zinc-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="reader">Reader</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-950/50" onClick={() => handleRemove(m.user_id)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* ACTIVE INVITES LIST */}
        {invites.length > 0 && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-zinc-300">Pending Invites</h2>
            <div className="space-y-2">
              {invites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-300">{inv.email}</span>
                    <span className="text-xs text-zinc-500">Expires: {new Date(inv.expires_at).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline" className="border-blue-900 text-blue-400 capitalize">{inv.role}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DANGER ZONE */}
        <section className="bg-red-950/10 border border-red-900/30 rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center">
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-red-900/20 rounded-lg">
              <div>
                <p className="font-semibold text-zinc-200">Delete Workspace</p>
                <p className="text-sm text-zinc-500">Once you delete a workspace, there is no going back. Please be certain.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Workspace
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-red-900/20 rounded-lg">
              <div>
                <p className="font-semibold text-zinc-200">Delete Account</p>
                <p className="text-sm text-zinc-500">Permanently remove your account and all associated data.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-900 hover:bg-red-800"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
