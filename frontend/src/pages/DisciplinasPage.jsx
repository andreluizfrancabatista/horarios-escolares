import { useQuery } from '@tanstack/react-query'
import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { disciplinasApi, cursosApi } from '../services/api'

export default function DisciplinasPage() {
  const { data: cursos = [] } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => cursosApi.list().then(r => r.data),
  })

  return (
    <CrudPage
      title="Disciplinas"
      subtitle="Disciplinas ofertadas por curso"
      queryKey="disciplinas"
      apiFns={disciplinasApi}
      columns={[
        { key: 'codigo', label: 'Código' },
        { key: 'nome', label: 'Nome' },
        { key: 'curso', label: 'Curso', render: d => d.curso?.nome || '—' },
        { key: 'periodo', label: 'Período', render: d => d.periodo ? `${d.periodo}º` : '—' },
        { key: 'carga_horaria', label: 'C.H.', render: d => `${d.carga_horaria}h` },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '', codigo: '', carga_horaria: 60, periodo: '', curso_id: '' })
        const submit = e => {
          e.preventDefault()
          onSave({ ...form, curso_id: Number(form.curso_id), periodo: form.periodo ? Number(form.periodo) : null, carga_horaria: Number(form.carga_horaria) })
        }
        return (
          <form onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Código</label>
                  <input className="form-input" value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="MAT101" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Carga Horária (h)</label>
                  <input type="number" className="form-input" value={form.carga_horaria} onChange={e => set('carga_horaria', e.target.value)} required min={1} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nome da Disciplina</label>
                <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Cálculo I" required />
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Curso</label>
                  <select className="form-select" value={form.curso_id} onChange={e => set('curso_id', e.target.value)} required>
                    <option value="">Selecione…</option>
                    {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Período</label>
                  <input type="number" className="form-input" value={form.periodo || ''} onChange={e => set('periodo', e.target.value)} placeholder="1" min={1} max={10} />
                </div>
              </div>
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
