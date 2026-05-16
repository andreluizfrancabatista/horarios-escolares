import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export function CrudPage({ title, subtitle, queryKey, apiFns, columns, FormFields, emptyMsg }) {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => apiFns.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: apiFns.create,
    onSuccess: () => { qc.invalidateQueries([queryKey]); setModal(null); toast.success('Criado com sucesso!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao criar'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => apiFns.update(id, data),
    onSuccess: () => { qc.invalidateQueries([queryKey]); setModal(null); toast.success('Atualizado!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao atualizar'),
  })

  const deleteMut = useMutation({
    mutationFn: apiFns.delete,
    onSuccess: () => { qc.invalidateQueries([queryKey]); toast.success('Removido') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao remover'),
  })

  const handleSave = (formData) => {
    if (modal?.data?.id) {
      updateMut.mutate({ id: modal.data.id, data: formData })
    } else {
      createMut.mutate(formData)
    }
  }

  const singular = title.replace(/s$/, '')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ data: null })}>
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>{emptyMsg || 'Nenhum registro encontrado. Clique em "Novo" para começar.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map(c => <th key={c.key}>{c.label}</th>)}
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    {columns.map(c => (
                      <td key={c.key}>{c.render ? c.render(item) : item[c.key] ?? '—'}</td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal({ data: item })}>
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { if (confirm(`Remover ${singular}?`)) deleteMut.mutate(item.id) }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal.data?.id ? 'Editar' : 'Novo'} {singular}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>
                <X size={16} />
              </button>
            </div>
            <FormFields initial={modal.data} onSave={handleSave} onCancel={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

export function useForm(initial, defaults) {
  const [form, setForm] = useState({ ...defaults, ...(initial || {}) })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return [form, set]
}

export function FormFooter({ onCancel, loading }) {
  return (
    <div className="modal-footer">
      <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Salvar'}
      </button>
    </div>
  )
}
