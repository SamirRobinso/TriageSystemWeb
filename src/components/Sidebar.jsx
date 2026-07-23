import { UserPlus, LayoutDashboard, Users, BarChart3, FileText } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'register', label: 'Registro de Paciente', icon: <UserPlus className="nav-icon" /> },
    { id: 'rooms', label: 'Estado de Salas', icon: <LayoutDashboard className="nav-icon" /> },
    { id: 'patients', label: 'Pacientes', icon: <Users className="nav-icon" /> },
    { id: 'stats', label: 'Estadísticas', icon: <BarChart3 className="nav-icon" /> },
    { id: 'report', label: 'Reporte Diario', icon: <FileText className="nav-icon" /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img src={logo} alt="IEES Priority" style={{ width: '120px', height: 'auto', borderRadius: '50%', background: '#ffffff', padding: '6px' }} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.5rem' }}>IEES Priority</h2>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priorizamos tu salud</p>
      </div>
      <nav className="nav-menu">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
