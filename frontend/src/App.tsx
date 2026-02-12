import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Funcionarios from './pages/Funcionarios';
import FuncionarioForm from './pages/FuncionarioForm';
import Cargos from './pages/Cargos';
import Importacao from './pages/Importacao';
import Folha from './pages/Folha';
import FolhaDetalhe from './pages/FolhaDetalhe';
import CriarUsuario from './pages/CriarUsuario';
import { auth } from './api';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      setOk(false);
      return;
    }
    auth.me()
      .then(() => setOk(true))
      .catch(() => {
        localStorage.removeItem('token');
        setOk(false);
      });
  }, []);
  if (ok === null) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
  if (!ok) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="funcionarios/novo" element={<FuncionarioForm />} />
        <Route path="funcionarios/:id" element={<FuncionarioForm />} />
        <Route path="cargos" element={<Cargos />} />
        <Route path="importar" element={<Importacao />} />
        <Route path="folha" element={<Folha />} />
        <Route path="folha/:competenciaId" element={<FolhaDetalhe />} />
        <Route path="usuarios/novo" element={<CriarUsuario />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
