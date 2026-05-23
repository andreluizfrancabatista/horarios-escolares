import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Filter, Sun, Moon } from 'lucide-react'
import api from '../services/api'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
const SLOTS_RAW = [
  { hora:'07:00', turno:'Manhã' }, { hora:'07:50', turno:'Manhã' }, { hora:'08:40', turno:'Manhã' },
  { hora:'09:30', turno:'Manhã' }, { hora:'10:20', turno:'Manhã' }, { hora:'11:10', turno:'Manhã' },
  { hora:'13:00', turno:'Tarde', sep:true }, { hora:'13:50', turno:'Tarde' }, { hora:'14:40', turno:'Tarde' },
  { hora:'15:30', turno:'Tarde' }, { hora:'16:20', turno:'Tarde' }, { hora:'17:10', turno:'Tarde' },
  { hora:'18:10', turno:'Noite', sep:true }, { hora:'19:00', turno:'Noite' }, { hora:'19:50', turno:'Noite' },
  { hora:'20:40', turno:'Noite' }, { hora:'21:30', turno:'Noite' },
]

const THEMES = {
  dark: {
    bg:        '#0f1117',
    bgCard:    '#181c27',
    bgHover:   '#1e2333',
    border:    '#252a3a',
    text:      '#e8eaf2',
    textMuted: '#7a82a0',
    textDim:   '#4a5068',
    accent:    '#4f8ef7',
    accentDim: '#1e3a6e',
    yellow:    '#f5c842',
    orange:    '#f07a28',
    turnoCores:{ Manhã:'#f5c842', Tarde:'#f07a28', Noite:'#4f8ef7' },
    aulaCores: [
      { bg:'#1e3a6e', border:'#4f8ef7' }, { bg:'#1a4a33', border:'#34c97a' },
      { bg:'#4a3c10', border:'#f5c842' }, { bg:'#4a2a10', border:'#f07a28' },
      { bg:'#3a1a4a', border:'#b06ef7' }, { bg:'#1a3a4a', border:'#6ec8f7' },
    ],
  },
  if: {
    bg:        '#F8F9FA',
    bgCard:    '#FFFFFF',
    bgHover:   '#F5F5F5',
    border:    '#E0E0E0',
    text:      '#212121',
    textMuted: '#424242',
    textDim:   '#757575',
    accent:    '#2E7D32',
    accentDim: '#C8E6C9',
    yellow:    '#F57F17',
    orange:    '#E65100',
    turnoCores:{ Manhã:'#F57F17', Tarde:'#E65100', Noite:'#2E7D32' },
    aulaCores: [
      { bg:'#C8E6C9', border:'#2E7D32' }, { bg:'#BBDEFB', border:'#1565C0' },
      { bg:'#FFF9C4', border:'#F57F17' }, { bg:'#FFE0B2', border:'#E65100' },
      { bg:'#F3E5F5', border:'#6A1B9A' }, { bg:'#E1F5FE', border:'#0277BD' },
    ],
  },
}

function usePublicData() {
  const semestres   = useQuery({ queryKey:['pub-semestres'],   queryFn: () => api.get('/horarios/publico/semestres').then(r=>r.data) })
  const turmas      = useQuery({ queryKey:['pub-turmas'],      queryFn: () => api.get('/horarios/publico/turmas').then(r=>r.data) })
  const professores = useQuery({ queryKey:['pub-professores'], queryFn: () => api.get('/horarios/publico/professores').then(r=>r.data) })
  const salas       = useQuery({ queryKey:['pub-salas'],       queryFn: () => api.get('/horarios/publico/salas').then(r=>r.data) })
  return { semestres, turmas, professores, salas }
}

