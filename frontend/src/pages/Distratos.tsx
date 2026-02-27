import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distratos, type Distrato } from '../api';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function Distratos() {
  const [list, setList] = useState<Distrato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    distratos.list().then(setList).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Distratos</h1>
          <p className="page-subtitle">Todos os distratos do sistema</p>
        </div>
      </div>

      {loading ? <div className="empty-state">Carregando...</div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Descrição</th>
                <th>Data</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>
                    <Link to={`/funcionarios/${d.funcionarioId}/detalhe`} className="link-btn">{d.funcionario?.nome ?? '—'}</Link>
                  </td>
                  <td>{d.descricao || '—'}</td>
                  <td>{fmtDate(d.dataDistrato)}</td>
                  <td>{d.motivo || '—'}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="empty-state">Nenhum distrato encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
