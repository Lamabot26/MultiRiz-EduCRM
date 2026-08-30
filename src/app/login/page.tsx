'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Lock, User, ArrowRight, Eye, EyeOff, GraduationCap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SCHOOL } from '@/lib/school-data'
import { toast } from 'sonner'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Please try again.')
        setLoading(false)
        return
      }

      toast.success(`Welcome back, ${data.user.name}!`)
      const callbackUrl = params.get('callbackUrl')
      router.push(callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard')
      router.refresh()
    } catch {
      setError('Unable to connect to the server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Title */}
        <div className="text-center mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{SCHOOL.name}</h1>
          <p className="text-white/70 text-sm sm:text-base">Dedicated to Excellence, Where Excellence is Habit</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm mb-3 ring-4 ring-white/20">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold">Admin Login</h2>
            <p className="text-sm text-primary-foreground/80 mt-1">
              Sign in to access the school CRM dashboard
            </p>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-9"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 text-base"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="px-6 pb-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Back to School Website
            </Link>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Authorized personnel only. All actions are logged.
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
