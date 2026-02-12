import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, FileSpreadsheet, Upload, UserPlus, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', end: true, label: 'Início', icon: LayoutDashboard },
  { to: '/funcionarios', label: 'Funcionários', icon: Users },
  { to: '/cargos', label: 'Cargos', icon: Briefcase },
  { to: '/folha', label: 'Folha de pagamento', icon: FileSpreadsheet },
  { to: '/importar', label: 'Importar Excel', icon: Upload },
  { to: '/usuarios/novo', label: 'Criar Usuário', icon: UserPlus },
];

export default function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  }

  return (
    <div className="app-layout">
      <header className="app-header" style={{ justifyContent: 'space-between' }}>
        <div className="header-brand">
          <span className="brand-logo">Mustafá</span>
          <span className="brand-sublabel">Folha de Pagamento</span>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            {navItems.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <Icon size={20} strokeWidth={2} className="nav-icon" />
                <span className="nav-label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
