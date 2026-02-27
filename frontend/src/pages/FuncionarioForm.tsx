import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { funcionarios, cargos, type Funcionario } from '../api';
import { ArrowLeft } from 'lucide-react';

export default function FuncionarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargosList, setCargosList] = useState<{ id: string; nome: string; salarioBase: number }[]>([]);
  const [form, setForm] = useState<Partial<Funcionario> & { dataAdmissao: string }>({
    nome: '', cpf: '', email: '', dataAdmissao: '', cargoId: '',
    banco: '', agencia: '', conta: '', valeTransporte: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargos.list().then(setCargosList); }, []);
  useEffect(() => {
    if (id && id !== 'novo') {
      funcionarios.get(id).then((f) => setForm({ ...f, dataAdmissao: f.dataAdmissao ? f.dataAdmissao.slice(0, 10) : '' }));
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (id && id !== 'novo') {
        await funcionarios.update(id, form as Partial<Funcionario>);
      } else {
        await funcionarios.create(form as Funcionario & { nome: string; cpf: string; dataAdmissao: string; cargoId: string });
      }
      navigate('/funcionarios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" onClick={() => navigate('/funcionarios')} className="link-btn" style={{ marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className="page-title">{id && id !== 'novo' ? 'Editar funcionário' : 'Novo funcionário'}</h1>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', maxWidth: 520 }}>
        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Nome *</label>
            <input required value={form.nome ?? ''} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="form-label">CPF *</label>
            <input required value={form.cpf ?? ''} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} className="input-field" placeholder="Somente números" />
          </div>
          <div>
            <label className="form-label">E-mail</label>
            <input type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="form-label">Data de admissão *</label>
            <input type="date" required value={form.dataAdmissao ?? ''} onChange={(e) => setForm((f) => ({ ...f, dataAdmissao: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="form-label">Cargo *</label>
            <select required value={form.cargoId ?? ''} onChange={(e) => setForm((f) => ({ ...f, cargoId: e.target.value }))} className="input-field">
              <option value="">Selecione</option>
              {cargosList.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} (R$ {c.salarioBase.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Banco</label>
              <input value={form.banco ?? ''} onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">Agência</label>
              <input value={form.agencia ?? ''} onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">Conta</label>
              <input value={form.conta ?? ''} onChange={(e) => setForm((f) => ({ ...f, conta: e.target.value }))} className="input-field" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.valeTransporte ?? false} onChange={(e) => setForm((f) => ({ ...f, valeTransporte: e.target.checked }))} />
            Vale transporte
          </label>
          {id && id !== 'novo' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />
              Ativo
            </label>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" onClick={() => navigate('/funcionarios')} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
