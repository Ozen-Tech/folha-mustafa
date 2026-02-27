import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { funcionarios, contratos, distratos, feriasApi, type Funcionario, type Contrato, type Distrato, type FeriasType } from '../api';
import { ArrowLeft, Plus, Trash2, Edit, FileText, CalendarOff, Palmtree, Paperclip, ExternalLink } from 'lucide-react';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

type Tab = 'dados' | 'contratos' | 'distratos' | 'ferias';

export default function FuncionarioDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [func, setFunc] = useState<Funcionario | null>(null);
  const [tab, setTab] = useState<Tab>('dados');
  const [contratosList, setContratosList] = useState<Contrato[]>([]);
  const [distratosList, setDistratosList] = useState<Distrato[]>([]);
  const [feriasList, setFeriasList] = useState<FeriasType[]>([]);

  const [contratoForm, setContratoForm] = useState({ descricao: '', dataInicio: '', dataVencimento: '', loja: '', cidade: '', estado: '', supervisor: '', arquivo: null as File | null });
  const [distratoForm, setDistratoForm] = useState({ descricao: '', dataDistrato: '', motivo: '' });
  const [feriasForm, setFeriasForm] = useState({ dataInicio: '', dataFim: '', observacao: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    funcionarios.get(id).then(setFunc);
    contratos.list({ funcionarioId: id }).then(setContratosList);
    distratos.list({ funcionarioId: id }).then(setDistratosList);
    feriasApi.list({ funcionarioId: id }).then(setFeriasList);
  }, [id]);

  if (!func) return <div className="empty-state">Carregando...</div>;

  async function addContrato(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const fd = new FormData();
      fd.append('funcionarioId', id!);
      fd.append('descricao', contratoForm.descricao);
      fd.append('dataInicio', contratoForm.dataInicio);
      fd.append('dataVencimento', contratoForm.dataVencimento);
      fd.append('loja', contratoForm.loja);
      fd.append('cidade', contratoForm.cidade);
      fd.append('estado', contratoForm.estado);
      fd.append('supervisor', contratoForm.supervisor);
      if (contratoForm.arquivo) fd.append('arquivo', contratoForm.arquivo);
      await contratos.create(fd);
      setContratoForm({ descricao: '', dataInicio: '', dataVencimento: '', loja: '', cidade: '', estado: '', supervisor: '', arquivo: null });
      contratos.list({ funcionarioId: id }).then(setContratosList);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
  }

  async function addDistrato(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await distratos.create({ funcionarioId: id!, ...distratoForm });
      setDistratoForm({ descricao: '', dataDistrato: '', motivo: '' });
      distratos.list({ funcionarioId: id }).then(setDistratosList);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
  }

  async function addFerias(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await feriasApi.create({ funcionarioId: id!, ...feriasForm });
      setFeriasForm({ dataInicio: '', dataFim: '', observacao: '' });
      feriasApi.list({ funcionarioId: id }).then(setFeriasList);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
  }

  async function deleteContrato(cid: string) {
    if (!confirm('Remover contrato?')) return;
    await contratos.delete(cid);
    contratos.list({ funcionarioId: id }).then(setContratosList);
  }

  async function deleteDistrato(did: string) {
    if (!confirm('Remover distrato?')) return;
    await distratos.delete(did);
    distratos.list({ funcionarioId: id }).then(setDistratosList);
  }

  async function deleteFerias(fid: string) {
    if (!confirm('Remover férias?')) return;
    await feriasApi.delete(fid);
    feriasApi.list({ funcionarioId: id }).then(setFeriasList);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dados', label: 'Dados' },
    { key: 'contratos', label: `Contratos (${contratosList.length})` },
    { key: 'distratos', label: `Distratos (${distratosList.length})` },
    { key: 'ferias', label: `Férias (${feriasList.length})` },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" onClick={() => navigate('/funcionarios')} className="link-btn" style={{ marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className="page-title">{func.nome}</h1>
          <p className="page-subtitle">{func.funcao || 'Sem função'} — {func.tipoVinculo} — {brl.format(func.salario)}</p>
        </div>
        <Link to={`/funcionarios/${id}`} className="btn-secondary"><Edit size={18} /> Editar</Link>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.75rem 1.25rem', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: tab === t.key ? 600 : 400, fontSize: '0.9375rem', marginBottom: '-2px', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'dados' && (
        <div className="card" style={{ padding: '1.5rem', maxWidth: 600 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><span className="metric-label">CPF</span><div style={{ fontWeight: 500 }}>{func.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</div></div>
            <div><span className="metric-label">E-mail</span><div style={{ fontWeight: 500 }}>{func.email || '—'}</div></div>
            <div><span className="metric-label">Data de admissão</span><div style={{ fontWeight: 500 }}>{fmtDate(func.dataAdmissao)}</div></div>
            <div><span className="metric-label">Vínculo</span><div style={{ fontWeight: 500 }}>{func.tipoVinculo}</div></div>
            <div><span className="metric-label">Chave PIX</span><div style={{ fontWeight: 500 }}>{func.chavePix || '—'}</div></div>
            <div><span className="metric-label">Salário</span><div style={{ fontWeight: 500 }}>{brl.format(func.salario)}</div></div>
            <div><span className="metric-label">Loja</span><div style={{ fontWeight: 500 }}>{func.loja || '—'}</div></div>
            <div><span className="metric-label">Cidade / Estado</span><div style={{ fontWeight: 500 }}>{func.cidade || '—'} / {func.estado || '—'}</div></div>
            <div><span className="metric-label">Supervisor</span><div style={{ fontWeight: 500 }}>{func.supervisor || '—'}</div></div>
            <div><span className="metric-label">Vale transporte</span><div style={{ fontWeight: 500 }}>{func.valeTransporte ? 'Sim' : 'Não'}</div></div>
          </div>
        </div>
      )}

      {tab === 'contratos' && (
        <div>
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', maxWidth: 700 }}>
            <h3 className="modal-title" style={{ marginBottom: '0.75rem' }}><FileText size={18} style={{ verticalAlign: 'middle' }} /> Novo contrato</h3>
            <form onSubmit={addContrato} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Descrição</label><input value={contratoForm.descricao} onChange={(e) => setContratoForm((f) => ({ ...f, descricao: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Data início *</label><input type="date" required value={contratoForm.dataInicio} onChange={(e) => setContratoForm((f) => ({ ...f, dataInicio: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Data vencimento *</label><input type="date" required value={contratoForm.dataVencimento} onChange={(e) => setContratoForm((f) => ({ ...f, dataVencimento: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Loja</label><input value={contratoForm.loja} onChange={(e) => setContratoForm((f) => ({ ...f, loja: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Cidade</label><input value={contratoForm.cidade} onChange={(e) => setContratoForm((f) => ({ ...f, cidade: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Estado</label><input value={contratoForm.estado} onChange={(e) => setContratoForm((f) => ({ ...f, estado: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Supervisor</label><input value={contratoForm.supervisor} onChange={(e) => setContratoForm((f) => ({ ...f, supervisor: e.target.value }))} className="input-field" /></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label"><Paperclip size={14} style={{ verticalAlign: 'middle' }} /> Anexar PDF (opcional)</label>
                <input type="file" accept="application/pdf" onChange={(e) => setContratoForm((f) => ({ ...f, arquivo: e.target.files?.[0] || null }))} className="input-field" style={{ padding: '0.5rem' }} />
                {contratoForm.arquivo && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{contratoForm.arquivo.name}</span>}
              </div>
              <div style={{ gridColumn: '1 / -1' }}><button type="submit" className="btn-primary"><Plus size={18} /> Adicionar</button></div>
            </form>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Descrição</th><th>Início</th><th>Vencimento</th><th>Loja</th><th>Supervisor</th><th>PDF</th><th style={{ width: 60 }}></th></tr></thead>
              <tbody>
                {contratosList.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.descricao || '—'}</td>
                    <td>{fmtDate(c.dataInicio)}</td>
                    <td>{fmtDate(c.dataVencimento)}</td>
                    <td>{c.loja || '—'}</td>
                    <td>{c.supervisor || '—'}</td>
                    <td>{c.arquivoPdf ? <a href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '').replace(/\/$/, '') : ''}${c.arquivoPdf}`} target="_blank" rel="noopener noreferrer" className="link-btn" title="Abrir PDF"><ExternalLink size={14} /></a> : '—'}</td>
                    <td><button onClick={() => deleteContrato(c.id)} className="link-btn-danger"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {contratosList.length === 0 && <tr><td colSpan={7} className="empty-state">Nenhum contrato.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'distratos' && (
        <div>
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', maxWidth: 500 }}>
            <h3 className="modal-title" style={{ marginBottom: '0.75rem' }}><CalendarOff size={18} style={{ verticalAlign: 'middle' }} /> Novo distrato</h3>
            <form onSubmit={addDistrato} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><label className="form-label">Descrição</label><input value={distratoForm.descricao} onChange={(e) => setDistratoForm((f) => ({ ...f, descricao: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Data do distrato *</label><input type="date" required value={distratoForm.dataDistrato} onChange={(e) => setDistratoForm((f) => ({ ...f, dataDistrato: e.target.value }))} className="input-field" /></div>
              <div><label className="form-label">Motivo</label><input value={distratoForm.motivo} onChange={(e) => setDistratoForm((f) => ({ ...f, motivo: e.target.value }))} className="input-field" /></div>
              <button type="submit" className="btn-primary"><Plus size={18} /> Adicionar</button>
            </form>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Descrição</th><th>Data</th><th>Motivo</th><th style={{ width: 60 }}></th></tr></thead>
              <tbody>
                {distratosList.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500 }}>{d.descricao || '—'}</td>
                    <td>{fmtDate(d.dataDistrato)}</td>
                    <td>{d.motivo || '—'}</td>
                    <td><button onClick={() => deleteDistrato(d.id)} className="link-btn-danger"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {distratosList.length === 0 && <tr><td colSpan={4} className="empty-state">Nenhum distrato.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ferias' && (
        <div>
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', maxWidth: 500 }}>
            <h3 className="modal-title" style={{ marginBottom: '0.75rem' }}><Palmtree size={18} style={{ verticalAlign: 'middle' }} /> Novas férias</h3>
            <form onSubmit={addFerias} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label className="form-label">Data início *</label><input type="date" required value={feriasForm.dataInicio} onChange={(e) => setFeriasForm((f) => ({ ...f, dataInicio: e.target.value }))} className="input-field" /></div>
                <div><label className="form-label">Data fim *</label><input type="date" required value={feriasForm.dataFim} onChange={(e) => setFeriasForm((f) => ({ ...f, dataFim: e.target.value }))} className="input-field" /></div>
              </div>
              <div><label className="form-label">Observação</label><input value={feriasForm.observacao} onChange={(e) => setFeriasForm((f) => ({ ...f, observacao: e.target.value }))} className="input-field" /></div>
              <button type="submit" className="btn-primary"><Plus size={18} /> Adicionar</button>
            </form>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Início</th><th>Fim</th><th>Observação</th><th style={{ width: 60 }}></th></tr></thead>
              <tbody>
                {feriasList.map((f) => (
                  <tr key={f.id}>
                    <td>{fmtDate(f.dataInicio)}</td>
                    <td>{fmtDate(f.dataFim)}</td>
                    <td>{f.observacao || '—'}</td>
                    <td><button onClick={() => deleteFerias(f.id)} className="link-btn-danger"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {feriasList.length === 0 && <tr><td colSpan={4} className="empty-state">Nenhuma férias registrada.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
