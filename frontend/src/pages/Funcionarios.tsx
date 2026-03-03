import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { funcionarios, type Funcionario } from '../api';
import { Plus, Search, Trash2, DollarSign, X } from 'lucide-react';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type SalaryModalType = 'fixo' | 'percentual' | 'acrescimo';

export default function Funcionarios() {
  const [list, setList] = useState<Funcionario[]>([]);
  const [filtro, setFiltro] = useState({ q: '', ativo: true });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryType, setSalaryType] = useState<SalaryModalType>('fixo');
  const [salaryValue, setSalaryValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadList();
  }, [filtro.q, filtro.ativo]);

  function loadList() {
    setLoading(true);
    funcionarios
      .list({ q: filtro.q || undefined, ativo: filtro.ativo })
      .then((data) => {
        setList(data);
        setSelected(new Set());
      })
      .finally(() => setLoading(false));
  }

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === list.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(list.map((f) => f.id)));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    const confirmMsg = `Tem certeza que deseja excluir ${selected.size} funcionário(s)?\n\nEsta ação não pode ser desfeita.`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const result = await funcionarios.bulkDelete(Array.from(selected));
      alert(`${result.deleted} funcionário(s) excluído(s) com sucesso.`);
      loadList();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkSalary() {
    if (selected.size === 0 || !salaryValue) return;
    const valor = parseFloat(salaryValue);
    if (isNaN(valor)) {
      alert('Valor inválido');
      return;
    }

    setActionLoading(true);
    try {
      const params = salaryType === 'fixo'
        ? { tipo: 'fixo' as const, salario: valor }
        : { tipo: salaryType, valor };
      const result = await funcionarios.bulkUpdateSalary(Array.from(selected), params);
      alert(`${result.updated} funcionário(s) atualizado(s) com sucesso.`);
      setShowSalaryModal(false);
      setSalaryValue('');
      loadList();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  }

  const selectedFuncionarios = list.filter((f) => selected.has(f.id));
  const totalSalarioSelecionado = selectedFuncionarios.reduce((sum, f) => sum + f.salario, 0);

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

      {selected.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          background: 'var(--accent-light)',
          borderRadius: '8px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 500, color: 'var(--accent)' }}>
            {selected.size} selecionado(s)
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Total: {brl.format(totalSalarioSelecionado)}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setShowSalaryModal(true)}
            disabled={actionLoading}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <DollarSign size={16} />
            Alterar salário
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={actionLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              background: 'var(--danger)',
              color: 'white',
            }}
          >
            <Trash2 size={16} />
            Excluir
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="link-btn"
            style={{ marginLeft: '0.5rem' }}
          >
            Limpar seleção
          </button>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={list.length > 0 && selected.size === list.length}
                    onChange={toggleSelectAll}
                    title="Selecionar todos"
                  />
                </th>
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
                <tr key={f.id} style={{ background: selected.has(f.id) ? 'var(--accent-light)' : undefined }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(f.id)}
                      onChange={() => toggleSelect(f.id)}
                    />
                  </td>
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
                  <td colSpan={7} className="empty-state">Nenhum funcionário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showSalaryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Alterar salário em massa</h2>
              <button onClick={() => setShowSalaryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {selected.size} funcionário(s) selecionado(s)
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Tipo de alteração</label>
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as SalaryModalType)}
                className="input-field"
              >
                <option value="fixo">Definir valor fixo</option>
                <option value="percentual">Reajuste percentual (%)</option>
                <option value="acrescimo">Acréscimo fixo (R$)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                {salaryType === 'fixo' && 'Novo salário (R$)'}
                {salaryType === 'percentual' && 'Percentual de reajuste (%)'}
                {salaryType === 'acrescimo' && 'Valor do acréscimo (R$)'}
              </label>
              <input
                type="number"
                step={salaryType === 'percentual' ? '0.1' : '0.01'}
                value={salaryValue}
                onChange={(e) => setSalaryValue(e.target.value)}
                className="input-field"
                placeholder={salaryType === 'percentual' ? 'Ex: 5 para 5%' : 'Ex: 1500.00'}
              />
              {salaryType === 'percentual' && salaryValue && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Valores negativos reduzem o salário
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSalaryModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleBulkSalary}
                disabled={actionLoading || !salaryValue}
                className="btn-primary"
              >
                {actionLoading ? 'Aplicando...' : 'Aplicar alteração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
