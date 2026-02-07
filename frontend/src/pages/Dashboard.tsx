import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { funcionarios, folha } from '../api';
import { Users, FileSpreadsheet } from 'lucide-react';

export default function Dashboard() {
  const [totalFunc, setTotalFunc] = useState<number | null>(null);
  const [ultimaCompetencia, setUltimaCompetencia] = useState<{ id: string; ano: number; mes: number } | null>(null);

  useEffect(() => {
    funcionarios.list().then((list) => setTotalFunc(list.length));
    folha.competencias().then((list) => {
      if (list.length) setUltimaCompetencia(list[0]);
    });
  }, []);

  const mesNome = (m: number) =>
    ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][m];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Início</h1>
          <p className="page-subtitle">Visão geral da folha de pagamento</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="var(--accent)" />
            </div>
            <span className="metric-label">Funcionários ativos</span>
          </div>
          <div className="metric-value">{totalFunc ?? '—'}</div>
          <Link to="/funcionarios" className="metric-link">Ver lista →</Link>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={20} color="var(--accent)" />
            </div>
            <span className="metric-label">Última competência</span>
          </div>
          <div className="metric-value">
            {ultimaCompetencia ? `${mesNome(ultimaCompetencia.mes)}/${ultimaCompetencia.ano}` : '—'}
          </div>
          {ultimaCompetencia && (
            <Link to={'/folha/' + ultimaCompetencia.id} className="metric-link">Abrir folha →</Link>
          )}
        </div>
      </div>
    </div>
  );
}
