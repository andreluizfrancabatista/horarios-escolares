import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { professoresApi } from '../services/api'

const TITULACOES = ['Especialista', 'Mestre', 'Doutor', 'Pós-Doutor']

export default function ProfessoresPage() {
  return (
    <CrudPage
      title="Professores"
      subtitle="Corpo docente da instituição"
      queryKey="professores"
      apiFns={professoresApi}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'titulacao', label: 'Titulação', render: p => p.titulacao ? <span className="badge badge-blue">{p.titulacao}</span> : '—' },
        { key: 'departamento', label: 'Departamento' },
        { key: 'email', label: 'E-mail' },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '', email: '', titulacao: '', departamento: '', observacoes: '' })
        return (
          <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} required />
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input type="email" className="form-input" value={form.email || ''} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Titulação</label>
                  <select className="form-select" value={form.titulacao || ''} onChange={e => set('titulacao', e.target.value)}>
                    <option value="">Não informado</option>
                    {TITULACOES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <input className="form-input" value={form.departamento || ''} onChange={e => set('departamento', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" rows={3} value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
              </div>
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
