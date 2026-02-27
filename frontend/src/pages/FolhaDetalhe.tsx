import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { folha, relatorios, tiposLancamento, type FolhaPagamento, type FolhaItem } from '../api';
import { ArrowLeft, RefreshCw, FileSpreadsheet, FileText, Plus, Trash2 } from 'lucide-react';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FolhaDetalhe() {
  const { competenciaId } = useParams<{ competenciaId: string }>();
  const [data, setData] = useState<FolhaPagamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totais, setTotais] = useState<null | {
    totalProventos: number;
    totalDescontos: number;
    totalLiquido: number;
    totalInss: number;
    totalIrrf: number;
    quantidade: number;
  }>(null);

  const [selected, setSelected] = useState<FolhaItem | null>(null);
  const [tipos, setTipos] = useState<{ all: { id: string; codigo: string; nome: string; tipo: string }[] } | null>(null);

  const [lancForm, setLancForm] = useState<{ tipoLancamentoId: string; valor: string; referencia: string }>({
    tipoLancamentoId: '',
    valor: '',
    referencia: '',
  });

  const mesNome = (m: number) =>
    ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][m];

  async function load() {
    if (!competenciaId) return;
    setLoading(true);
    setError('');
    try {
      const folhaData = await folha.getFolha(competenciaId);
      setData(folhaData);
      setSelected(null);
      setTotais(await relatorios.totais(folhaData.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    tiposLancamento.list().then((t) => setTipos({ all: t.all }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competenciaId]);

  const competenciaLabel = useMemo(() => {
    if (!data) return '—';
    return `${mesNome(data.competencia.mes)}/${data.competencia.ano}`;
  }, [data]);

  async function gerar() {
    if (!competenciaId) return;
    setLoading(true);
    try {
      const folhaData = await folha.gerarFolha(competenciaId);
      setData(folhaData);
      setTotais(await relatorios.totais(folhaData.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function abrirItem(item: FolhaItem) {
    const full = await folha.getItem(item.id);
    setSelected(full as any);
    setLancForm({ tipoLancamentoId: '', valor: '', referencia: '' });
  }

  async function adicionarLancamento() {
    if (!selected) return;
    const valor = Number(lancForm.valor.replace(',', '.'));
    if (!lancForm.tipoLancamentoId || !Number.isFinite(valor)) {
      alert('Selecione o tipo e informe um valor.');
      return;
    }
    await folha.addLancamento(selected.id, lancForm.tipoLancamentoId, valor, lancForm.referencia || undefined);
    const full = await folha.getItem(selected.id);
    setSelected(full as any);
    if (data) setTotais(await relatorios.totais(data.id));
    setLancForm({ tipoLancamentoId: '', valor: '', referencia: '' });
  }

  async function removerLancamento(lancamentoId: string) {
    if (!selected) return;
    if (!confirm('Remover este lançamento?')) return;
    await folha.removeLancamento(lancamentoId);
    const full = await folha.getItem(selected.id);
    setSelected(full as any);
    if (data) setTotais(await relatorios.totais(data.id));
  }

  async function exportarExcel() {
    if (!data) return;
    await relatorios.downloadExcel(data.id);
  }

  async function baixarHolerite() {
    if (!selected) return;
    await relatorios.downloadHoleritePdf(selected.id);
  }

  if (!competenciaId) return <div>Competência inválida.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/folha" className="link-btn" style={{ marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 className="page-title">Folha: {competenciaLabel}</h1>
          <p className="page-subtitle">Detalhes e lançamentos da competência</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={gerar} disabled={loading} className="btn-primary">
            <RefreshCw size={18} />
            {loading ? 'Gerando...' : 'Gerar/atualizar folha'}
          </button>
          <button onClick={exportarExcel} disabled={!data} className="btn-secondary">
            <FileSpreadsheet size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {totais && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div className="metric-card">
            <span className="metric-label">Proventos</span>
            <span className="metric-value">{brl.format(totais.totalProventos)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Descontos</span>
            <span className="metric-value">{brl.format(totais.totalDescontos)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Líquido</span>
            <span className="metric-value" style={{ color: 'var(--accent)' }}>{brl.format(totais.totalLiquido)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">INSS</span>
            <span className="metric-value">{brl.format(totais.totalInss)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">IRRF</span>
            <span className="metric-value">{brl.format(totais.totalIrrf)}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="empty-state">Carregando...</div>
          ) : (
            <div className="table-container" style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Cargo</th>
                    <th style={{ textAlign: 'right' }}>Proventos</th>
                    <th style={{ textAlign: 'right' }}>Descontos</th>
                    <th style={{ textAlign: 'right' }}>Líquido</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.itens ?? []).map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 500 }}>{i.funcionario.nome}</td>
                      <td>{i.funcionario.cargo?.nome ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>{brl.format(i.totalProventos)}</td>
                      <td style={{ textAlign: 'right' }}>{brl.format(i.totalDescontos)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{brl.format(i.salarioLiquido)}</td>
                      <td>
                        <button onClick={() => abrirItem(i)} className="link-btn">
                          Detalhar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(data?.itens?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        Nenhum item na folha. Clique em &quot;Gerar/atualizar folha&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ width: 420, maxWidth: '100%', padding: '1.25rem' }}>
          <h3 className="modal-title" style={{ marginBottom: '0.5rem' }}>Detalhes</h3>
          {!selected ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Selecione um item em &quot;Detalhar&quot;.</p>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {selected.funcionario?.nome} — {selected.funcionario?.cargo?.nome}
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <span className="metric-label">Proventos</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{brl.format(selected.totalProventos)}</div>
                </div>
                <div>
                  <span className="metric-label">Descontos</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{brl.format(selected.totalDescontos)}</div>
                </div>
                <div>
                  <span className="metric-label">Líquido</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)' }}>{brl.format(selected.salarioLiquido)}</div>
                </div>
              </div>

              <button onClick={baixarHolerite} className="btn-secondary" style={{ marginBottom: '1.25rem' }}>
                <FileText size={18} />
                Baixar holerite (PDF)
              </button>

              <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

              <h4 className="form-label" style={{ marginBottom: '0.75rem' }}>Adicionar lançamento</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Tipo</label>
                  <select
                    value={lancForm.tipoLancamentoId}
                    onChange={(e) => setLancForm((f) => ({ ...f, tipoLancamentoId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Selecione</option>
                    {(tipos?.all ?? []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tipo.toUpperCase()} — {t.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <input
                    value={lancForm.valor}
                    onChange={(e) => setLancForm((f) => ({ ...f, valor: e.target.value }))}
                    placeholder="Ex: 120.50"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Referência (opcional)</label>
                  <input
                    value={lancForm.referencia}
                    onChange={(e) => setLancForm((f) => ({ ...f, referencia: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <button onClick={adicionarLancamento} className="btn-primary">
                  <Plus size={18} />
                  Adicionar
                </button>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

              <h4 className="form-label" style={{ marginBottom: '0.5rem' }}>Lançamentos</h4>
              <div className="table-container" style={{ maxHeight: 200, overflow: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                      <th style={{ width: 70 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lancamentos.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontSize: '0.875rem' }}>{l.tipoLancamento.tipo}</td>
                        <td style={{ fontSize: '0.875rem' }}>{l.tipoLancamento.nome}</td>
                        <td style={{ textAlign: 'right', fontSize: '0.875rem' }}>{brl.format(l.valor)}</td>
                        <td>
                          <button onClick={() => removerLancamento(l.id)} className="link-btn-danger">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {selected.lancamentos.length === 0 && (
                      <tr>
                        <td colSpan={4} className="empty-state" style={{ padding: '0.75rem' }}>
                          Sem lançamentos adicionais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
