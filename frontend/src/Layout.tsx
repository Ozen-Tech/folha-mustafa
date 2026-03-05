import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, FileSpreadsheet, Upload } from 'lucide-react';

const navItems = [
  { to: '/', end: true, label: 'Início', icon: LayoutDashboard },
  { to: '/funcionarios', label: 'Funcionários', icon: Users },
  { to: '/cargos', label: 'Cargos', icon: Briefcase },
  { to: '/folha', label: 'Folha de pagamento', icon: FileSpreadsheet },
  { to: '/importar', label: 'Importar Excel', icon: Upload },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-logo">Mustafá</span>
          <span className="brand-sublabel">Folha de Pagamento</span>
        </div>
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
