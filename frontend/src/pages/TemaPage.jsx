import { useThemeStore, THEMES } from '../store/themeStore'
import { Check } from 'lucide-react'

function Swatch({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6,
        background: color, border: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{color}</div>
      </div>
    </div>
  )
}

const THEME_SWATCHES = {
  default: [
    { color: '#4f8ef7', label: 'Accent (azul)' },
    { color: '#34c97a', label: 'Verde' },
    { color: '#f5c842', label: 'Amarelo' },
    { color: '#f05252', label: 'Vermelho' },
    { color: '#181c27', label: 'Card background' },
    { color: '#0f1117', label: 'Background' },
  ],
  if: [
    { color: '#4CAF50', label: 'Verde IF (primário)' },
    { color: '#2E7D32', label: 'Verde IF (escuro)' },
    { color: '#66BB6A', label: 'Verde IF (claro/hover)' },
    { color: '#C62828', label: 'Vermelho IF' },
    { color: '#242424', label: 'Card background' },
    { color: '#1E1E1E', label: 'Background' },
  ],
}

export default function TemaPage() {
  const { current, setTheme } = useThemeStore()

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aparência</h1>
          <p className="page-subtitle">Escolha a paleta de cores da aplicação</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {Object.entries(THEMES).map(([key, theme]) => {
          const isActive = current === key
          return (
            <div
              key={key}
              className="card"
              onClick={() => setTheme(key)}
              style={{
                cursor: 'pointer',
                border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-light)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={14} color="#fff" />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{theme.label}</div>
                {key === 'if' && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Paleta oficial dos Institutos Federais do Brasil
                  </div>
                )}
                {key === 'default' && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Tema escuro padrão da aplicação
                  </div>
                )}
              </div>

              {/* Preview mini */}
              <div style={{
                background: theme['--bg'],
                border: `1px solid ${theme['--border']}`,
                borderRadius: 6,
                padding: 10,
                marginBottom: 16,
              }}>
                <div style={{
                  background: theme['--bg-card'],
                  borderRadius: 4,
                  padding: '8px 10px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme['--accent'] }} />
                  <div style={{ height: 6, width: 80, borderRadius: 3, background: theme['--text-muted'], opacity: 0.5 }} />
                  <div style={{ marginLeft: 'auto', height: 20, width: 48, borderRadius: 4, background: theme['--accent'] }} />
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  {[theme['--accent'], theme['--green'], theme['--red'], theme['--yellow']].map((c, i) => (
                    <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: c }} />
                  ))}
                </div>
              </div>

              {/* Swatches */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(THEME_SWATCHES[key] || []).map((s, i) => (
                  <Swatch key={i} color={s.color} label={s.label} />
                ))}
              </div>

              <button
                className="btn btn-primary"
                style={{
                  width: '100%', justifyContent: 'center', marginTop: 16,
                  background: isActive ? 'var(--green)' : 'var(--accent)',
                }}
                onClick={e => { e.stopPropagation(); setTheme(key) }}
              >
                {isActive ? <><Check size={15} /> Tema ativo</> : 'Usar este tema'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
