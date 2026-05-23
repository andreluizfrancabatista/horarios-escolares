import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Cpu, Plus, Trash2, X, Play, CheckCheck, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { semestresApi, turmasApi, disciplinasApi, professoresApi, alocacoesApi, disponibilidadesApi, solverApi } from '../services/api'
import ConfirmModal from '../components/ui/ConfirmModal'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
const SLOTS = [
  '07:00','07:50','08:40','09:30','10:20','11:10',
  '13:00','13:50','14:40','15:30','16:20','17:10',
  '18:10','19:00','19:50','20:40','21:30',
]
const TURNO_LABEL = { '07:00':'Manhã','13:00':'Tarde','18:10':'Noite' }
const TIPO_COR = { indisponivel: 'var(--red)', prefere_nao: 'var(--yellow)' }
const TIPO_BG  = { indisponivel: 'var(--red-dim)', prefere_nao: 'var(--yellow-dim)' }

// ─── Aba 1: Alocações professor→disciplina→turma ──────────────────────────────
function AbaAlocacoes({ semestreId }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ professor_id:'', disciplina_id:'', turma_id:'' })
  const [confirmDel, setConfirmDel] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

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
    createMut.mutate({ semestre_id: semestreId, ...form,
      professor_id: Number(form.professor_id), disciplina_id: Number(form.disciplina_id), turma_id: Number(form.turma_id) })
  }

  return (
    <div>
      <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:20 }}>
        Defina quem ministra qual disciplina para cada turma neste semestre. O solver usará essas alocações para montar a grade.
      </p>

      {/* Formulário de adição */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Nova alocação</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end' }}>
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
          <button className="btn btn-primary" onClick={handleAdd} disabled={createMut.isPending}>
            <Plus size={15}/> Adicionar
          </button>
        </div>
      </div>

      {/* Lista */}
      {alocacoes.length === 0 ? (
        <div className="empty card"><div className="empty-icon">📋</div><p>Nenhuma alocação cadastrada</p></div>
      ) : (
        <div className="card" style={{ padding:0 }}>
          <table><thead><tr>
            <th>Professor</th><th>Disciplina</th><th>Turma</th><th style={{ width:60 }}>Ações</th>
          </tr></thead>
          <tbody>
            {alocacoes.map(a => (
              <tr key={a.id}>
                <td>{a.professor?.nome}</td>
                <td>{a.disciplina?.nome}</td>
                <td>{a.turma?.nome}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(a)}>
                    <Trash2 size={13}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {confirmDel && (
        <ConfirmModal
          title="Remover alocação"
          message={`Remover ${confirmDel.professor?.nome} → ${confirmDel.disciplina?.nome} → ${confirmDel.turma?.nome}?`}
          onConfirm={() => deleteMut.mutate(confirmDel.id)}
          onCancel={() => setConfirmDel(null)} />
      )}
    </div>
  )
}

// ─── Aba 2: Disponibilidade por professor ─────────────────────────────────────
function AbaDisponibilidades({ semestreId }) {
  const qc = useQueryClient()
  const [profId, setProfId] = useState(null)
  const [grade, setGrade] = useState({})   // { "Seg|07:00": 'indisponivel' | 'prefere_nao' }
  const [saving, setSaving] = useState(false)

  const { data: professores = [] } = useQuery({ queryKey:['professores'], queryFn: () => professoresApi.list().then(r=>r.data) })

  const { data: dispData = [] } = useQuery({
    queryKey: ['disp', semestreId, profId],
    queryFn: () => disponibilidadesApi.list(semestreId, profId).then(r=>r.data),
    enabled: !!semestreId && !!profId,
  })

  // Carregar grade do professor selecionado
  useEffect(() => {
    const g = {}
    dispData.forEach(d => { g[`${d.dia_semana}|${d.horario_inicio}`] = d.tipo })
    setGrade(g)
  }, [dispData])

  const toggleSlot = (dia, hora) => {
    const key = `${dia}|${hora}`
    setGrade(g => {
      const atual = g[key]
      if (!atual)              return { ...g, [key]: 'indisponivel' }
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

  return (
    <div>
      <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:20 }}>
        Selecione um professor e clique nos slots para marcar restrições.
        Clique uma vez = <span style={{ color:'var(--red)' }}>Indisponível</span> (rígido).
        Clique duas vezes = <span style={{ color:'var(--yellow)' }}>Prefere não</span> (suave).
        Clique três vezes = limpa.
      </p>

      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <select className="form-select" style={{ width:'auto', minWidth:260 }}
          value={profId||''} onChange={e => setProfId(Number(e.target.value) || null)}>
          <option value="">Selecione um professor…</option>
          {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        {profId && (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:16, height:16 }}/> : <><CheckCheck size={15}/> Salvar</>}
          </button>
        )}
        {profId && Object.keys(grade).length > 0 && (
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>
            {Object.values(grade).filter(v=>v==='indisponivel').length} indisponível ·{' '}
            {Object.values(grade).filter(v=>v==='prefere_nao').length} prefere não
          </span>
        )}
      </div>

      {!profId ? (
        <div className="card empty"><div className="empty-icon">👤</div><p>Selecione um professor</p></div>
      ) : (
        <div className="card" style={{ padding:0, overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:`80px repeat(${DIAS.length}, 1fr)`, minWidth:500 }}>
            {/* Header */}
            <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:'8px', fontSize:11, color:'var(--text-dim)' }} />
            {DIAS.map(d => (
              <div key={d} style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', borderLeft:'1px solid var(--border)', padding:'8px', fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-dim)', textAlign:'center' }}>{d}</div>
            ))}

            {/* Slots */}
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
                      {tipo === 'indisponivel' && <span style={{ fontSize:18 }}>✕</span>}
                      {tipo === 'prefere_nao'  && <span style={{ fontSize:15, color:'var(--yellow)' }}>~</span>}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Aba 3: Solver ────────────────────────────────────────────────────────────
function AbaSolver({ semestreId }) {
  const qc = useQueryClient()
  const [resultado, setResultado] = useState(null)
  const [rodando, setRodando] = useState(false)
  const [aceitando, setAceitando] = useState(false)
  const [confirmAceitar, setConfirmAceitar] = useState(false)

  const handleRodar = async () => {
    setRodando(true); setResultado(null)
    try {
      const { data } = await solverApi.rodar(semestreId)
      setResultado(data)
      if (data.status === 'ok')      toast.success('Solução ótima encontrada!')
      else if (data.status === 'parcial') toast.success('Solução parcial encontrada — verifique os avisos')
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

  // Agrupar slots por turma para exibição
  const porTurma = {}
  if (resultado?.slots) {
    resultado.slots.forEach(s => {
      if (!porTurma[s.turma_nome]) porTurma[s.turma_nome] = []
      porTurma[s.turma_nome].push(s)
    })
  }

  return (
    <div>
      <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:20 }}>
        Certifique-se de que as alocações e disponibilidades estão configuradas antes de rodar o solver.
        O processo pode levar até 60 segundos.
      </p>

      {/* Botão rodar */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn btn-primary"
          onClick={handleRodar} disabled={rodando || !semestreId}
          style={{ padding:'10px 24px', fontSize:15 }}>
          {rodando
            ? <><span className="spinner" style={{ width:16, height:16 }}/> Rodando solver…</>
            : <><Play size={16}/> Gerar grade automaticamente</>}
        </button>
        {rodando && <span style={{ color:'var(--text-muted)', fontSize:13 }}>
          <Clock size={13} style={{ verticalAlign:'middle', marginRight:4 }}/>
          Pode levar até 60 segundos…
        </span>}
      </div>

      {/* Resultado */}
      {resultado && (
        <>
          {/* Status */}
          <div className="card" style={{ marginBottom:16, borderColor: STATUS_INFO[resultado.status]?.cor }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:28 }}>{STATUS_INFO[resultado.status]?.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:16, color: STATUS_INFO[resultado.status]?.cor }}>
                  {STATUS_INFO[resultado.status]?.label}
                </div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
                  {resultado.stats?.aulas_alocadas ?? 0} de {resultado.stats?.aulas_esperadas ?? '?'} aulas alocadas
                  {resultado.stats?.tempo_segundos != null && ` · ${resultado.stats.tempo_segundos}s`}
                  {resultado.stats?.penalidade_total != null && ` · penalidade: ${resultado.stats.penalidade_total}`}
                </div>
              </div>
              {resultado.slots?.length > 0 && (
                <button className="btn btn-primary" onClick={() => setConfirmAceitar(true)}>
                  <CheckCheck size={15}/> Aceitar e importar para grade
                </button>
              )}
            </div>
          </div>

          {/* Conflitos / avisos */}
          {resultado.conflitos?.length > 0 && (
            <div className="card" style={{ marginBottom:16, borderColor:'var(--yellow)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <AlertTriangle size={16} color="var(--yellow)"/>
                <span style={{ fontWeight:600, fontSize:14 }}>
                  {resultado.status === 'inviavel' ? 'Conflitos que impedem a solução' : 'Avisos (restrições suaves violadas)'}
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
                  <table>
                    <thead><tr>
                      <th>Dia</th><th>Horário</th><th>Disciplina</th><th>Professor</th><th>Sala</th>
                    </tr></thead>
                    <tbody>
                      {slots.sort((a,b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana) || a.horario_inicio.localeCompare(b.horario_inicio))
                        .map((s, i) => (
                        <tr key={i}>
                          <td>{s.dia_semana}</td>
                          <td>{s.horario_inicio}–{s.horario_fim}</td>
                          <td>{s.disciplina_nome}</td>
                          <td>{s.professor_nome}</td>
                          <td style={{ color:'var(--text-muted)' }}>{s.sala_id ? `Sala #${s.sala_id}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {confirmAceitar && (
        <ConfirmModal
          title="Aceitar e importar grade"
          message={`Isso irá substituir todos os horários atuais do semestre pelos ${resultado?.slots?.length} slots gerados. Deseja continuar?`}
          danger={false}
          onConfirm={handleAceitar}
          onCancel={() => setConfirmAceitar(false)} />
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AutoPage() {
  const [aba, setAba] = useState('alocacoes')
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
    { id:'alocacoes',       label:'1. Alocações' },
    { id:'disponibilidades',label:'2. Disponibilidades' },
    { id:'solver',          label:'3. Rodar Solver' },
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
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{
              padding:'10px 20px', border:'none', cursor:'pointer', fontSize:14, fontWeight: aba===a.id ? 600 : 400,
              background:'transparent', borderBottom: aba===a.id ? '2px solid var(--accent)' : '2px solid transparent',
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
