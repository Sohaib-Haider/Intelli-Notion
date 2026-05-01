'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setMessage(null)
    
    const result = await login(formData)
    
    if (result?.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  async function handleSignup(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setMessage(null)
    
    const result = await signup(formData)
    
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setMessage(result.success)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to your account or create a new one.
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 p-1 mb-4 rounded-md mx-6 w-[calc(100%-3rem)]">
            <TabsTrigger value="login" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white rounded-sm">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white rounded-sm">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form action={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="text-zinc-300">Email</Label>
                  <Input id="email-login" name="email" type="email" placeholder="name@example.com" required className="border-zinc-700 bg-zinc-950/50 text-zinc-100 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-login" className="text-zinc-300">Password</Label>
                    <Link href="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password-login" name="password" type="password" required className="border-zinc-700 bg-zinc-950/50 text-zinc-100 focus-visible:ring-blue-500" />
                </div>
                {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors" type="submit" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form action={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name-signup" className="text-zinc-300">Full Name</Label>
                  <Input id="full-name-signup" name="full_name" type="text" placeholder="John Doe" required className="border-zinc-700 bg-zinc-950/50 text-zinc-100 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-zinc-300">Email</Label>
                  <Input id="email-signup" name="email" type="email" placeholder="name@example.com" required className="border-zinc-700 bg-zinc-950/50 text-zinc-100 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="text-zinc-300">Password</Label>
                  <Input id="password-signup" name="password" type="password" required className="border-zinc-700 bg-zinc-950/50 text-zinc-100 focus-visible:ring-blue-500" />
                </div>
                {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
                {message && <p className="text-sm text-green-400 font-medium bg-green-400/10 p-3 rounded-md border border-green-400/20">{message}</p>}
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors" type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
