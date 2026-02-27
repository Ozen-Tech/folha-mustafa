import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { funcionarios, type Funcionario } from '../api';
import { Plus, Search } from 'lucide-react';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Funcionarios() {
  const [list, setList] = useState<Funcionario[]>([]);
  const [filtro, setFiltro] = useState({ q: '', ativo: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    funcionarios
      .list({ q: filtro.q || undefined, ativo: filtro.ativo })
      .then(setList)
      .finally(() => setLoading(false));
  }, [filtro.q, filtro.ativo]);

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Funcionários</h1>
          <p className="page-subtitle">Gerencie o cadastro de colaboradores e promotores</p>
        </div>
        <Link to="/funcionarios/novo" className="btn-primary">
          <Plus size={18} />
          Novo funcionário
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 320 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF"
            value={filtro.q}
            onChange={(e) => setFiltro((f) => ({ ...f, q: e.target.value }))}
            className="input-field"
            style={{ paddingLeft: 40 }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={filtro.ativo}
            onChange={(e) => setFiltro((f) => ({ ...f, ativo: e.target.checked }))}
          />
          Apenas ativos
        </label>
      </div>

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Função</th>
                <th>Vínculo</th>
                <th style={{ textAlign: 'right' }}>Salário</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 500 }}>{f.nome}</td>
                  <td>{formatCpf(f.cpf)}</td>
                  <td>{f.funcao || '—'}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      background: f.tipoVinculo === 'PJ' ? 'var(--accent-light)' : 'var(--success-light)',
                      color: f.tipoVinculo === 'PJ' ? 'var(--accent)' : 'var(--success)',
                    }}>
                      {f.tipoVinculo}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{brl.format(f.salario)}</td>
                  <td>
                    <Link to={`/funcionarios/${f.id}`} className="link-btn">Editar</Link>
                    {' '}
                    <Link to={`/funcionarios/${f.id}/detalhe`} className="link-btn">Ver</Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">Nenhum funcionário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
