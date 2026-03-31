import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { login, register } from '../api'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setTokens } = useAuth()
  const navigate = useNavigate()

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        await register(username, email, password)
      }
      const loginEmail = mode === 'register' ? email : username
      const { data } = await login(loginEmail, password)
      setTokens(data.access, data.refresh, username || loginEmail)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.detail ?? JSON.stringify(e.response?.data) ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">⚡ Nexus Intel</div>
        <div className="login-sub">Autonomous Competitive Intelligence Platform</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['login', 'register'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`btn ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, textTransform: 'capitalize' }}>{m}</button>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">{mode === 'login' ? 'Email' : 'Username'}</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder={mode === 'login' ? 'email@example.com' : 'username'} type={mode === 'login' ? 'email' : 'text'} autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>

        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com" type="email" />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" type="password" onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: '10px' }}
          onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <div style={{ marginTop: 20, fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
          Connect to a running Nexus backend at{' '}
          <code style={{ color: '#60a5fa' }}>{import.meta.env.VITE_API_URL ?? 'http://localhost:80'}</code>
        </div>
      </div>
    </div>
  )
}
