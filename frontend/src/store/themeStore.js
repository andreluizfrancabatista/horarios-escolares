import { create } from 'zustand'

export const THEMES = {
  default: {
    label: 'Default',
    '--bg':           '#0f1117',
    '--bg-card':      '#181c27',
    '--bg-hover':     '#1e2333',
    '--border':       '#252a3a',
    '--border-light': '#2e3448',
    '--text':         '#e8eaf2',
    '--text-muted':   '#7a82a0',
    '--text-dim':     '#4a5068',
    '--accent':       '#4f8ef7',
    '--accent-dim':   '#1e3a6e',
    '--accent-hover': '#6aa3ff',
    '--green':        '#34c97a',
    '--green-dim':    '#1a4a33',
    '--yellow':       '#f5c842',
    '--yellow-dim':   '#4a3c10',
    '--red':          '#f05252',
    '--red-dim':      '#4a1a1a',
    '--orange':       '#f07a28',
    '--orange-dim':   '#4a2a10',
  },
  if: {
    label: 'Instituto Federal',
    '--bg':           '#F8F9FA',
    '--bg-card':      '#FFFFFF',
    '--bg-hover':     '#F5F5F5',
    '--border':       '#E0E0E0',
    '--border-light': '#BDBDBD',
    '--text':         '#212121',
    '--text-muted':   '#424242',
    '--text-dim':     '#757575',
    '--accent':       '#2E7D32',
    '--accent-dim':   '#C8E6C9',
    '--accent-hover': '#1B5E20',
    '--green':        '#2E7D32',
    '--green-dim':    '#C8E6C9',
    '--yellow':       '#F57F17',
    '--yellow-dim':   '#FFF9C4',
    '--red':          '#C62828',
    '--red-dim':      '#FFCDD2',
    '--orange':       '#E65100',
    '--orange-dim':   '#FFE0B2',
  },
}

function applyTheme(vars) {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

const saved = localStorage.getItem('theme') || 'default'

export const useThemeStore = create((set) => ({
  current: saved,
  setTheme: (name) => {
    const theme = THEMES[name]
    if (!theme) return
    applyTheme(theme)
    localStorage.setItem('theme', name)
    set({ current: name })
  },
}))

applyTheme(THEMES[saved])
