import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { turmasApi, disciplinasApi, professoresApi, salasApi, semestresApi } from '../services/api'
import { GraduationCap, BookOpen, Users, DoorOpen, School, CalendarDays, ChevronRight } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, to }) {
  const navigate = useNavigate()
  return (
    <div className="card" onClick={() => navigate(to)}
      style={{ display:'flex', alignItems:'center', gap:16, cursor:'pointer', transition:'all 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ width:48, height:48, borderRadius:10, flexShrink:0, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex:1 }}>
        <div className="stat-number">{value ?? '—'}</div>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{label}</div>
      </div>
      <ChevronRight size={16} style={{ color:'var(--text-dim)' }} />
    </div>
  )
}

export default function DashboardPage() {
  const { data: semestres = [] }   = useQuery({ queryKey:['semestres'],   queryFn: () => semestresApi.list().then(r=>r.data) })
  const { data: turmas = [] }      = useQuery({ queryKey:['turmas'],      queryFn: () => turmasApi.list().then(r=>r.data) })
  const { data: disciplinas = [] } = useQuery({ queryKey:['disciplinas'], queryFn: () => disciplinasApi.list().then(r=>r.data) })
  const { data: professores = [] } = useQuery({ queryKey:['professores'], queryFn: () => professoresApi.list().then(r=>r.data) })
  const { data: salas = [] }       = useQuery({ queryKey:['salas'],       queryFn: () => salasApi.list().then(r=>r.data) })

  const semestreAtivo = semestres.find(s => s.ativo)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {semestreAtivo
              ? `Semestre ativo: ${semestreAtivo.nome}`
              : 'Nenhum semestre ativo — configure em Semestres'}
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginBottom:32 }}>
        <StatCard icon={School}        label="Semestres"    value={semestres.length}                   color="var(--accent)" to="/semestres" />
        <StatCard icon={GraduationCap} label="Turmas"       value={turmas.length}                      color="var(--green)"  to="/turmas" />
        <StatCard icon={BookOpen}      label="Disciplinas"  value={disciplinas.length}                 color="var(--yellow)" to="/disciplinas" />
        <StatCard icon={Users}         label="Professores"  value={professores.length}                 color="var(--accent)" to="/professores" />
        <StatCard icon={DoorOpen}      label="Salas ativas" value={salas.filter(s=>s.ativa).length}   color="var(--green)"  to="/salas" />
      </div>

      <div className="card">
        <h2 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Semestres cadastrados</h2>
        {semestres.length === 0 ? (
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>Nenhum semestre. <a href="/semestres">Criar agora →</a></p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {semestres.map(s => (
              <div key={s.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                background: s.ativo ? 'var(--accent-dim)' : 'var(--bg)',
                borderRadius:'var(--radius-sm)',
                border: `1px solid ${s.ativo ? 'var(--accent)' : 'var(--border)'}`,
              }}>
                <CalendarDays size={15} style={{ color: s.ativo ? 'var(--accent)' : 'var(--text-dim)', flexShrink:0 }} />
                <span style={{ fontWeight:600, fontSize:14 }}>{s.nome}</span>
                {s.data_inicio && <span style={{ color:'var(--text-muted)', fontSize:12 }}>{s.data_inicio} → {s.data_fim}</span>}
                {s.ativo && <span className="badge badge-green" style={{ marginLeft:'auto' }}>Ativo</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
