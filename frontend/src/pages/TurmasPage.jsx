import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { turmasApi } from '../services/api'

const TURNOS = ['Manhã', 'Tarde', 'Noite', 'Integral']
const BADGE = { 'Manhã': 'badge-yellow', 'Tarde': 'badge-orange', 'Noite': 'badge-blue', 'Integral': 'badge-green' }

export default function TurmasPage() {
  return (
    <CrudPage
      title="Turmas"
      subtitle="Ex: Ciência da Computação - 1º período"
      queryKey="turmas"
      apiFns={turmasApi}
      bulkTipo="turmas"
      columns={[
        { key: 'codigo', label: 'Código' },
        { key: 'nome',   label: 'Nome' },
        { key: 'turno',  label: 'Turno',
          render: t => <span className={`badge ${BADGE[t.turno] || 'badge-gray'}`}>{t.turno}</span> },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '', codigo: '', turno: 'Manhã' })
        return (
          <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Código</label>
                  <input className="form-input" value={form.codigo}
                    onChange={e => set('codigo', e.target.value)}
                    placeholder="CC1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Turno</label>
                  <select className="form-select" value={form.turno}
                    onChange={e => set('turno', e.target.value)}>
                    {TURNOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nome da Turma</label>
                <input className="form-input" value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="Ciência da Computação - 1º período" required />
              </div>
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
