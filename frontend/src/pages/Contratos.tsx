import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contratos, type Contrato } from '../api';
import { Search } from 'lucide-react';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function Contratos() {
  const [list, setList] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ estado: '', cidade: '', supervisor: '' });

  useEffect(() => {
    setLoading(true);
    contratos.list({
      estado: filtro.estado || undefined,
      cidade: filtro.cidade || undefined,
      supervisor: filtro.supervisor || undefined,
    }).then(setList).finally(() => setLoading(false));
  }, [filtro.estado, filtro.cidade, filtro.supervisor]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-subtitle">Todos os contratos do sistema</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Estado" value={filtro.estado} onChange={(e) => setFiltro((f) => ({ ...f, estado: e.target.value }))} className="input-field" style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ position: 'relative', minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Cidade" value={filtro.cidade} onChange={(e) => setFiltro((f) => ({ ...f, cidade: e.target.value }))} className="input-field" style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ position: 'relative', minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Supervisor" value={filtro.supervisor} onChange={(e) => setFiltro((f) => ({ ...f, supervisor: e.target.value }))} className="input-field" style={{ paddingLeft: 34 }} />
        </div>
      </div>

      {loading ? <div className="empty-state">Carregando...</div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Vínculo</th>
                <th>Descrição</th>
                <th>Início</th>
                <th>Vencimento</th>
                <th>Loja</th>
                <th>Cidade/UF</th>
                <th>Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>
                    <Link to={`/funcionarios/${c.funcionarioId}/detalhe`} className="link-btn">{c.funcionario?.nome ?? '—'}</Link>
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600,
                      background: c.funcionario?.tipoVinculo === 'PJ' ? 'var(--accent-light)' : 'var(--success-light)',
                      color: c.funcionario?.tipoVinculo === 'PJ' ? 'var(--accent)' : 'var(--success)',
                    }}>{c.funcionario?.tipoVinculo ?? '—'}</span>
                  </td>
                  <td>{c.descricao || '—'}</td>
                  <td>{fmtDate(c.dataInicio)}</td>
                  <td>{fmtDate(c.dataVencimento)}</td>
                  <td>{c.loja || '—'}</td>
                  <td>{c.cidade || '—'}{c.estado ? ` / ${c.estado}` : ''}</td>
                  <td>{c.supervisor || '—'}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="empty-state">Nenhum contrato encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
