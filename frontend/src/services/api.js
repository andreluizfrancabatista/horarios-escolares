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

export const authApi = {
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form)
  },
}

export const semestresApi = {
  list: () => api.get('/semestres/'),
  get: (id) => api.get(`/semestres/${id}`),
  create: (d) => api.post('/semestres/', d),
  update: (id, d) => api.put(`/semestres/${id}`, d),
  delete: (id) => api.delete(`/semestres/${id}`),
  ativar: (id) => api.post(`/semestres/${id}/ativar`),
}

export const turmasApi = {
  list: () => api.get('/turmas/'),
  get: (id) => api.get(`/turmas/${id}`),
  create: (d) => api.post('/turmas/', d),
  update: (id, d) => api.put(`/turmas/${id}`, d),
  delete: (id) => api.delete(`/turmas/${id}`),
}

export const disciplinasApi = {
  list: (turma_id) => api.get('/disciplinas/', { params: turma_id ? { turma_id } : {} }),
  get: (id) => api.get(`/disciplinas/${id}`),
  create: (d) => api.post('/disciplinas/', d),
  update: (id, d) => api.put(`/disciplinas/${id}`, d),
  delete: (id) => api.delete(`/disciplinas/${id}`),
}

export const professoresApi = {
  list: () => api.get('/professores/'),
  get: (id) => api.get(`/professores/${id}`),
  create: (d) => api.post('/professores/', d),
  update: (id, d) => api.put(`/professores/${id}`, d),
  delete: (id) => api.delete(`/professores/${id}`),
}

export const salasApi = {
  list: () => api.get('/salas/'),
  get: (id) => api.get(`/salas/${id}`),
  create: (d) => api.post('/salas/', d),
  update: (id, d) => api.put(`/salas/${id}`, d),
  delete: (id) => api.delete(`/salas/${id}`),
}

export const horariosApi = {
  list: (params) => api.get('/horarios/', { params }),
  create: (d) => api.post('/horarios/', d),
  update: (id, d) => api.put(`/horarios/${id}`, d),
  delete: (id) => api.delete(`/horarios/${id}`),
}

export const alocacoesApi = {
  list: (semestre_id) => api.get('/alocacoes/', { params: semestre_id ? { semestre_id } : {} }),
  create: (d) => api.post('/alocacoes/', d),
  delete: (id) => api.delete(`/alocacoes/${id}`),
}

export const disponibilidadesApi = {
  list: (semestre_id, professor_id) => api.get('/disponibilidades/', { params: { semestre_id, professor_id } }),
  salvar: (d) => api.post('/disponibilidades/', d),
  deletarSlot: (params) => api.delete('/disponibilidades/', { params }),
  salvarGrade: (professor_id, semestre_id, slots) =>
    api.put(`/disponibilidades/professor/${professor_id}/semestre/${semestre_id}`, slots),
}

export const solverApi = {
  rodar: (semestre_id) => api.post('/solver/rodar', { semestre_id }),
  aceitar: (slots, semestre_id) => api.post(`/solver/aceitar?semestre_id=${semestre_id}`, slots),
}
