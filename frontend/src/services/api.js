import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form)
  },
}

// ── Semestres ─────────────────────────────────────
export const semestresApi = {
  list: () => api.get('/semestres/'),
  get: (id) => api.get(`/semestres/${id}`),
  create: (d) => api.post('/semestres/', d),
  update: (id, d) => api.put(`/semestres/${id}`, d),
  delete: (id) => api.delete(`/semestres/${id}`),
  ativar: (id) => api.post(`/semestres/${id}/ativar`),
}

// ── Cursos ────────────────────────────────────────
export const cursosApi = {
  list: () => api.get('/cursos/'),
  get: (id) => api.get(`/cursos/${id}`),
  create: (d) => api.post('/cursos/', d),
  update: (id, d) => api.put(`/cursos/${id}`, d),
  delete: (id) => api.delete(`/cursos/${id}`),
}

// ── Disciplinas ───────────────────────────────────
export const disciplinasApi = {
  list: (curso_id) => api.get('/disciplinas/', { params: curso_id ? { curso_id } : {} }),
  get: (id) => api.get(`/disciplinas/${id}`),
  create: (d) => api.post('/disciplinas/', d),
  update: (id, d) => api.put(`/disciplinas/${id}`, d),
  delete: (id) => api.delete(`/disciplinas/${id}`),
}

// ── Professores ───────────────────────────────────
export const professoresApi = {
  list: () => api.get('/professores/'),
  get: (id) => api.get(`/professores/${id}`),
  create: (d) => api.post('/professores/', d),
  update: (id, d) => api.put(`/professores/${id}`, d),
  delete: (id) => api.delete(`/professores/${id}`),
}

// ── Salas ─────────────────────────────────────────
export const salasApi = {
  list: () => api.get('/salas/'),
  get: (id) => api.get(`/salas/${id}`),
  create: (d) => api.post('/salas/', d),
  update: (id, d) => api.put(`/salas/${id}`, d),
  delete: (id) => api.delete(`/salas/${id}`),
}

// ── Horários ──────────────────────────────────────
export const horariosApi = {
  list: (params) => api.get('/horarios/', { params }),
  create: (d) => api.post('/horarios/', d),
  update: (id, d) => api.put(`/horarios/${id}`, d),
  delete: (id) => api.delete(`/horarios/${id}`),
}
