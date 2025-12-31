import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    token: string | null;
    user: { username: string } | null;
    login: (token: string, username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ token: null, user: null, login: () => { }, logout: () => { } });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<{ username: string } | null>(null);

    useEffect(() => {
        if (token) {
            // Validate or fetch user details
            fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Invalid token");
                })
                .then(data => setUser({ username: data.username }))
                .catch(() => logout());
        }
    }, [token]);

    const login = (newToken: string, username: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser({ username });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
