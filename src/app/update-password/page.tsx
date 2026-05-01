'use client'

import { useState } from 'react'
import { updatePassword } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    const result = await updatePassword(formData)
    
    if (result?.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Update Password</CardTitle>
          <CardDescription className="text-zinc-400">
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">New Password</Label>
              <Input id="password" name="password" type="password" required className="border-zinc-700 bg-zinc-950/50 text-zinc-100 focus-visible:ring-blue-500" minLength={6} />
            </div>
            {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors" type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
