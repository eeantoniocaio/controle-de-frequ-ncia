import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Settings, GraduationCap } from 'lucide-react';

const Layout: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="container">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <GraduationCap size={28} color="var(--primary)" />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Attendance</h1>
                </div>
                <nav style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Link
                        to="/"
                        className={`btn btn-icon ${isActive('/') ? 'active' : ''}`}
                        title="Início"
                    >
                        <Home size={24} strokeWidth={isActive('/') ? 3 : 2} />
                    </Link>
                    <Link
                        to="/settings"
                        className={`btn btn-icon ${isActive('/settings') ? 'active' : ''}`}
                        title="Configurações"
                    >
                        <Settings size={24} strokeWidth={isActive('/settings') ? 3 : 2} />
                    </Link>
                </nav>
            </header>
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
