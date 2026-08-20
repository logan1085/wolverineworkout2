'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // Tracked explicitly rather than sniffed out of the message text: most auth
  // failures ("Invalid login credentials") contain no such word, so the previous
  // substring check styled genuine errors as green successes.
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      if (isLogin) {
        await signIn(email, password)
        setMessage('Successfully signed in!')
      } else {
        await signUp(email, password)
        setMessage('Check your email for the confirmation link!')
      }
      setStatus('success')
    } catch (error: unknown) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-300">
            {isLogin
              ? 'Sign in and Logan will pick up where you left off.'
              : 'Logan builds you a workout in a two-minute chat.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              // Lets password managers fill and save credentials, which they
              // cannot do reliably without these hints.
              autoComplete="email"
              autoFocus
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600 hover:border-gray-500 transition-colors duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              // Supabase enforces a six character minimum server-side. Stating
              // it here turns a round-trip rejection into inline validation.
              minLength={isLogin ? undefined : 6}
              aria-describedby={isLogin ? undefined : 'password-hint'}
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600 hover:border-gray-500 transition-colors duration-200"
              placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
            />
            {!isLogin && (
              <p id="password-hint" className="mt-2 text-xs text-gray-400">
                Use at least 6 characters.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-700 text-white py-3 rounded-xl hover:from-teal-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading
              ? isLogin
                ? 'Signing in…'
                : 'Creating account…'
              : isLogin
              ? 'Sign in'
              : 'Create account'}
          </button>

          {message && (
            <div
              role={status === 'error' ? 'alert' : 'status'}
              aria-live={status === 'error' ? 'assertive' : 'polite'}
              className={`text-center text-sm ${
                status === 'error' ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                // Clear the previous result, so "Check your email for the
                // confirmation link!" does not linger over the sign-in form.
                setStatus('idle')
                setMessage('')
              }}
              className="text-teal-400 hover:text-teal-300 text-sm transition-colors duration-200"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 