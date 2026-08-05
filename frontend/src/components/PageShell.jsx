import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: '▦' },
  { label: 'Book Venue', to: '/venues', icon: '⌖' },
  { label: 'Book Ground', to: '/grounds', icon: '✺' },
  { label: 'Book Equipment', to: '/equipment', icon: '◈' },
  { label: 'Inventory', to: '/inventory', icon: '⚒' },
  { label: 'Bookings', to: '/bookings', icon: '▤' },
  { label: 'Profile', to: '/profile', icon: '◉' },
  { label: 'Notifications', to: '/notifications', icon: '◌' },
  { label: 'Settings', to: '/settings', icon: '⚙' }
];

function PageShell({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => typeof window === 'undefined' ? 'light' : localStorage.getItem('sb-theme') || 'light');

  useEffect(() => { document.body.dataset.theme = theme; localStorage.setItem('sb-theme', theme); }, [theme]);
  const closeMenus = () => { setMobileMenuOpen(false); setUserMenuOpen(false); };
  const handleLogout = () => { logout(); closeMenus(); navigate('/login'); };
  const initials = (user?.name || 'Student').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return <div className="app-shell campus-shell">
    {mobileMenuOpen && <button className="nav-overlay" aria-label="Close navigation" onClick={closeMenus} />}
    <aside className={`sidebar campus-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <NavLink to={isAuthenticated ? '/dashboard' : '/'} className="sidebar-brand" onClick={closeMenus}><span className="brand-mark">SC</span><span><b>Smart Campus</b><small>Sports portal</small></span></NavLink>
      <nav className="sidebar-nav campus-nav" aria-label="Student navigation">
        {isAuthenticated ? navigation.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMenus}><span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}</NavLink>) : <><NavLink className="sidebar-link" to="/login" onClick={closeMenus}>Sign in</NavLink><NavLink className="sidebar-link" to="/register" onClick={closeMenus}>Create account</NavLink></>}
      </nav>
      {isAuthenticated && <div className="sidebar-footer"><div className="sidebar-help"><b>Need help?</b><span>Contact your sports coordinator.</span></div></div>}
    </aside>
    <div className="main-panel">
      <header className="topbar campus-topbar">
        <button type="button" className="mobile-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={mobileMenuOpen}>☰</button>
        <div className="topbar-title"><p className="eyebrow">Campus sports system</p><h1>Student portal</h1></div>
        <div className="topbar-actions">
          <button type="button" className="theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode" title="Toggle dark mode">{theme === 'dark' ? '☀' : '◐'}</button>
          {isAuthenticated ? <div className="user-menu"><button type="button" className="user-menu-trigger" onClick={() => setUserMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={userMenuOpen}><span className="topbar-avatar">{initials}</span><span className="user-menu-name">{user?.name || 'Student'}</span><span aria-hidden="true">⌄</span></button>
            {userMenuOpen && <div className="user-dropdown" role="menu"><div className="dropdown-user"><b>{user?.name || 'Student'}</b><span>{user?.email || 'Campus account'}</span></div><NavLink to="/profile" onClick={closeMenus} role="menuitem">View profile</NavLink><NavLink to="/settings" onClick={closeMenus} role="menuitem">Settings</NavLink><button type="button" onClick={handleLogout} role="menuitem">Log out</button></div>}
          </div> : <NavLink className="button" to="/login">Sign in</NavLink>}
        </div>
      </header>
      <main className="content"><div className="container">{children}</div></main>
      <footer className="footer">Smart Campus Sports Management System — campus facility reservation platform.</footer>
    </div>
  </div>;
}
export default PageShell;
