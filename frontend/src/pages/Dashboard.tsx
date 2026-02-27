import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { funcionarios, folha, alertas, type AlertaContrato } from '../api';
import { Users, FileSpreadsheet, AlertTriangle } from 'lucide-react';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function Dashboard() {
  const [totalFunc, setTotalFunc] = useState<number | null>(null);
  const [ultimaCompetencia, setUltimaCompetencia] = useState<{ id: string; ano: number; mes: number } | null>(null);
  const [alertasVencimento, setAlertasVencimento] = useState<AlertaContrato[]>([]);

  useEffect(() => {
    funcionarios.list().then((list) => setTotalFunc(list.length));
    folha.competencias().then((list) => {
      if (list.length) setUltimaCompetencia(list[0]);
    });
    alertas.vencimento().then(setAlertasVencimento).catch(() => {});
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

      {alertasVencimento.length > 0 && (
        <div style={{ marginBottom: '1.5rem', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={22} color="var(--danger)" />
            <strong style={{ color: 'var(--danger)', fontSize: '1rem' }}>Contratos PJ vencendo em até 7 dias</strong>
          </div>
          {alertasVencimento.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
              <Link to={`/funcionarios/${a.funcionarioId}/detalhe`} className="link-btn" style={{ fontWeight: 600 }}>{a.funcionario.nome}</Link>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {a.descricao || 'Contrato'} — vence em {fmtDate(a.dataVencimento)}
              </span>
            </div>
          ))}
        </div>
      )}

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
