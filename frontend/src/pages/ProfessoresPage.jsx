import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { professoresApi } from '../services/api'

export default function ProfessoresPage() {
  return (
    <CrudPage
      title="Professores"
      subtitle="Corpo docente da instituição"
      queryKey="professores"
      apiFns={professoresApi}
      bulkTipo="professores"
      columns={[
        { key: 'nome', label: 'Nome' },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '' })
        return (
          <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input className="form-input" value={form.nome}
                onChange={e => set('nome', e.target.value)} required />
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
