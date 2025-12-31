import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const form = new FormData();
        form.append('username', username);
        form.append('password', password);

        try {
            const res = await fetch(apiUrl('/auth/token'), {
                method: 'POST',
                body: form
            });

            if (res.ok) {
                const data = await res.json();
                login(data.access_token, username);
                navigate('/');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <LayoutGrid size={48} color="#818cf8" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to manage your servers</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            style={{ width: '100%' }}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            style={{ width: '100%' }}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '1rem' }}>
                        Sign In
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#818cf8' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};
