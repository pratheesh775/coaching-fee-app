import { useState } from 'react'
import { GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle2, LogOut } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

interface Props {
  isFirstRun: boolean
  justLoggedOut?: boolean
  onAuthenticated: (username: string) => void
}

export default function AuthPage({ isFirstRun, justLoggedOut, onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>(isFirstRun ? 'register' : 'login')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Login
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  // Register
  const [regForm, setRegForm] = useState({
    username: '', password: '', confirmPassword: '',
    security_question: 'What is the name of your first school?',
    security_answer: ''
  })

  // Forgot / Reset
  const [forgotUser, setForgotUser] = useState('')
  const [secQuestion, setSecQuestion] = useState('')
  const [resetForm, setResetForm] = useState({ security_answer: '', new_password: '', confirm_password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await window.api.auth.login(loginForm.username, loginForm.password)
    setLoading(false)
    if (res.ok) {
      onAuthenticated(res.username!)
    } else {
      setError(res.error || 'Login failed')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (regForm.password !== regForm.confirmPassword) { setError('Passwords do not match'); return }
    if (regForm.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!regForm.security_answer.trim()) { setError('Security answer is required'); return }
    setLoading(true)
    const res = await window.api.auth.register({
      username: regForm.username,
      password: regForm.password,
      security_question: regForm.security_question,
      security_answer: regForm.security_answer
    })
    setLoading(false)
    if (res.ok) {
      onAuthenticated(regForm.username)
    } else {
      setError(res.error || 'Registration failed')
    }
  }

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await window.api.auth.getSecurityQuestion(forgotUser)
    if (res.ok && res.question) {
      setSecQuestion(res.question)
      setMode('reset')
    } else {
      setError(res.error || 'User not found')
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (resetForm.new_password !== resetForm.confirm_password) { setError('Passwords do not match'); return }
    if (resetForm.new_password.length < 6) { setError('Password must be at least 6 characters'); return }
    const res = await window.api.auth.resetPassword(forgotUser, resetForm.security_answer, resetForm.new_password)
    if (res.ok) {
      setSuccess('Password reset successfully! Please login.')
      setTimeout(() => { setSuccess(''); setMode('login') }, 2000)
    } else {
      setError(res.error || 'Reset failed')
    }
  }

  const SECURITY_QUESTIONS = [
    'What is the name of your first school?',
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'What city were you born in?',
    'What is your favourite teacher\'s name?'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-[#1a2d5a] to-[#0d1f3c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Coaching Fee Manager</h1>
          <p className="text-white/50 text-sm mt-1">by TechBySoul · techbysoul.com</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-bold text-navy mb-6">Welcome Back</h2>
              {justLoggedOut && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-xl mb-4">
                  <LogOut size={15} className="flex-shrink-0" />
                  You have been logged out successfully.
                </div>
              )}
              {error && <ErrorBanner msg={error} />}
              {success && <SuccessBanner msg={success} />}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="Enter username" autoFocus
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <input className="form-input pr-10" placeholder="Enter password"
                      type={showPwd ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                  className="text-sm text-primary hover:underline text-center">
                  Forgot password?
                </button>
              </form>
            </>
          )}

          {/* ── REGISTER (first run) ── */}
          {mode === 'register' && (
            <>
              <h2 className="text-xl font-bold text-navy mb-1">Create Admin Account</h2>
              <p className="text-sm text-gray-500 mb-6">First-time setup — create your master credentials</p>
              {error && <ErrorBanner msg={error} />}
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input className="form-input" placeholder="Choose a username" autoFocus
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="relative">
                    <input className="form-input pr-10" placeholder="Minimum 6 characters"
                      type={showPwd ? 'text' : 'password'}
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input className="form-input" placeholder="Re-enter password"
                    type={showPwd ? 'text' : 'password'}
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Security Question (for password reset)</label>
                  <select className="form-select" value={regForm.security_question}
                    onChange={(e) => setRegForm({ ...regForm, security_question: e.target.value })}>
                    {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Security Answer *</label>
                  <input className="form-input" placeholder="Your answer (case-insensitive)"
                    value={regForm.security_answer}
                    onChange={(e) => setRegForm({ ...regForm, security_answer: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account & Continue'}
                </button>
              </form>
            </>
          )}

          {/* ── FORGOT (enter username) ── */}
          {mode === 'forgot' && (
            <>
              <h2 className="text-xl font-bold text-navy mb-2">Forgot Password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your username to get the security question</p>
              {error && <ErrorBanner msg={error} />}
              <form onSubmit={handleForgotStep1} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="Your username" autoFocus
                    value={forgotUser} onChange={(e) => setForgotUser(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary w-full py-2.5">Continue</button>
                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  className="text-sm text-gray-400 hover:text-gray-600 text-center">
                  ← Back to Login
                </button>
              </form>
            </>
          )}

          {/* ── RESET PASSWORD ── */}
          {mode === 'reset' && (
            <>
              <h2 className="text-xl font-bold text-navy mb-2">Reset Password</h2>
              {error && <ErrorBanner msg={error} />}
              {success && <SuccessBanner msg={success} />}
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                  <strong>Security Question:</strong> {secQuestion}
                </div>
                <div className="form-group">
                  <label className="form-label">Your Answer</label>
                  <input className="form-input" placeholder="Answer (case-insensitive)"
                    value={resetForm.security_answer}
                    onChange={(e) => setResetForm({ ...resetForm, security_answer: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <input className="form-input pr-10" type={showPwd ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={resetForm.new_password}
                      onChange={(e) => setResetForm({ ...resetForm, new_password: e.target.value })} required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type={showPwd ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={resetForm.confirm_password}
                    onChange={(e) => setResetForm({ ...resetForm, confirm_password: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary w-full py-2.5">Reset Password</button>
                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  className="text-sm text-gray-400 hover:text-gray-600 text-center">
                  ← Back to Login
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} TechBySoul · All rights reserved
        </p>
      </div>
    </div>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
      <AlertCircle size={15} className="flex-shrink-0" />
      {msg}
    </div>
  )
}

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
      <CheckCircle2 size={15} className="flex-shrink-0" />
      {msg}
    </div>
  )
}
