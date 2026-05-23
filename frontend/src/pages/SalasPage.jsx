import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { salasApi } from '../services/api'

const TIPOS = ['Sala comum', 'Laboratório', 'Auditório', 'Sala de reunião', 'Outro']

export default function SalasPage() {
  return (
    <CrudPage
      title="Salas"
      subtitle="Ambientes físicos disponíveis para alocação"
      queryKey="salas"
      apiFns={salasApi}
      bulkTipo="salas"
      columns={[
        { key: 'nome',  label: 'Nome' },
        { key: 'bloco', label: 'Bloco' },
        { key: 'tipo',  label: 'Tipo' },
        { key: 'ativa', label: 'Status',
          render: s => s.ativa
            ? <span className="badge badge-green">Ativa</span>
            : <span className="badge badge-gray">Inativa</span> },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(initial, { nome: '', tipo: 'Sala comum', bloco: '', ativa: true })
        return (
          <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nome / Número</label>
                  <input className="form-input" value={form.nome}
                    onChange={e => set('nome', e.target.value)}
                    placeholder="Sala 101" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bloco</label>
                  <input className="form-input" value={form.bloco || ''}
                    onChange={e => set('bloco', e.target.value)}
                    placeholder="Bloco A" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.tipo || ''}
                  onChange={e => set('tipo', e.target.value)}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.ativa}
                  onChange={e => set('ativa', e.target.checked)} />
                Sala ativa
              </label>
            </div>
            <FormFooter onCancel={onCancel} />
          </form>
        )
      }}
    />
  )
}
