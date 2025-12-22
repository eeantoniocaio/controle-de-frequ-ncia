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
                    <GraduationCap size={32} color="var(--primary)" />
                    <h1 style={{ fontSize: '1.25rem' }}>Attendance</h1>
                </div>
                <nav style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link
                        to="/"
                        className={`btn btn-icon ${isActive('/') ? 'active' : ''}`}
                        style={{ color: isActive('/') ? 'var(--primary)' : 'var(--text-secondary)' }}
                    >
                        <Home />
                    </Link>
                    <Link
                        to="/settings"
                        className={`btn btn-icon ${isActive('/settings') ? 'active' : ''}`}
                        style={{ color: isActive('/settings') ? 'var(--primary)' : 'var(--text-secondary)' }}
                    >
                        <Settings />
                    </Link>
                </nav>
            </header>
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
