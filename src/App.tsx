import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { Dashboard } from './pages/Dashboard';
import { Installer } from './pages/Installer';
import { ServerMods } from './pages/ServerMods';
import { ServerDetail } from './pages/ServerDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="servers" element={<Dashboard />} />
            <Route path="server/:agentId" element={<ServerDetail />} />
            <Route path="install" element={<Installer />} />
            <Route path="mods" element={<ServerMods />} />
            <Route path="settings" element={<div className="glass-panel" style={{ padding: '2rem' }}><h2>Settings</h2></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
