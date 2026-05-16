import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { semestresApi } from '../services/api'

export default function SemestresPage() {
  return (
    <CrudPage
      title="Semestres"
      subtitle="Gerencie os períodos letivos da instituição"
      queryKey="semestres"
      apiFns={semestresApi}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'data_inicio', label: 'Início', render: s => s.data_inicio || '—' },
        { key: 'data_fim', label: 'Fim', render: s => s.data_fim || '—' },
        {
          key: 'ativo', label: 'Status',
          render: s => s.ativo
            ? <span className="badge badge-green">Ativo</span>
            : <span className="badge badge-gray">Inativo</span>
        },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '', data_inicio: '', data_fim: '', ativo: false })
        return (
          <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome do Semestre</label>
                <input
                  className="form-input"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="2025/1"
                  required
                />
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Data de Início</label>
                  <input type="date" className="form-input" value={form.data_inicio || ''} onChange={e => set('data_inicio', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Fim</label>
                  <input type="date" className="form-input" value={form.data_fim || ''} onChange={e => set('data_fim', e.target.value)} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} />
                Marcar como semestre ativo
              </label>
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
