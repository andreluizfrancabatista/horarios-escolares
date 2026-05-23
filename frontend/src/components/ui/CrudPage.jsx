import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Upload, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from './ConfirmModal'
import BulkImportModal from './BulkImportModal'
import api from '../../services/api'

export function CrudPage({ title, subtitle, queryKey, apiFns, columns, FormFields, emptyMsg, bulkTipo }) {
  const qc = useQueryClient()
  const [modal, setModal]         = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)   // item único
  const [confirmBulkDel, setConfirmBulkDel] = useState(false)
  const [showBulk, setShowBulk]   = useState(false)
  const [selected, setSelected]   = useState(new Set())

  const { data: items = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => apiFns.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: apiFns.create,
    onSuccess: () => { qc.invalidateQueries([queryKey]); setModal(null); toast.success('Criado!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao criar'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => apiFns.update(id, data),
    onSuccess: () => { qc.invalidateQueries([queryKey]); setModal(null); toast.success('Atualizado!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao atualizar'),
  })

  const deleteMut = useMutation({
    mutationFn: apiFns.delete,
    onSuccess: () => { qc.invalidateQueries([queryKey]); setConfirmDel(null); toast.success('Removido') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao remover'),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: (ids) => api.delete(`/bulk/${bulkTipo}`, { data: { ids } }).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries([queryKey])
      setSelected(new Set())
      setConfirmBulkDel(false)
      toast.success(`${data.deletados} registro(s) removido(s)`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Erro ao remover'),
  })

  const handleSave = (formData) => {
    if (modal?.data?.id) updateMut.mutate({ id: modal.data.id, data: formData })
    else createMut.mutate(formData)
  }

  // Seleção
  const allIds = items.map(i => i.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }
  const toggleOne = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const singular = title.replace(/s$/, '')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {someSelected && bulkTipo && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmBulkDel(true)}
            >
              <Trash2 size={14} /> Remover selecionados ({selected.size})
            </button>
          )}
          {bulkTipo && (
            <button className="btn btn-ghost" onClick={() => setShowBulk(true)}>
              <Upload size={15} /> Importar CSV
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setModal({ data: null })}>
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>{emptyMsg || 'Nenhum registro encontrado.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {bulkTipo && (
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        title="Selecionar todos"
                        style={{ cursor: 'pointer', width: 15, height: 15 }}
                      />
                    </th>
                  )}
                  {columns.map(c => <th key={c.key}>{c.label}</th>)}
                  <th style={{ width: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ background: selected.has(item.id) ? 'var(--accent-dim)' : undefined }}>
                    {bulkTipo && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleOne(item.id)}
                          style={{ cursor: 'pointer', width: 15, height: 15 }}
                        />
                      </td>
                    )}
                    {columns.map(c => (
                      <td key={c.key}>{c.render ? c.render(item) : (item[c.key] ?? '—')}</td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal({ data: item })}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(item)}>
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

      {/* Modal edição/criação */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal.data?.id ? 'Editar' : 'Novo'} {singular}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            <FormFields initial={modal.data} onSave={handleSave} onCancel={() => setModal(null)} />
          </div>
        </div>
      )}

      {/* Confirm delete individual */}
      {confirmDel && (
        <ConfirmModal
          title={`Remover ${singular}`}
          message={`Tem certeza que deseja remover "${confirmDel.nome}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => deleteMut.mutate(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {/* Confirm bulk delete */}
      {confirmBulkDel && (
        <ConfirmModal
          title={`Remover ${selected.size} ${selected.size === 1 ? singular : title.toLowerCase()}`}
          message={`Confirma a remoção de ${selected.size} registro(s) selecionado(s)? Esta ação não pode ser desfeita.`}
          onConfirm={() => bulkDeleteMut.mutate([...selected])}
          onCancel={() => setConfirmBulkDel(false)}
        />
      )}

      {/* Bulk import */}
      {showBulk && bulkTipo && (
        <BulkImportModal
          tipo={bulkTipo}
          onClose={() => setShowBulk(false)}
          onSuccess={() => qc.invalidateQueries([queryKey])}
        />
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
