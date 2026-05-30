'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        setError('Check your email for a confirmation link.')
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: 'var(--primary)' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 24L16 8l8 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 18h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Winger Tracker
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Train like Neymar. Sprint like CR7.
        </p>
      </div>

      <Card style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-2">
          <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--muted)' }}>
            <button
              onClick={() => setMode('login')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: mode === 'login' ? 'var(--card)' : 'transparent',
                color: mode === 'login' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: mode === 'signup' ? 'var(--card)' : 'transparent',
                color: mode === 'signup' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              Create Account
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg"
                style={{
                  background: error.includes('Check') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: error.includes('Check') ? '#10b981' : '#ef4444',
                }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold touch-target"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              {loading ? 'Loading…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Your data is private and secured with Supabase RLS.
      </p>
    </div>
  )
}
