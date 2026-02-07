import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { folha, type Competencia } from '../api';
import { Plus, ChevronRight } from 'lucide-react';

export default function Folha() {
  const [list, setList] = useState<Competencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ ano: string; mes: string }>({
    ano: String(new Date().getFullYear()),
    mes: String(new Date().getMonth() + 1),
  });
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    folha.competencias().then(setList).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const ano = Number(form.ano);
      const mes = Number(form.mes);
      if (!ano || mes < 1 || mes > 12) throw new Error('Ano/mês inválidos');
      await folha.createCompetencia(ano, mes);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  const mesNome = (m: number) =>
    ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][m];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Folha de pagamento</h1>
          <p className="page-subtitle">Gerencie competências e processe a folha</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '1.25rem', minWidth: 320 }}>
          <h3 className="modal-title" style={{ marginBottom: '1rem' }}>Nova competência</h3>
          {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={create} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 80 }}>
              <label className="form-label">Ano</label>
              <input value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: e.target.value }))} className="input-field" />
            </div>
            <div style={{ minWidth: 160 }}>
              <label className="form-label">Mês</label>
              <select value={form.mes} onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))} className="input-field">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m)}>{m} - {mesNome(m)}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">
              <Plus size={18} />
              Criar
            </button>
          </form>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 360, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 className="modal-title" style={{ margin: 0 }}>Competências</h3>
          </div>
          {loading ? (
            <div className="empty-state">Carregando...</div>
          ) : (
            <div className="table-container" style={{ boxShadow: 'none', border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Competência</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{mesNome(c.mes)}/{c.ano}</td>
                      <td>
                        <Link to={'/folha/' + c.id} className="link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          Abrir <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={2} className="empty-state">Nenhuma competência criada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
