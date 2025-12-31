import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Server, Settings, LayoutGrid } from 'lucide-react';

export const Layout: React.FC = () => {
    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
            {/* Sidebar */}
            <aside className="glass-panel" style={{ width: '250px', margin: '16px', display: 'flex', flexDirection: 'column', padding: '16px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Conductor
                </h1>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <NavItem to="/" icon={<LayoutGrid size={20} />} label="대시보드" />
                    <NavItem to="/servers" icon={<Server size={20} />} label="서버 목록" />
                    <NavItem to="/settings" icon={<Settings size={20} />} label="설정" />
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '16px 16px 16px 0', overflow: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
        }
        style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive ? 'white' : 'var(--text-muted)',
            background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
            transition: 'all 0.2s'
        })}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);
