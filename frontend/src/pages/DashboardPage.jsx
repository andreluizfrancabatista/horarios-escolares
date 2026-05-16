import { useQuery } from '@tanstack/react-query'
import { cursosApi, disciplinasApi, professoresApi, salasApi, semestresApi } from '../services/api'
import { GraduationCap, BookOpen, Users, DoorOpen, School, CalendarDays } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: `${color}22`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: semestres = [] } = useQuery({ queryKey: ['semestres'], queryFn: () => semestresApi.list().then(r => r.data) })
  const { data: cursos = [] } = useQuery({ queryKey: ['cursos'], queryFn: () => cursosApi.list().then(r => r.data) })
  const { data: disciplinas = [] } = useQuery({ queryKey: ['disciplinas'], queryFn: () => disciplinasApi.list().then(r => r.data) })
  const { data: professores = [] } = useQuery({ queryKey: ['professores'], queryFn: () => professoresApi.list().then(r => r.data) })
  const { data: salas = [] } = useQuery({ queryKey: ['salas'], queryFn: () => salasApi.list().then(r => r.data) })

  const semestreAtivo = semestres.find(s => s.ativo)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {semestreAtivo ? `Semestre ativo: ${semestreAtivo.nome}` : 'Nenhum semestre ativo'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={School} label="Semestres" value={semestres.length} color="var(--accent)" />
        <StatCard icon={GraduationCap} label="Cursos" value={cursos.length} color="var(--green)" />
        <StatCard icon={BookOpen} label="Disciplinas" value={disciplinas.length} color="var(--yellow)" />
        <StatCard icon={Users} label="Professores" value={professores.length} color="var(--accent)" />
        <StatCard icon={DoorOpen} label="Salas" value={salas.filter(s => s.ativa).length} color="var(--green)" />
      </div>

      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Semestres cadastrados
        </h2>
        {semestres.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum semestre cadastrado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {semestres.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <CalendarDays size={16} style={{ color: 'var(--text-dim)' }} />
                <span style={{ fontWeight: 600 }}>{s.nome}</span>
                {s.data_inicio && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.data_inicio} → {s.data_fim}</span>}
                {s.ativo && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Ativo</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
