import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { CalendarDays, BookOpen, Users, DoorOpen, LayoutDashboard, LogOut, School, Palette, GraduationCap, Cpu } from 'lucide-react'

const navItems = [
  { to:'/dashboard',   icon:LayoutDashboard, label:'Dashboard' },
  { to:'/horarios',    icon:CalendarDays,    label:'Horários' },
  { to:'/auto',        icon:Cpu,             label:'Alocação Auto.', badge:'Em breve' },
  { to:'/semestres',   icon:School,          label:'Semestres' },
  { to:'/turmas',      icon:GraduationCap,   label:'Turmas' },
  { to:'/disciplinas', icon:BookOpen,        label:'Disciplinas' },
  { to:'/professores', icon:Users,           label:'Professores' },
  { to:'/salas',       icon:DoorOpen,        label:'Salas' },
  { to:'/aparencia',   icon:Palette,         label:'Aparência' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <aside style={{ width:224, flexShrink:0, background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>

        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CalendarDays size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, lineHeight:1.2, color:'var(--text)' }}>Horários</div>
              <div style={{ fontSize:11, color:'var(--text-dim)' }}>Gestão Acadêmica</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {navItems.map(({ to, icon:Icon, label, badge }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:'var(--radius-sm)',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize:14, marginBottom:2, transition:'all 0.12s', textDecoration:'none',
            })}>
              <Icon size={16} />
              <span style={{ flex:1 }}>{label}</span>
              {badge && (
                <span style={{ fontSize:9, fontWeight:700, background:'var(--yellow-dim)', color:'var(--yellow)', padding:'1px 5px', borderRadius:4, letterSpacing:'0.04em' }}>
                  BETA
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:8, fontWeight:500 }}>
            {user?.nome || 'Administrador'}
          </div>
          <button className="btn btn-ghost btn-sm"
            onClick={() => { logout(); navigate('/login') }}
            style={{ width:'100%', justifyContent:'center' }}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
