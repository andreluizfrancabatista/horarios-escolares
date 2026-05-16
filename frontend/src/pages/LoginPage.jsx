import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Lock, Mail } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      login(data.access_token, { nome: data.nome })
      navigate('/horarios')
    } catch {
      toast.error('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.08) 0%, transparent 60%)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--accent)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 0 40px rgba(79,142,247,0.3)',
          }}>
            <CalendarDays size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Horários Escolares
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Sistema de Gestão Acadêmica
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-dim)',
                  }} />
                  <input
                    type="email" className="form-input"
                    style={{ paddingLeft: 36 }}
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@escola.edu.br"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-dim)',
                  }} />
                  <input
                    type="password" className="form-input"
                    style={{ paddingLeft: 36 }}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit" className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '11px 0', marginTop: 4 }}
              >
                {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
