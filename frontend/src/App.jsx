import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HorariosPage from './pages/HorariosPage'
import CursosPage from './pages/CursosPage'
import DisciplinasPage from './pages/DisciplinasPage'
import ProfessoresPage from './pages/ProfessoresPage'
import SalasPage from './pages/SalasPage'
import SemestresPage from './pages/SemestresPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="horarios" element={<HorariosPage />} />
          <Route path="cursos" element={<CursosPage />} />
          <Route path="disciplinas" element={<DisciplinasPage />} />
          <Route path="professores" element={<ProfessoresPage />} />
          <Route path="salas" element={<SalasPage />} />
          <Route path="semestres" element={<SemestresPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
