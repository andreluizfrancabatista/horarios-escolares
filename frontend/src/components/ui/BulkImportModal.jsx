import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const TEMPLATES = {
  turmas: {
    label: 'Turmas',
    endpoint: '/bulk/turmas',
    headers: 'nome,codigo,turno',
    exemplo: 'Ciência da Computação - 1º período,CC1,Manhã\nAnálise de Sistemas - 3º período,AS3,Noite',
  },
  disciplinas: {
    label: 'Disciplinas',
    endpoint: '/bulk/disciplinas',
    headers: 'nome',
    exemplo: 'Cálculo I\nAlgoritmos\nEstrutura de Dados\nDireito Civil',
  },
  professores: {
    label: 'Professores',
    endpoint: '/bulk/professores',
    headers: 'nome',
    exemplo: 'João Silva\nMaria Santos\nCarlos Oliveira',
  },
  salas: {
    label: 'Salas',
    endpoint: '/bulk/salas',
    headers: 'nome,tipo,bloco',
    exemplo: 'Sala 101,Sala comum,Bloco A\nLab Informática,Laboratório,Bloco B',
  },
}

function downloadTemplate(tipo) {
  const t = TEMPLATES[tipo]
  const blob = new Blob([`${t.headers}\n${t.exemplo}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `template_${tipo}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function BulkImportModal({ tipo, onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()
  const t = TEMPLATES[tipo]

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) { toast.error('Selecione um arquivo .csv'); return }
    setFile(f); setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post(t.endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      if (data.criados > 0) { onSuccess?.(); toast.success(`${data.criados} registro(s) importado(s)!`) }
    } catch (e) {
      const msg = e.response?.data?.detail || 'Erro ao importar arquivo'
      toast.error(msg)
      setResult({ criados: 0, erros: [{ linha: '—', erro: msg }] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Importar {t.label} via CSV</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Template */}
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>Colunas esperadas</div>
            <code style={{ fontSize:12, color:'var(--accent)', fontFamily:'monospace' }}>{t.headers}</code>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadTemplate(tipo)}>
            <Download size={14} /> Baixar template
          </button>
        </div>

        {!result && (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            style={{ marginBottom:20 }}
          >
            <input ref={inputRef} type="file" accept=".csv"
              onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
                <FileText size={20} color="var(--accent)" />
                <span style={{ fontWeight:500 }}>{file.name}</span>
                <span style={{ color:'var(--text-muted)', fontSize:12 }}>({(file.size/1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div>
                <Upload size={32} style={{ color:'var(--text-dim)', marginBottom:8 }} />
                <p style={{ color:'var(--text-muted)', fontSize:14 }}>
                  Arraste um <strong>.csv</strong> ou clique para selecionar
                </p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', gap:12, marginBottom:16 }}>
              <div style={{ flex:1, padding:'14px 16px', borderRadius:'var(--radius-sm)', background:'var(--green-dim)', border:'1px solid var(--green)', display:'flex', alignItems:'center', gap:10 }}>
                <CheckCircle size={20} color="var(--green)" />
                <div>
                  <div style={{ fontWeight:700, fontSize:20, color:'var(--green)' }}>{result.criados}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>importados</div>
                </div>
              </div>
              {result.erros?.length > 0 && (
                <div style={{ flex:1, padding:'14px 16px', borderRadius:'var(--radius-sm)', background:'var(--red-dim)', border:'1px solid var(--red)', display:'flex', alignItems:'center', gap:10 }}>
                  <AlertCircle size={20} color="var(--red)" />
                  <div>
                    <div style={{ fontWeight:700, fontSize:20, color:'var(--red)' }}>{result.erros.length}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>erros</div>
                  </div>
                </div>
              )}
            </div>
            {result.erros?.length > 0 && (
              <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:12, maxHeight:180, overflowY:'auto' }}>
                {result.erros.map((e, i) => (
                  <div key={i} style={{ fontSize:12, color:'var(--red)', marginBottom:4 }}>
                    <strong>Linha {e.linha}:</strong> {e.erro}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>{result ? 'Fechar' : 'Cancelar'}</button>
          {!result && (
            <button className="btn btn-primary" onClick={handleUpload} disabled={!file || loading}>
              {loading ? <span className="spinner" style={{ width:16, height:16 }} /> : <><Upload size={15}/> Importar</>}
            </button>
          )}
          {result && (
            <button className="btn btn-ghost" onClick={() => { setFile(null); setResult(null) }}>
              Importar outro
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
