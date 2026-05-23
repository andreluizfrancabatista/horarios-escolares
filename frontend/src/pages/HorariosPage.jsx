import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { horariosApi, turmasApi, disciplinasApi, professoresApi, salasApi, semestresApi } from '../services/api'
import ConfirmModal from '../components/ui/ConfirmModal'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']

const SLOTS_RAW = [
  { hora:'08:00', turno:'Manhã' }, { hora:'08:50', turno:'Manhã' },
  { hora:'10:00', turno:'Manhã' }, { hora:'10:50', turno:'Manhã' },
  { hora:'13:10', turno:'Tarde', sep:true }, { hora:'14:00', turno:'Tarde' },
  { hora:'15:10', turno:'Tarde' }, { hora:'16:00', turno:'Tarde' },
  { hora:'19:00', turno:'Noite', sep:true }, { hora:'19:50', turno:'Noite' },
  { hora:'21:00', turno:'Noite' }, { hora:'21:50', turno:'Noite' },
]
const TURNO_COLOR = { Manhã:'var(--yellow)', Tarde:'var(--orange)', Noite:'var(--accent)' }

function slotFim(inicio) {
  const [h, m] = inicio.split(':').map(Number)
  const total = h * 60 + m + 50
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

function ViewToggle({ view, setView }) {
  const opts = [{ v:'turma', l:'Por Turma' }, { v:'professor', l:'Por Professor' }, { v:'sala', l:'Por Sala' }]
  return (
    <div style={{ display:'flex', gap:4, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:4 }}>
      {opts.map(({ v, l }) => (
        <button key={v} onClick={() => setView(v)} className="btn btn-sm"
          style={{ background:view===v?'var(--accent)':'transparent', color:view===v?'#fff':'var(--text-muted)', border:'none' }}>
          {l}
        </button>
      ))}
    </div>
  )
}

// ─── Modal criar/editar aula ──────────────────────────────────────────────────
// prefill: { turma_id?, professor_id?, sala_id?, dia?, hora? } — vem do contexto atual
function AulaModal({ onClose, semestre_id, prefill, turmas, disciplinas, professores, salas, onSave, editando }) {
  const isEdit = !!editando

  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        semestre_id:    editando.semestre_id,
        turma_id:       String(editando.turma_id),
        disciplina_id:  String(editando.disciplina_id),
        professor_id:   editando.professor_id ? String(editando.professor_id) : '',
        sala_id:        editando.sala_id ? String(editando.sala_id) : '',
        dia_semana:     editando.dia_semana,
        horario_inicio: editando.horario_inicio,
        qtd_slots: 1,
      }
    }
    return {
      semestre_id,
      turma_id:       prefill?.turma_id     ? String(prefill.turma_id)     : '',
      disciplina_id:  '',
      professor_id:   prefill?.professor_id ? String(prefill.professor_id) : '',
      sala_id:        prefill?.sala_id      ? String(prefill.sala_id)      : '',
      dia_semana:     prefill?.dia || '',
      horario_inicio: prefill?.hora || '',
      qtd_slots: 1,
    }
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    const base = {
      semestre_id:   Number(form.semestre_id),
      turma_id:      Number(form.turma_id),
      disciplina_id: Number(form.disciplina_id),
      professor_id:  form.professor_id ? Number(form.professor_id) : null,
      sala_id:       form.sala_id      ? Number(form.sala_id)      : null,
      dia_semana:    form.dia_semana,
    }
    if (isEdit) {
      onSave([{ ...base, id: editando.id, horario_inicio: form.horario_inicio, horario_fim: slotFim(form.horario_inicio) }], true)
      return
    }
    const qtd = Number(form.qtd_slots) || 1
    const idx = SLOTS_RAW.findIndex(s => s.hora === form.horario_inicio)
    const lotes = []
    for (let i = 0; i < qtd; i++) {
      const s = SLOTS_RAW[idx + i]; if (!s) break
      lotes.push({ ...base, horario_inicio: s.hora, horario_fim: slotFim(s.hora) })
    }
    onSave(lotes, false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editar Aula' : 'Nova Aula'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Dia</label>
              <select className="form-select" value={form.dia_semana} onChange={e => set('dia_semana', e.target.value)}>
                <option value="">Selecione…</option>
                {DIAS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Início</label>
              <select className="form-select" value={form.horario_inicio} onChange={e => set('horario_inicio', e.target.value)}>
                <option value="">Selecione…</option>
                {SLOTS_RAW.map(s => <option key={s.hora} value={s.hora}>{s.hora} ({s.turno})</option>)}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Aulas consecutivas</label>
              <div style={{ display:'flex', gap:8 }}>
                {[1,2,3,4].map(n => (
                  <button key={n} type="button" onClick={() => set('qtd_slots', n)} className="btn btn-sm"
                    style={{ flex:1, border:'1px solid var(--border)', background:form.qtd_slots===n?'var(--accent)':'var(--bg)', color:form.qtd_slots===n?'#fff':'var(--text-muted)' }}>
                    {n}× (~{n*50}min)
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Turma</label>
            <select className="form-select" value={form.turma_id} onChange={e => set('turma_id', e.target.value)}>
              <option value="">Selecione…</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Disciplina</label>
            <select className="form-select" value={form.disciplina_id} onChange={e => set('disciplina_id', e.target.value)}>
              <option value="">Selecione…</option>
              {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
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
          <button className="btn btn-primary" onClick={handleSave}
            disabled={!form.dia_semana || !form.horario_inicio || !form.turma_id || !form.disciplina_id}>
            {isEdit ? 'Salvar alterações' : `Salvar ${form.qtd_slots > 1 ? form.qtd_slots+' aulas' : 'aula'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function HorariosPage() {
  const qc = useQueryClient()
  const [view, setView]             = useState('turma')
  const [semestreId, setSemestreId] = useState(null)
  const [filtroId, setFiltroId]     = useState(null)
  const [modal, setModal]           = useState(null)   // { prefill?, editando? }
  const [confirmDel, setConfirmDel] = useState(null)
  const [dragging, setDragging]     = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const { data: semestres = [] }   = useQuery({ queryKey:['semestres'],   queryFn: () => semestresApi.list().then(r=>r.data) })
  const { data: turmas = [] }      = useQuery({ queryKey:['turmas'],      queryFn: () => turmasApi.list().then(r=>r.data) })
  const { data: disciplinas = [] } = useQuery({ queryKey:['disciplinas'], queryFn: () => disciplinasApi.list().then(r=>r.data) })
  const { data: professores = [] } = useQuery({ queryKey:['professores'], queryFn: () => professoresApi.list().then(r=>r.data) })
  const { data: salas = [] }       = useQuery({ queryKey:['salas'],       queryFn: () => salasApi.list().then(r=>r.data) })

  useEffect(() => {
    const ativo = semestres.find(s => s.ativo)
    if (ativo && !semestreId) setSemestreId(ativo.id)
  }, [semestres])

  const gradeVisivel = !!semestreId && !!filtroId

  const params = { semestre_id: semestreId }
  if (filtroId) {
    if (view === 'turma')     params.turma_id     = filtroId
    if (view === 'professor') params.professor_id = filtroId
    if (view === 'sala')      params.sala_id      = filtroId
  }

  const { data: horarios = [] } = useQuery({
    queryKey: ['horarios', params],
    queryFn: () => horariosApi.list(params).then(r => r.data),
    enabled: gradeVisivel,
  })

  const createMut = useMutation({
    mutationFn: horariosApi.create,
    onSuccess: () => qc.invalidateQueries(['horarios']),
    onError: (e) => toast.error(e.response?.data?.detail || 'Conflito de horário'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => horariosApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['horarios']); toast.success('Aula atualizada!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Conflito de horário'),
  })
  const deleteMut = useMutation({
    mutationFn: horariosApi.delete,
    onSuccess: () => { qc.invalidateQueries(['horarios']); setConfirmDel(null); toast.success('Aula removida') },
  })

  const handleSaveAulas = async (lotes, isEdit) => {
    setModal(null)
    if (isEdit) { const { id, ...data } = lotes[0]; updateMut.mutate({ id, data }); return }
    let ok = 0, fail = 0
    for (const aula of lotes) {
      try { await createMut.mutateAsync(aula); ok++ } catch { fail++ }
    }
    if (ok)   toast.success(`${ok} aula(s) adicionada(s)!`)
    if (fail) toast.error(`${fail} aula(s) com conflito`)
    qc.invalidateQueries(['horarios'])
  }

  // Monta o prefill com base na view e filtro atual
  const buildPrefill = (dia, hora) => {
    const base = { dia, hora }
    if (view === 'turma'     && filtroId) return { ...base, turma_id:     filtroId }
    if (view === 'professor' && filtroId) return { ...base, professor_id: filtroId }
    if (view === 'sala'      && filtroId) return { ...base, sala_id:      filtroId }
    return base
  }

  // DnD
  const handleDragStart = (e, a) => { setDragging(a); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver  = (e, dia, hora) => { e.preventDefault(); setDropTarget({ dia, hora }) }
  const handleDrop = (e, dia, hora) => {
    e.preventDefault(); setDropTarget(null)
    if (!dragging || (dragging.dia_semana===dia && dragging.horario_inicio===hora)) return
    updateMut.mutate({ id: dragging.id, data: {
      semestre_id:   dragging.semestre_id, turma_id: dragging.turma_id,
      disciplina_id: dragging.disciplina_id,
      professor_id:  dragging.professor_id ?? null, sala_id: dragging.sala_id ?? null,
      dia_semana: dia, horario_inicio: hora, horario_fim: slotFim(hora),
    }})
    setDragging(null)
  }

  const aulaMap = {}
  horarios.forEach(h => {
    const key = `${h.dia_semana}|${h.horario_inicio}`
    if (!aulaMap[key]) aulaMap[key] = []
    aulaMap[key].push(h)
  })

  const filtroOptions     = view==='turma' ? turmas : view==='professor' ? professores : salas
  const filtroLabel       = view==='turma' ? 'Turma:' : view==='professor' ? 'Professor:' : 'Sala:'
  const filtroPlaceholder = view==='turma' ? 'Selecione uma turma…' : view==='professor' ? 'Selecione um professor…' : 'Selecione uma sala…'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade de Horários</h1>
          <p className="page-subtitle">Clique numa célula para adicionar · Arraste para mover · Clique na aula para editar</p>
        </div>
        <ViewToggle view={view} setView={v => { setView(v); setFiltroId(null) }} />
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Filter size={14} style={{ color:'var(--text-muted)' }} />
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>Semestre:</span>
          <select className="form-select" style={{ width:'auto' }} value={semestreId||''}
            onChange={e => setSemestreId(Number(e.target.value))}>
            <option value="">Selecione…</option>
            {semestres.map(s => <option key={s.id} value={s.id}>{s.nome}{s.ativo?' ✓':''}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>{filtroLabel}</span>
          <select className="form-select" style={{ width:'auto' }} value={filtroId||''}
            onChange={e => setFiltroId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{filtroPlaceholder}</option>
            {filtroOptions.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Estados vazios */}
      {!semestreId && (
        <div className="card empty"><div className="empty-icon">📅</div><p>Selecione um semestre</p></div>
      )}
      {!!semestreId && !filtroId && (
        <div className="card" style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>👆</div>
          <p>{filtroPlaceholder.replace('…', ' para visualizar a grade')}</p>
        </div>
      )}

      {/* Grade */}
      {gradeVisivel && (
        <div className="card" style={{ padding:0, overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:`72px repeat(${DIAS.length}, 1fr)`, minWidth:680 }}>
            <div className="schedule-cell header" style={{ borderTop:'none', borderLeft:'none' }} />
            {DIAS.map(d => <div key={d} className="schedule-cell header" style={{ borderTop:'none' }}>{d}</div>)}

            {SLOTS_RAW.map(slot => (
              <>
                {slot.sep && (
                  <>
                    <div key={`sl-${slot.hora}`} className="schedule-cell turno-sep" style={{ borderLeft:'none' }}>
                      <span className="turno-sep-label" style={{ color:TURNO_COLOR[slot.turno] }}>── {slot.turno}</span>
                    </div>
                    {DIAS.map(d => <div key={`ss-${d}-${slot.hora}`} className="schedule-cell turno-sep" />)}
                  </>
                )}
                <div key={`t-${slot.hora}`} className="schedule-cell time" style={{ borderLeft:'none' }}>
                  <span style={{ color:TURNO_COLOR[slot.turno] }}>{slot.hora}</span>
                </div>
                {DIAS.map(dia => {
                  const aulas = aulaMap[`${dia}|${slot.hora}`] || []
                  const isTarget = dropTarget?.dia===dia && dropTarget?.hora===slot.hora
                  return (
                    <div key={`${dia}-${slot.hora}`}
                      className={`schedule-cell${isTarget?' drop-target':''}`}
                      onClick={() => !dragging && setModal({ prefill: buildPrefill(dia, slot.hora) })}
                      onDragOver={e => handleDragOver(e, dia, slot.hora)}
                      onDrop={e => handleDrop(e, dia, slot.hora)}
                      onDragLeave={() => setDropTarget(null)}
                      style={{ cursor:dragging?'copy':'pointer' }}
                    >
                      {aulas.map(a => (
                        <div key={a.id} className="aula-card" draggable
                          onDragStart={e => { e.stopPropagation(); handleDragStart(e, a) }}
                          onDragEnd={() => { setDragging(null); setDropTarget(null) }}
                          onClick={e => { e.stopPropagation(); setModal({ editando: a }) }}
                        >
                          <div className="aula-disc">{a.disciplina?.nome || '—'}</div>
                          <div className="aula-meta">
                            {[a.professor?.nome, a.sala?.nome].filter(Boolean).join(' · ')}
                          </div>
                          <button className="aula-del"
                            onClick={e => { e.stopPropagation(); setConfirmDel(a) }}>
                            <Trash2 size={11} />
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

      {/* FAB — usa prefill do filtro atual sem dia/hora específicos */}
      <button className="btn btn-primary"
        onClick={() => setModal({ prefill: buildPrefill(null, null) })}
        style={{ position:'fixed', bottom:28, right:28, borderRadius:99, padding:'12px 22px', boxShadow:'0 4px 20px rgba(79,142,247,0.4)', fontSize:15, zIndex:100 }}>
        <Plus size={18} /> Nova Aula
      </button>

      {modal && (
        <AulaModal
          onClose={() => setModal(null)}
          semestre_id={semestreId}
          prefill={modal.prefill}
          editando={modal.editando}
          turmas={turmas}
          disciplinas={disciplinas}
          professores={professores}
          salas={salas}
          onSave={handleSaveAulas}
        />
      )}

      {confirmDel && (
        <ConfirmModal
          title="Remover aula"
          message={`Remover "${confirmDel.disciplina?.nome || 'esta aula'}" de ${confirmDel.dia_semana} às ${confirmDel.horario_inicio}?`}
          onConfirm={() => deleteMut.mutate(confirmDel.id)}
          onCancel={() => setConfirmDel(null)} />
      )}
    </div>
  )
}
