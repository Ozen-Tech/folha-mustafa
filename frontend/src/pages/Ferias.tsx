import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feriasApi, type FeriasType } from '../api';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function Ferias() {
  const [list, setList] = useState<FeriasType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    feriasApi.list().then(setList).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Férias</h1>
          <p className="page-subtitle">Todas as férias registradas no sistema</p>
        </div>
      </div>

      {loading ? <div className="empty-state">Carregando...</div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 500 }}>
                    <Link to={`/funcionarios/${f.funcionarioId}/detalhe`} className="link-btn">{f.funcionario?.nome ?? '—'}</Link>
                  </td>
                  <td>{fmtDate(f.dataInicio)}</td>
                  <td>{fmtDate(f.dataFim)}</td>
                  <td>{f.observacao || '—'}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="empty-state">Nenhuma férias registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
