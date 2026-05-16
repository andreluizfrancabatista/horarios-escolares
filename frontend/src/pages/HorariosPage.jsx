import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { horariosApi, cursosApi, disciplinasApi, professoresApi, salasApi, semestresApi } from '../services/api'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']

const SLOTS = [
  '07:00', '07:50', '08:40', '09:30', '10:20', '11:10',
  '13:00', '13:50', '14:40', '15:30', '16:20', '17:10',
  '18:10', '19:00', '19:50', '20:40', '21:30',
]

function slotFim(inicio) {
  const [h, m] = inicio.split(':').map(Number)
  const total = h * 60 + m + 50
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function ViewToggle({ view, setView }) {
  const opts = [
    { v: 'turma', label: 'Por Turma' },
    { v: 'professor', label: 'Por Professor' },
    { v: 'sala', label: 'Por Sala' },
  ]
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
      {opts.map(({ v, label }) => (
        <button key={v} onClick={() => setView(v)}
          className="btn btn-sm"
          style={{
            background: view === v ? 'var(--accent)' : 'transparent',
            color: view === v ? '#fff' : 'var(--text-muted)',
            border: 'none',
          }}
        >{label}</button>
      ))}
    </div>
  )
}

function AulaModal({ onClose, semestre_id, slot, cursos, disciplinas, professores, salas, onSave, existing }) {
  const [form, setForm] = useState(existing || {
    semestre_id,
    curso_id: '',
    disciplina_id: '',
    professor_id: '',
    sala_id: '',
    dia_semana: slot?.dia || '',
    horario_inicio: slot?.hora || '',
    horario_fim: slot ? slotFim(slot.hora) : '',
  })

  const discsFiltradas = disciplinas.filter(d => !form.curso_id || d.curso_id === Number(form.curso_id))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{existing ? 'Editar Aula' : 'Nova Aula'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Dia da Semana</label>
              <select className="form-select" value={form.dia_semana} onChange={e => set('dia_semana', e.target.value)}>
                <option value="">Selecione…</option>
                {DIAS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Horário Início</label>
              <select className="form-select" value={form.horario_inicio} onChange={e => {
                set('horario_inicio', e.target.value)
                set('horario_fim', slotFim(e.target.value))
              }}>
                <option value="">Selecione…</option>
                {SLOTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Curso</label>
            <select className="form-select" value={form.curso_id} onChange={e => {
              set('curso_id', e.target.value)
              set('disciplina_id', '')
            }}>
              <option value="">Selecione…</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Disciplina</label>
            <select className="form-select" value={form.disciplina_id} onChange={e => set('disciplina_id', e.target.value)}>
              <option value="">Selecione…</option>
              {discsFiltradas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Professor</label>
              <select className="form-select" value={form.professor_id} onChange={e => set('professor_id', e.target.value)}>
                <option value="">Sem professor</option>
                {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sala</label>
              <select className="form-select" value={form.sala_id} onChange={e => set('sala_id', e.target.value)}>
                <option value="">Sem sala</option>
                {salas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave({
            ...form,
            curso_id: Number(form.curso_id),
            disciplina_id: Number(form.disciplina_id),
            professor_id: form.professor_id ? Number(form.professor_id) : null,
            sala_id: form.sala_id ? Number(form.sala_id) : null,
          })}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HorariosPage() {
  const qc = useQueryClient()
  const [view, setView] = useState('turma')
  const [semestreId, setSemestreId] = useState(null)
  const [filtroId, setFiltroId] = useState(null)
  const [modal, setModal] = useState(null) // null | { slot, existing }

  const { data: semestres = [] } = useQuery({ queryKey: ['semestres'], queryFn: () => semestresApi.list().then(r => r.data) })
  const { data: cursos = [] } = useQuery({ queryKey: ['cursos'], queryFn: () => cursosApi.list().then(r => r.data) })
  const { data: disciplinas = [] } = useQuery({ queryKey: ['disciplinas'], queryFn: () => disciplinasApi.list().then(r => r.data) })
  const { data: professores = [] } = useQuery({ queryKey: ['professores'], queryFn: () => professoresApi.list().then(r => r.data) })
  const { data: salas = [] } = useQuery({ queryKey: ['salas'], queryFn: () => salasApi.list().then(r => r.data) })

  // Seleciona semestre ativo por padrão
  useEffect(() => {
    const ativo = semestres.find(s => s.ativo)
    if (ativo && !semestreId) setSemestreId(ativo.id)
  }, [semestres])

  const params = { semestre_id: semestreId }
  if (view === 'turma' && filtroId) params.curso_id = filtroId
  if (view === 'professor' && filtroId) params.professor_id = filtroId
  if (view === 'sala' && filtroId) params.sala_id = filtroId

  const { data: horarios = [] } = useQuery({
    queryKey: ['horarios', params],
    queryFn: () => horariosApi.list(params).then(r => r.data),
    enabled: !!semestreId,
  })

  const createMut = useMutation({
    mutationFn: horariosApi.create,
    onSuccess: () => { qc.invalidateQueries(['horarios']); setModal(null); toast.success('Aula adicionada!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao salvar'),
  })

  const deleteMut = useMutation({
    mutationFn: horariosApi.delete,
    onSuccess: () => { qc.invalidateQueries(['horarios']); toast.success('Aula removida') },
  })

  // Indexar horários por dia+slot
  const aulaMap = {}
  horarios.forEach(h => {
    const key = `${h.dia_semana}|${h.horario_inicio}`
    if (!aulaMap[key]) aulaMap[key] = []
    aulaMap[key].push(h)
  })

  const filtroOptions = view === 'turma' ? cursos
    : view === 'professor' ? professores
    : salas

  const colWidth = `${100 / (DIAS.length + 1)}%`

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade de Horários</h1>
          <p className="page-subtitle">Visualize e edite a grade semestral</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <ViewToggle view={view} setView={(v) => { setView(v); setFiltroId(null) }} />
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Semestre:</span>
          <select className="form-select" style={{ width: 'auto' }} value={semestreId || ''} onChange={e => setSemestreId(Number(e.target.value))}>
            <option value="">Selecione…</option>
            {semestres.map(s => <option key={s.id} value={s.id}>{s.nome}{s.ativo ? ' ✓' : ''}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {view === 'turma' ? 'Curso:' : view === 'professor' ? 'Professor:' : 'Sala:'}
          </span>
          <select className="form-select" style={{ width: 'auto' }} value={filtroId || ''} onChange={e => setFiltroId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Todos</option>
            {filtroOptions.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Grade */}
      {!semestreId ? (
        <div className="card empty">
          <div className="empty-icon">📅</div>
          <p>Selecione um semestre para visualizar a grade</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${DIAS.length}, 1fr)`,
            minWidth: 700,
          }}>
            {/* Header row */}
            <div className="schedule-cell header" style={{ borderTop: 'none' }}>Horário</div>
            {DIAS.map(d => (
              <div key={d} className="schedule-cell header" style={{ borderTop: 'none', justifyContent: 'center' }}>{d}</div>
            ))}

            {/* Slots */}
            {SLOTS.map(slot => (
              <>
                <div key={`t-${slot}`} className="schedule-cell time">{slot}</div>
                {DIAS.map(dia => {
                  const aulas = aulaMap[`${dia}|${slot}`] || []
                  return (
                    <div
                      key={`${dia}-${slot}`}
                      className="schedule-cell"
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => setModal({ slot: { dia, hora: slot }, existing: null })}
                    >
                      {aulas.map(a => (
                        <div key={a.id} className="aula-card" onClick={e => { e.stopPropagation() }}>
                          <div className="aula-disc">{a.disciplina?.nome || '—'}</div>
                          <div className="aula-meta">
                            {a.professor?.nome || ''}{a.sala ? ` · ${a.sala.nome}` : ''}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMut.mutate(a.id) }}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              background: 'none', border: 'none',
                              color: 'var(--text-dim)', cursor: 'pointer',
                              padding: 2, borderRadius: 4,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className="btn btn-primary"
        onClick={() => setModal({ slot: null, existing: null })}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          borderRadius: 99, padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(79,142,247,0.4)',
          fontSize: 15,
        }}
      >
        <Plus size={18} /> Nova Aula
      </button>

      {modal && (
        <AulaModal
          onClose={() => setModal(null)}
          semestre_id={semestreId}
          slot={modal.slot}
          cursos={cursos}
          disciplinas={disciplinas}
          professores={professores}
          salas={salas}
          existing={modal.existing}
          onSave={(data) => createMut.mutate(data)}
        />
      )}
    </div>
  )
}
