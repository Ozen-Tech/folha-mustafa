import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { funcionarios, type Funcionario } from '../api';
import { ArrowLeft } from 'lucide-react';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export default function FuncionarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Funcionario> & { dataAdmissao: string }>({
    nome: '', cpf: '', email: '', dataAdmissao: '', salario: 0,
    funcao: '', chavePix: '', tipoVinculo: 'CLT', cidade: '', estado: '',
    loja: '', supervisor: '', valeTransporte: false, ajudaCusto: false, valorAjudaCusto: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        await funcionarios.create(form as Funcionario & { nome: string; cpf: string; dataAdmissao: string });
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

      <div className="card" style={{ padding: '1.5rem', maxWidth: 640 }}>
        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Nome *</label>
              <input required value={form.nome ?? ''} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">CPF *</label>
              <input required value={form.cpf ?? ''} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} className="input-field" placeholder="Somente números" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">E-mail</label>
              <input type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">Data de admissão *</label>
              <input type="date" required value={form.dataAdmissao ?? ''} onChange={(e) => setForm((f) => ({ ...f, dataAdmissao: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Função</label>
              <input value={form.funcao ?? ''} onChange={(e) => setForm((f) => ({ ...f, funcao: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">Salário (R$) *</label>
              <input type="number" step="0.01" min="0" required value={form.salario ?? 0} onChange={(e) => setForm((f) => ({ ...f, salario: parseFloat(e.target.value) || 0 }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">Vínculo</label>
              <select value={form.tipoVinculo ?? 'CLT'} onChange={(e) => setForm((f) => ({ ...f, tipoVinculo: e.target.value }))} className="input-field">
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Chave PIX</label>
            <input value={form.chavePix ?? ''} onChange={(e) => setForm((f) => ({ ...f, chavePix: e.target.value }))} className="input-field" placeholder="CPF, e-mail, telefone ou chave aleatória" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Loja</label>
              <input value={form.loja ?? ''} onChange={(e) => setForm((f) => ({ ...f, loja: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">Cidade</label>
              <input value={form.cidade ?? ''} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="form-label">Estado</label>
              <select value={form.estado ?? ''} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))} className="input-field">
                <option value="">Selecione</option>
                {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Supervisor</label>
            <input value={form.supervisor ?? ''} onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))} className="input-field" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.valeTransporte ?? false} onChange={(e) => setForm((f) => ({ ...f, valeTransporte: e.target.checked }))} />
            Vale transporte
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.ajudaCusto ?? false} onChange={(e) => setForm((f) => ({ ...f, ajudaCusto: e.target.checked }))} />
              Ajuda de custo
            </label>
            {form.ajudaCusto && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Valor (R$):</label>
                <input type="number" step="0.01" min="0" value={form.valorAjudaCusto ?? 0} onChange={(e) => setForm((f) => ({ ...f, valorAjudaCusto: parseFloat(e.target.value) || 0 }))} className="input-field" style={{ width: '120px' }} />
              </div>
            )}
          </div>
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
