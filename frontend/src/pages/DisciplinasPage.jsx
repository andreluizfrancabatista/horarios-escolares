import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { disciplinasApi } from '../services/api'

export default function DisciplinasPage() {
  return (
    <CrudPage
      title="Disciplinas"
      subtitle="Disciplinas disponíveis para todas as turmas"
      queryKey="disciplinas"
      apiFns={disciplinasApi}
      bulkTipo="disciplinas"
      columns={[
        { key: 'nome', label: 'Nome' },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '' })
        return (
          <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <div className="form-group">
              <label className="form-label">Nome da Disciplina</label>
              <input className="form-input" value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Cálculo I" required />
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
