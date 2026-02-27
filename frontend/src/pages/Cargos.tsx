import { useEffect, useState } from 'react';
import { cargos } from '../api';
import { Plus } from 'lucide-react';

export default function Cargos() {
  const [list, setList] = useState<{ id: string; nome: string; salarioBase: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ id?: string; nome: string; salarioBase: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    cargos.list().then(setList).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setError('');
    setSaving(true);
    try {
      const salarioBase = Number(modal.salarioBase.replace(',', '.')) || 0;
      if (modal.id) await cargos.update(modal.id, { nome: modal.nome, salarioBase });
      else await cargos.create({ nome: modal.nome, salarioBase });
      setModal(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este cargo?')) return;
    try {
      await cargos.delete(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cargos</h1>
          <p className="page-subtitle">Cadastre os cargos e salários base</p>
        </div>
        <button onClick={() => setModal({ nome: '', salarioBase: '0' })} className="btn-primary">
          <Plus size={18} />
          Novo cargo
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ textAlign: 'right' }}>Salário base</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ textAlign: 'right' }}>R$ {c.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <button type="button" onClick={() => setModal({ id: c.id, nome: c.nome, salarioBase: String(c.salarioBase) })} className="link-btn">Editar</button>
                    <button type="button" onClick={() => remove(c.id)} className="link-btn link-btn-danger" style={{ marginLeft: '0.75rem' }}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{modal.id ? 'Editar' : 'Novo'} cargo</h3>
            {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className="form-label">Nome *</label>
              <input required value={modal.nome} onChange={(e) => setModal((m) => (m ? { ...m, nome: e.target.value } : m))} className="input-field" />
              <label className="form-label">Salário base</label>
              <input value={modal.salarioBase} onChange={(e) => setModal((m) => (m ? { ...m, salarioBase: e.target.value } : m))} className="input-field" placeholder="0,00" />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
