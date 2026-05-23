import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, Play, CheckCheck, AlertTriangle, Clock, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { semestresApi, turmasApi, disciplinasApi, professoresApi, salasApi, alocacoesApi, disponibilidadesApi, solverApi } from '../services/api'
import ConfirmModal from '../components/ui/ConfirmModal'
import BulkImportModal from '../components/ui/BulkImportModal'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
const SLOTS = [
  '08:00','08:50','10:00','10:50',
  '13:10','14:00','15:10','16:00',
  '19:00','19:50','21:00','21:50',
]
const TURNO_LABEL = { '08:00':'Manhã', '13:10':'Tarde', '19:00':'Noite' }
const TIPO_BG  = { indisponivel:'var(--red-dim)',    prefere_nao:'var(--yellow-dim)' }
const TIPO_COR = { indisponivel:'var(--red)',         prefere_nao:'var(--yellow)' }

// ─── Aba 1: Alocações ─────────────────────────────────────────────────────────
function AbaAlocacoes({ semestreId }) {
  const qc = useQueryClient()
  const [form, setForm]         = useState({ professor_id:'', disciplina_id:'', turma_id:'', sala_id:'' })
  const [confirmDel, setConfirmDel] = useState(null)
  const [showBulk, setShowBulk] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: salas = [] }       = useQuery({ queryKey:['salas'],       queryFn: () => salasApi.list().then(r=>r.data) })
  const { data: turmas = [] }      = useQuery({ queryKey:['turmas'],      queryFn: () => turmasApi.list().then(r=>r.data) })
  const { data: disciplinas = [] } = useQuery({ queryKey:['disciplinas'], queryFn: () => disciplinasApi.list().then(r=>r.data) })
  const { data: professores = [] } = useQuery({ queryKey:['professores'], queryFn: () => professoresApi.list().then(r=>r.data) })
  const { data: alocacoes = [] }   = useQuery({
    queryKey: ['alocacoes', semestreId],
    queryFn: () => alocacoesApi.list(semestreId).then(r=>r.data),
    enabled: !!semestreId,
  })

  const createMut = useMutation({
    mutationFn: alocacoesApi.create,
    onSuccess: () => { qc.invalidateQueries(['alocacoes']); setForm({ professor_id:'', disciplina_id:'', turma_id:'' }); toast.success('Alocação criada!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao criar alocação'),
  })
  const deleteMut = useMutation({
    mutationFn: alocacoesApi.delete,
    onSuccess: () => { qc.invalidateQueries(['alocacoes']); setConfirmDel(null); toast.success('Removida') },
  })

  const handleAdd = () => {
    if (!form.professor_id || !form.disciplina_id || !form.turma_id) {
      toast.error('Preencha todos os campos'); return
    }
    createMut.mutate({
      semestre_id:   semestreId,
      professor_id:  Number(form.professor_id),
      disciplina_id: Number(form.disciplina_id),
      turma_id:      Number(form.turma_id),
      sala_id:       form.sala_id ? Number(form.sala_id) : null,
    })
  }

  return (
    <div>
      <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:20 }}>
        Defina quem ministra qual disciplina para cada turma. O solver usará essas alocações para montar a grade.
      </p>

      {/* Formulário */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Nova alocação</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
          <div className="form-group">
            <label className="form-label">Professor</label>
            <select className="form-select" value={form.professor_id} onChange={e => set('professor_id', e.target.value)}>
              <option value="">Selecione…</option>
              {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Disciplina</label>
            <select className="form-select" value={form.disciplina_id} onChange={e => set('disciplina_id', e.target.value)}>
              <option value="">Selecione…</option>
              {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turma</label>
            <select className="form-select" value={form.turma_id} onChange={e => set('turma_id', e.target.value)}>
              <option value="">Selecione…</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sala preferida <span style={{color:'var(--text-dim)',fontWeight:400}}>(opcional)</span></label>
            <select className="form-select" value={form.sala_id} onChange={e => set('sala_id', e.target.value)}>
              <option value="">Qualquer sala</option>
              {salas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-primary" onClick={handleAdd} disabled={createMut.isPending}>
            <Plus size={15} /> Adicionar
          </button>
          <button className="btn btn-ghost" onClick={() => setShowBulk(true)}>
            <Upload size={15} /> Importar CSV
          </button>
        </div>
      </div>

      {/* Lista */}
      {alocacoes.length === 0 ? (
        <div className="empty card"><div className="empty-icon">📋</div><p>Nenhuma alocação cadastrada</p></div>
      ) : (
        <div className="card" style={{ padding:0 }}>
          <table><thead><tr>
            <th>Professor</th><th>Disciplina</th><th>Turma</th><th>Sala pref.</th><th style={{ width:60 }}>Ações</th>
          </tr></thead>
          <tbody>
            {alocacoes.map(a => (
              <tr key={a.id}>
                <td>{a.professor?.nome}</td>
                <td>{a.disciplina?.nome}</td>
                <td>{a.turma?.nome}</td>
                <td style={{color:'var(--text-muted)'}}>{a.sala?.nome || '—'}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(a)}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {showBulk && (
        <BulkImportModal
          tipo="alocacoes"
          semestreId={semestreId}
          onClose={() => setShowBulk(false)}
          onSuccess={() => qc.invalidateQueries(['alocacoes'])}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Remover alocação"
          message={`Remover ${confirmDel.professor?.nome} → ${confirmDel.disciplina?.nome} → ${confirmDel.turma?.nome}?`}
          onConfirm={() => deleteMut.mutate(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

// ─── Aba 2: Disponibilidades ──────────────────────────────────────────────────
function AbaDisponibilidades({ semestreId }) {
  const qc = useQueryClient()
  const [profId, setProfId]         = useState(null)
  const [grade, setGrade]           = useState({})
  const [saving, setSaving]         = useState(false)
  const [showBulk, setShowBulk]     = useState(false)

  const { data: professores = [] } = useQuery({
    queryKey: ['professores'],
    queryFn: () => professoresApi.list().then(r=>r.data),
  })
  const { data: dispData = [] } = useQuery({
    queryKey: ['disp', semestreId, profId],
    queryFn: () => disponibilidadesApi.list(semestreId, profId).then(r=>r.data),
    enabled: !!semestreId && !!profId,
  })

  useEffect(() => {
    const g = {}
    dispData.forEach(d => { g[`${d.dia_semana}|${d.horario_inicio}`] = d.tipo })
    setGrade(g)
  }, [dispData])

  const toggleSlot = (dia, hora) => {
    const key = `${dia}|${hora}`
    setGrade(g => {
      const atual = g[key]
      if (!atual)                   return { ...g, [key]: 'indisponivel' }
      if (atual === 'indisponivel') return { ...g, [key]: 'prefere_nao' }
      const next = { ...g }; delete next[key]; return next
    })
  }

  const handleSave = async () => {
    if (!profId) return
    setSaving(true)
    const slots = Object.entries(grade).map(([key, tipo]) => {
      const [dia_semana, horario_inicio] = key.split('|')
      return { semestre_id: semestreId, professor_id: profId, dia_semana, horario_inicio, tipo }
    })
    try {
      await disponibilidadesApi.salvarGrade(profId, semestreId, slots)
      qc.invalidateQueries(['disp'])
      toast.success('Disponibilidade salva!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const nIndisp   = Object.values(grade).filter(v => v === 'indisponivel').length
  const nPrefNao  = Object.values(grade).filter(v => v === 'prefere_nao').length

  return (
    <div>
      <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:20 }}>
        Selecione um professor e clique nos slots para marcar restrições.
        1× = <span style={{ color:'var(--red)' }}>Indisponível</span> (rígido) ·
        2× = <span style={{ color:'var(--yellow)' }}>Prefere não</span> (suave) ·
        3× = limpa
      </p>

      {/* Controles */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <select className="form-select" style={{ width:'auto', minWidth:260 }}
          value={profId||''} onChange={e => setProfId(Number(e.target.value) || null)}>
          <option value="">Selecione um professor…</option>
          {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        {profId && (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <span className="spinner" style={{ width:16, height:16 }} />
              : <><CheckCheck size={15} /> Salvar</>}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setShowBulk(true)}>
          <Upload size={15} /> Importar CSV
        </button>
        {profId && (nIndisp > 0 || nPrefNao > 0) && (
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>
            {nIndisp > 0 && <span style={{ color:'var(--red)' }}>{nIndisp} indisponível </span>}
            {nPrefNao > 0 && <span style={{ color:'var(--yellow)' }}>{nPrefNao} prefere não</span>}
          </span>
        )}
      </div>

      {/* Grade */}
      {!profId ? (
        <div className="empty card"><div className="empty-icon">👤</div><p>Selecione um professor</p></div>
      ) : (
        <div className="card" style={{ padding:0, overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:`80px repeat(${DIAS.length}, 1fr)`, minWidth:500 }}>
            <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:8, fontSize:11, color:'var(--text-dim)' }} />
            {DIAS.map(d => (
              <div key={d} style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', borderLeft:'1px solid var(--border)', padding:8, fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-dim)', textAlign:'center' }}>
                {d}
              </div>
            ))}
            {SLOTS.map(hora => (
              <>
                {TURNO_LABEL[hora] && (
                  <>
                    <div key={`tl-${hora}`} style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)', padding:'3px 8px', display:'flex', alignItems:'center' }}>
                      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'var(--text-dim)' }}>── {TURNO_LABEL[hora]}</span>
                    </div>
                    {DIAS.map(d => <div key={`ts-${d}-${hora}`} style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)', borderLeft:'1px solid var(--border)' }} />)}
                  </>
                )}
                <div key={`h-${hora}`} style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:'0 8px', minHeight:44, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{hora}</span>
                </div>
                {DIAS.map(dia => {
                  const key = `${dia}|${hora}`
                  const tipo = grade[key]
                  return (
                    <div key={`${dia}-${hora}`}
                      onClick={() => toggleSlot(dia, hora)}
                      style={{
                        borderBottom:'1px solid var(--border)', borderLeft:'1px solid var(--border)',
                        minHeight:44, cursor:'pointer', transition:'background 0.1s',
                        background: tipo ? TIPO_BG[tipo] : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}
                      onMouseEnter={e => { if (!tipo) e.currentTarget.style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (!tipo) e.currentTarget.style.background = 'transparent' }}
                    >
                      {tipo === 'indisponivel' && <span style={{ fontSize:16, color:'var(--red)' }}>✕</span>}
                      {tipo === 'prefere_nao'  && <span style={{ fontSize:14, color:'var(--yellow)' }}>~</span>}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {showBulk && (
        <BulkImportModal
          tipo="disponibilidades"
          semestreId={semestreId}
          onClose={() => setShowBulk(false)}
          onSuccess={() => qc.invalidateQueries(['disp'])}
        />
      )}
    </div>
  )
}

// ─── Aba 3: Solver ────────────────────────────────────────────────────────────
function AbaSolver({ semestreId }) {
  const qc = useQueryClient()
  const [resultado, setResultado]     = useState(null)
  const [rodando, setRodando]         = useState(false)
  const [aceitando, setAceitando]     = useState(false)
  const [confirmAceitar, setConfirmAceitar] = useState(false)

  const handleRodar = async () => {
    setRodando(true); setResultado(null)
    try {
      const { data } = await solverApi.rodar(semestreId)
      setResultado(data)
      if (data.status === 'ok')       toast.success('Solução ótima encontrada!')
      else if (data.status === 'parcial') toast.success('Solução parcial — verifique os avisos')
      else toast.error('Não foi possível encontrar solução')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao rodar solver')
    } finally { setRodando(false) }
  }

  const handleAceitar = async () => {
    if (!resultado?.slots?.length) return
    setAceitando(true)
    try {
      await solverApi.aceitar(resultado.slots, semestreId)
      qc.invalidateQueries(['horarios'])
      toast.success(`${resultado.slots.length} aula(s) importadas para a grade!`)
      setResultado(null); setConfirmAceitar(false)
    } catch { toast.error('Erro ao aceitar proposta') }
    finally { setAceitando(false) }
  }

  const STATUS_INFO = {
    ok:       { icon:'✅', label:'Solução ótima',   cor:'var(--green)' },
    parcial:  { icon:'⚠️', label:'Solução parcial', cor:'var(--yellow)' },
    inviavel: { icon:'❌', label:'Inviável',         cor:'var(--red)' },
  }

  const porTurma = {}
  if (resultado?.slots) {
    resultado.slots.forEach(s => {
      if (!porTurma[s.turma_nome]) porTurma[s.turma_nome] = []
      porTurma[s.turma_nome].push(s)
    })
  }

  const DIAS_ORDER = ['Segunda','Terça','Quarta','Quinta','Sexta']

  return (
    <div>
      <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:20 }}>
        Configure as alocações (Aba 1) e disponibilidades (Aba 2) antes de rodar.
        O processo pode levar até 60 segundos.
      </p>

      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn btn-primary"
          onClick={handleRodar} disabled={rodando || !semestreId}
          style={{ padding:'10px 24px', fontSize:15 }}>
          {rodando
            ? <><span className="spinner" style={{ width:16, height:16 }} /> Rodando solver…</>
            : <><Play size={16} /> Gerar grade automaticamente</>}
        </button>
        {rodando && (
          <span style={{ color:'var(--text-muted)', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={13} /> Pode levar até 60 segundos…
          </span>
        )}
      </div>

      {resultado && (
        <>
          {/* Card de status */}
          <div className="card" style={{ marginBottom:16, borderColor: STATUS_INFO[resultado.status]?.cor }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:28 }}>{STATUS_INFO[resultado.status]?.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:16, color: STATUS_INFO[resultado.status]?.cor }}>
                  {STATUS_INFO[resultado.status]?.label}
                </div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
                  {resultado.stats?.aulas_alocadas ?? 0} de {resultado.stats?.aulas_esperadas ?? '?'} aulas alocadas
                  {resultado.stats?.blocos_alocados != null && ` · ${resultado.stats.blocos_alocados} blocos`}
                  {resultado.stats?.tempo_segundos  != null && ` · ${resultado.stats.tempo_segundos}s`}
                  {resultado.stats?.penalidade_total != null && ` · penalidade: ${resultado.stats.penalidade_total}`}
                </div>
              </div>
              {resultado.slots?.length > 0 && (
                <button className="btn btn-primary" onClick={() => setConfirmAceitar(true)} disabled={aceitando}>
                  <CheckCheck size={15} /> Aceitar e importar para grade
                </button>
              )}
            </div>
          </div>

          {/* Conflitos / avisos */}
          {resultado.conflitos?.length > 0 && (
            <div className="card" style={{ marginBottom:16, borderColor:'var(--yellow)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <AlertTriangle size={16} color="var(--yellow)" />
                <span style={{ fontWeight:600, fontSize:14 }}>
                  {resultado.status === 'inviavel' ? 'Conflitos que impedem a solução' : 'Avisos'}
                </span>
              </div>
              {resultado.conflitos.map((c, i) => (
                <div key={i} style={{ fontSize:13, color:'var(--text-muted)', padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                  {c}
                </div>
              ))}
            </div>
          )}

          {/* Grade proposta por turma */}
          {Object.keys(porTurma).length > 0 && (
            <div>
              <div style={{ fontWeight:600, fontSize:15, marginBottom:12 }}>Grade proposta</div>
              {Object.entries(porTurma).map(([turma, slots]) => (
                <div key={turma} className="card" style={{ marginBottom:12, padding:0 }}>
                  <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:14 }}>
                    {turma}
                  </div>
                  <table><thead><tr>
                    <th>Dia</th><th>Horário</th><th>Disciplina</th><th>Professor</th><th>Sala</th>
                  </tr></thead>
                  <tbody>
                    {[...slots]
                      .sort((a,b) => DIAS_ORDER.indexOf(a.dia_semana) - DIAS_ORDER.indexOf(b.dia_semana) || a.horario_inicio.localeCompare(b.horario_inicio))
                      .map((s, i) => (
                        <tr key={i}>
                          <td>{s.dia_semana}</td>
                          <td>{s.horario_inicio}–{s.horario_fim}</td>
                          <td>{s.disciplina_nome}</td>
                          <td>{s.professor_nome}</td>
                          <td style={{ color:'var(--text-muted)' }}>{s.sala_id ? `Sala #${s.sala_id}` : '—'}</td>
                        </tr>
                      ))}
                  </tbody></table>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {confirmAceitar && (
        <ConfirmModal
          title="Aceitar e importar grade"
          message={`Isso substituirá todos os horários atuais do semestre pelos ${resultado?.slots?.length} slots gerados. Deseja continuar?`}
          danger={false}
          onConfirm={handleAceitar}
          onCancel={() => setConfirmAceitar(false)}
        />
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AutoPage() {
  const [aba, setAba]               = useState('alocacoes')
  const [semestreId, setSemestreId] = useState(null)

  const { data: semestres = [] } = useQuery({
    queryKey: ['semestres'],
    queryFn: () => semestresApi.list().then(r => r.data),
  })

  useEffect(() => {
    const ativo = semestres.find(s => s.ativo)
    if (ativo && !semestreId) setSemestreId(ativo.id)
  }, [semestres])

  const abas = [
    { id:'alocacoes',        label:'1. Alocações' },
    { id:'disponibilidades', label:'2. Disponibilidades' },
    { id:'solver',           label:'3. Rodar Solver' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alocação Automática</h1>
          <p className="page-subtitle">Geração de grade com Google OR-Tools CP-SAT</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>Semestre:</span>
          <select className="form-select" style={{ width:'auto' }} value={semestreId||''}
            onChange={e => setSemestreId(Number(e.target.value) || null)}>
            <option value="">Selecione…</option>
            {semestres.map(s => <option key={s.id} value={s.id}>{s.nome}{s.ativo?' ✓':''}</option>)}
          </select>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid var(--border)' }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{
              padding:'10px 20px', border:'none', cursor:'pointer', fontSize:14,
              fontWeight: aba===a.id ? 600 : 400,
              background:'transparent',
              borderBottom: aba===a.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: aba===a.id ? 'var(--accent)' : 'var(--text-muted)',
              marginBottom:-1, transition:'all 0.15s',
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {!semestreId ? (
        <div className="card empty"><div className="empty-icon">📅</div><p>Selecione um semestre para começar</p></div>
      ) : (
        <>
          {aba === 'alocacoes'        && <AbaAlocacoes        semestreId={semestreId} />}
          {aba === 'disponibilidades' && <AbaDisponibilidades semestreId={semestreId} />}
          {aba === 'solver'           && <AbaSolver           semestreId={semestreId} />}
        </>
      )}
    </div>
  )
}
