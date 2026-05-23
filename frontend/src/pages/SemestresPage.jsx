import { CrudPage, useForm, FormFooter } from '../components/ui/CrudPage'
import { semestresApi } from '../services/api'

// Converte yyyy-mm-dd (banco) → dd/mm/yyyy (exibição)
function toBR(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Converte dd/mm/yyyy (input) → yyyy-mm-dd (banco)
function toISO(br) {
  if (!br) return ''
  const [d, m, y] = br.split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

function DateInput({ label, value, onChange }) {
  // value armazenado internamente como dd/mm/yyyy
  const handleChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8)
    if (v.length > 4) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4)
    else if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2)
    onChange(v)
  }
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        value={value}
        onChange={handleChange}
        placeholder="dd/mm/aaaa"
        maxLength={10}
      />
    </div>
  )
}

export default function SemestresPage() {
  return (
    <CrudPage
      title="Semestres"
      subtitle="Gerencie os períodos letivos da instituição"
      queryKey="semestres"
      apiFns={semestresApi}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'data_inicio', label: 'Início',  render: s => toBR(s.data_inicio) },
        { key: 'data_fim',    label: 'Fim',     render: s => toBR(s.data_fim) },
        { key: 'ativo', label: 'Status',
          render: s => s.ativo
            ? <span className="badge badge-green">Ativo</span>
            : <span className="badge badge-gray">Inativo</span>
        },
      ]}
      FormFields={({ initial, onSave, onCancel }) => {
        const [form, set] = useForm(null, {
          nome: initial?.nome || '',
          data_inicio_br: toBR(initial?.data_inicio) === '—' ? '' : toBR(initial?.data_inicio),
          data_fim_br:    toBR(initial?.data_fim)    === '—' ? '' : toBR(initial?.data_fim),
          ativo: initial?.ativo || false,
        })

        const handleSubmit = (e) => {
          e.preventDefault()
          onSave({
            nome: form.nome,
            data_inicio: toISO(form.data_inicio_br) || null,
            data_fim:    toISO(form.data_fim_br)    || null,
            ativo: form.ativo,
          })
        }

        return (
          <form onSubmit={handleSubmit}>
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
                <DateInput
                  label="Data de Início"
                  value={form.data_inicio_br}
                  onChange={v => set('data_inicio_br', v)}
                />
                <DateInput
                  label="Data de Fim"
                  value={form.data_fim_br}
                  onChange={v => set('data_fim_br', v)}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={e => set('ativo', e.target.checked)}
                />
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
