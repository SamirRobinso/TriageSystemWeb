import { UserPlus, LayoutDashboard, Users, BarChart3 } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'register', label: 'Registro de Paciente', icon: <UserPlus className="nav-icon" /> },
    { id: 'rooms', label: 'Estado de Salas', icon: <LayoutDashboard className="nav-icon" /> },
    { id: 'patients', label: 'Pacientes', icon: <Users className="nav-icon" /> },
    { id: 'stats', label: 'Estadísticas', icon: <BarChart3 className="nav-icon" /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        Triage Digital IESS
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