export default function GradePage() {
  const savedTheme = localStorage.getItem('grade-theme') || 'dark'
  const [themeName, setThemeName] = useState(savedTheme)
  const [view, setView]             = useState('turma')
  const [semestreId, setSemestreId] = useState(null)
  const [filtroId, setFiltroId]     = useState(null)

  const T = THEMES[themeName]

  const toggleTheme = () => {
    const next = themeName === 'dark' ? 'if' : 'dark'
    setThemeName(next)
    localStorage.setItem('grade-theme', next)
  }

  const { semestres, turmas, professores, salas } = usePublicData()
  const semestresList   = semestres.data   || []
  const turmasList      = turmas.data      || []
  const professoresList = professores.data || []
  const salasList       = salas.data       || []

  useEffect(() => {
    const ativo = semestresList.find(s => s.ativo)
    if (ativo && !semestreId) setSemestreId(ativo.id)
  }, [semestresList])

  const params = { semestre_id: semestreId }
  if (filtroId) {
    if (view === 'turma')     params.turma_id     = filtroId
    if (view === 'professor') params.professor_id = filtroId
    if (view === 'sala')      params.sala_id      = filtroId
  }

  const { data: horarios = [], isLoading } = useQuery({
    queryKey: ['pub-horarios', params],
    queryFn: () => api.get('/horarios/publico', { params }).then(r => r.data),
    enabled: !!semestreId && !!filtroId,
  })

  const discColors = {}
  let colorIdx = 0
  horarios.forEach(h => {
    if (h.disciplina_id && !discColors[h.disciplina_id]) {
      discColors[h.disciplina_id] = T.aulaCores[colorIdx % T.aulaCores.length]
      colorIdx++
    }
  })

  const aulaMap = {}
  horarios.forEach(h => {
    const key = `${h.dia_semana}|${h.horario_inicio}`
    if (!aulaMap[key]) aulaMap[key] = []
    aulaMap[key].push(h)
  })

  const filtroOptions     = view==='turma' ? turmasList : view==='professor' ? professoresList : salasList
  const filtroLabel       = view==='turma' ? 'Turma:' : view==='professor' ? 'Professor:' : 'Sala:'
  const filtroPlaceholder = view==='turma' ? 'Selecione uma turma…' : view==='professor' ? 'Selecione um professor…' : 'Selecione uma sala…'
  const semestreSelecionado = semestresList.find(s => s.id === semestreId)
  const filtroSelecionado   = filtroOptions.find(o => o.id === filtroId)

  const sel = (val) => ({
    background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: 6, padding: '7px 10px',
    color: T.text, fontSize: 13, outline: 'none',
  })

  return (
    <div style={{ minHeight:'100vh', background: T.bg, color: T.text, fontFamily:'DM Sans, sans-serif', transition:'background 0.2s, color 0.2s' }}>

      {/* Header */}
      <header style={{ background: T.bgCard, borderBottom: `1px solid ${T.border}`, padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:9, background: T.accent, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CalendarDays size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color: T.text }}>Grade de Horários</div>
            <div style={{ fontSize:11, color: T.textDim }}>Consulta pública — somente leitura</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* View toggle */}
          <div style={{ display:'flex', gap:3, background: T.bg, border: `1px solid ${T.border}`, borderRadius:6, padding:3 }}>
            {[{ v:'turma', l:'Turma' }, { v:'professor', l:'Professor' }, { v:'sala', l:'Sala' }].map(({ v, l }) => (
              <button key={v} onClick={() => { setView(v); setFiltroId(null) }}
                style={{ padding:'5px 12px', borderRadius:4, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                  background: view===v ? T.accent : 'transparent', color: view===v ? '#fff' : T.textMuted,
                  transition:'all 0.15s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Toggle dark/IF */}
          <button
            onClick={toggleTheme}
            title={themeName === 'dark' ? 'Mudar para tema claro (IF)' : 'Mudar para tema escuro'}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'7px 13px', borderRadius:6, border: `1px solid ${T.border}`,
              background: T.bgCard, color: T.textMuted, cursor:'pointer', fontSize:12, fontWeight:500,
              transition:'all 0.15s',
            }}>
            {themeName === 'dark'
              ? <><Sun size={14} /> Tema claro</>
              : <><Moon size={14} /> Tema escuro</>}
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div style={{ padding:'12px 24px', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center', borderBottom:`1px solid ${T.border}`, background: T.bgCard }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Filter size={13} color={T.textMuted} />
          <span style={{ fontSize:13, color: T.textMuted }}>Semestre:</span>
          <select style={sel()} value={semestreId||''} onChange={e => setSemestreId(Number(e.target.value))}>
            <option value="">Selecione…</option>
            {semestresList.map(s => <option key={s.id} value={s.id}>{s.nome}{s.ativo?' ✓':''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, color: T.textMuted }}>{filtroLabel}</span>
          <select style={{ ...sel(), maxWidth:300 }} value={filtroId||''} onChange={e => setFiltroId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{filtroPlaceholder}</option>
            {filtroOptions.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Título contextual */}
      {filtroSelecionado && semestreSelecionado && (
        <div style={{ padding:'12px 24px 0', color: T.textMuted, fontSize:13 }}>
          <span style={{ color: T.text, fontWeight:600 }}>{filtroSelecionado.nome}</span>
          {' · '}Semestre {semestreSelecionado.nome}
        </div>
      )}

      {/* Conteúdo */}
      <div style={{ padding:'16px 24px 80px' }}>
        {!semestreId && (
          <div style={{ textAlign:'center', padding:60, color: T.textDim }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
            <p>Selecione um semestre para visualizar a grade</p>
          </div>
        )}
        {!!semestreId && !filtroId && (
          <div style={{ textAlign:'center', padding:60, color: T.textDim }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👆</div>
            <p>{filtroPlaceholder.replace('…', ' para ver os horários')}</p>
          </div>
        )}

        {!!semestreId && !!filtroId && (
          isLoading ? (
            <div style={{ textAlign:'center', padding:60 }}>
              <div style={{ width:32, height:32, border:`3px solid ${T.border}`, borderTopColor: T.accent, borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto' }} />
            </div>
          ) : (
            <div style={{ background: T.bgCard, border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden', overflowX:'auto' }}>
              <div style={{ display:'grid', gridTemplateColumns:`72px repeat(${DIAS.length}, 1fr)`, minWidth:640 }}>
                {/* Cabeçalho */}
                <div style={{ background: T.bgCard, borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, padding:'10px 8px' }} />
                {DIAS.map(d => (
                  <div key={d} style={{ background: T.bgCard, borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, padding:'10px 8px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: T.textDim, textAlign:'center' }}>{d}</div>
                ))}

                {SLOTS_RAW.map(slot => (
                  <>
                    {slot.sep && (
                      <>
                        <div key={`sl-${slot.hora}`} style={{ background: T.bg, borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, padding:'3px 10px', display:'flex', alignItems:'center', minHeight:22 }}>
                          <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color: T.turnoCores[slot.turno] }}>── {slot.turno}</span>
                        </div>
                        {DIAS.map(d => <div key={`ss-${d}-${slot.hora}`} style={{ background: T.bg, borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, minHeight:22 }} />)}
                      </>
                    )}
                    <div key={`t-${slot.hora}`} style={{ background: T.bgCard, borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', minHeight:64 }}>
                      <span style={{ fontSize:11, fontWeight:600, color: T.turnoCores[slot.turno] }}>{slot.hora}</span>
                    </div>
                    {DIAS.map(dia => {
                      const aulas = aulaMap[`${dia}|${slot.hora}`] || []
                      return (
                        <div key={`${dia}-${slot.hora}`} style={{ borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, padding:'5px 7px', minHeight:64 }}>
                          {aulas.map(a => {
                            const c = discColors[a.disciplina_id] || T.aulaCores[0]
                            return (
                              <div key={a.id} style={{ background: c.bg, borderLeft:`3px solid ${c.border}`, borderRadius:5, padding:'5px 8px', marginBottom:3 }}>
                                <div style={{ fontWeight:600, fontSize:12, lineHeight:1.3, color: T.text }}>{a.disciplina?.nome || '—'}</div>
                                <div style={{ color: T.textMuted, fontSize:11, marginTop:2 }}>
                                  {[a.professor?.nome, a.sala?.nome].filter(Boolean).join(' · ')}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background: T.bgCard, borderTop:`1px solid ${T.border}`, padding:'9px 24px', fontSize:12, color: T.textDim, textAlign:'center' }}>
        Visualização de horários — somente leitura
        {' · '}
        <a href="/login" style={{ color: T.accent, textDecoration:'none' }}>Área administrativa</a>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
