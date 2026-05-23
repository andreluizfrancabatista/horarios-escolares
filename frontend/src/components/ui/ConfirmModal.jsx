import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: danger ? 'var(--red-dim)' : 'var(--yellow-dim)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <AlertTriangle size={24} color={danger ? 'var(--red)' : 'var(--yellow)'} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
            {title || 'Confirmar ação'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            {message || 'Esta ação não pode ser desfeita.'}
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ minWidth: 100 }}>
            Cancelar
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-warning'}`}
            onClick={onConfirm}
            style={{ minWidth: 100, background: danger ? 'var(--red)' : 'var(--yellow)', color: '#fff' }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
