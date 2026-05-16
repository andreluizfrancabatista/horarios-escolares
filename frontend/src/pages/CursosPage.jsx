import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { cursosApi } from '../services/api'

const TURNOS = ['Manhã', 'Tarde', 'Noite', 'Integral']
const BADGE = { 'Manhã': 'badge-yellow', 'Tarde': 'badge-red', 'Noite': 'badge-blue', 'Integral': 'badge-green' }

export default function CursosPage() {
  return (
    <CrudPage
      title="Cursos"
      subtitle="Cursos de graduação da instituição"
      queryKey="cursos"
      apiFns={cursosApi}
      columns={[
        { key: 'codigo', label: 'Código' },
        { key: 'nome', label: 'Nome' },
        { key: 'turno', label: 'Turno', render: c => <span className={`badge ${BADGE[c.turno] || 'badge-gray'}`}>{c.turno}</span> },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '', codigo: '', turno: 'Manhã' })
        return (
          <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Código</label>
                  <input className="form-input" value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="ENG001" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Turno</label>
                  <select className="form-select" value={form.turno} onChange={e => set('turno', e.target.value)}>
                    {TURNOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nome do Curso</label>
                <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Engenharia de Computação" required />
              </div>
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
