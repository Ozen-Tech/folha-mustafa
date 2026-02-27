import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';

export default function CriarUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.register(email, password, name || undefined);
      alert('Usuário criado com sucesso!');
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Criar Novo Usuário</h1>
      <form onSubmit={handleSubmit} className="form-container">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Nome (opcional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Nome completo"
          />
        </div>
        <div className="form-group">
          <label className="form-label">E-mail *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
            placeholder="seu@email.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Senha *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="input-field"
            placeholder="••••••••"
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            Mínimo de 6 caracteres
          </small>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}

