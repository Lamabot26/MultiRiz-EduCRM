'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/app-store'
import { toast } from 'sonner'

export function AdminLoginDialog() {
  const { showAdminLogin, setShowAdminLogin, setAdmin, setView } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Please enter username and password')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await res.json()
      setAdmin(data.admin)
      setView('admin')
      setShowAdminLogin(false)
      toast.success(`Welcome back, ${data.admin.name}!`)
      setUsername('')
      setPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {showAdminLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAdminLogin(false)}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-8 text-center relative">
              <button
                onClick={() => setShowAdminLogin(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4 ring-4 ring-white/20">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Admin Login</h2>
              <p className="text-sm text-primary-foreground/80">
                SP International School — CRM Portal
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
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
                className="w-full bg-primary text-primary-foreground py-2.5"
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

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Authorized personnel only. All actions are logged.
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
