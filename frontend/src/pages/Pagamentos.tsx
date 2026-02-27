import { useState, useEffect, useCallback } from 'react';
import { folha, pagamentos, type Competencia, type PagamentoItem } from '../api';
import QRCode from 'qrcode';
import { Check, Clock, DollarSign } from 'lucide-react';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function gerarPayloadPix(chave: string, valor: number, nome: string): string {
  const pad = (id: string, val: string) => id + String(val.length).padStart(2, '0') + val;
  const merchant = pad('00', 'br.gov.bcb.pix') + pad('01', chave);
  const valorStr = valor.toFixed(2);
  let payload =
    pad('00', '01') +
    pad('26', merchant) +
    pad('52', '0000') +
    pad('53', '986') +
    pad('54', valorStr) +
    pad('58', 'BR') +
    pad('59', nome.substring(0, 25)) +
    pad('60', 'SAO PAULO') +
    pad('62', pad('05', '***'));
  payload += '6304';
  const crc = crc16(payload);
  return payload + crc;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function PixQR({ chave, valor, nome }: { chave: string; valor: number; nome: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const payload = gerarPayloadPix(chave, valor, nome);
    QRCode.toDataURL(payload, { width: 140, margin: 1 }).then(setSrc);
  }, [chave, valor, nome]);
  if (!src) return null;
  return <img src={src} alt="QR Code PIX" style={{ width: 140, height: 140, borderRadius: '8px', border: '1px solid var(--border)' }} />;
}

export default function Pagamentos() {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [folhaId, setFolhaId] = useState('');
  const [items, setItems] = useState<PagamentoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    folha.competencias().then(setCompetencias);
  }, []);

  const loadPagamentos = useCallback(async (compId: string) => {
    if (!compId) return;
    setLoading(true);
    try {
      const f = await folha.getFolha(compId);
      setFolhaId(f.id);
      const pags = await pagamentos.listarPorFolha(f.id);
      setItems(pags);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedComp) loadPagamentos(selectedComp);
  }, [selectedComp, loadPagamentos]);

  async function togglePago(item: PagamentoItem) {
    if (item.pago) {
      await pagamentos.desmarcarPago(item.folhaFuncionarioId);
    } else {
      await pagamentos.marcarPago(item.folhaFuncionarioId);
    }
    const pags = await pagamentos.listarPorFolha(folhaId);
    setItems(pags);
  }

  const mesNome = (m: number) =>
    ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][m];

  const totalPago = items.filter((i) => i.pago).reduce((a, i) => a + i.salarioLiquido, 0);
  const totalPendente = items.filter((i) => !i.pago).reduce((a, i) => a + i.salarioLiquido, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pagamentos</h1>
          <p className="page-subtitle">Realize os pagamentos via PIX e acompanhe o status</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 250 }}>
          <label className="form-label">Competência</label>
          <select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="input-field">
            <option value="">Selecione a competência</option>
            {competencias.map((c) => (
              <option key={c.id} value={c.id}>{mesNome(c.mes)}/{c.ano}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedComp && items.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div className="metric-card">
            <span className="metric-label">Total a pagar</span>
            <span className="metric-value">{brl.format(totalPago + totalPendente)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Pago</span>
            <span className="metric-value" style={{ color: 'var(--success)' }}>{brl.format(totalPago)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Pendente</span>
            <span className="metric-value" style={{ color: 'var(--danger)' }}>{brl.format(totalPendente)}</span>
          </div>
        </div>
      )}

      {loading && <div className="empty-state">Carregando...</div>}

      {!loading && selectedComp && items.length === 0 && (
        <div className="empty-state">Nenhum item na folha. Gere a folha primeiro.</div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <div key={item.folhaFuncionarioId} className="card" style={{
              padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap',
              borderLeft: item.pago ? '4px solid var(--success)' : '4px solid var(--warning)',
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{item.funcionario.nome}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {item.funcionario.funcao || 'Sem função'} — CPF: {item.funcionario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="metric-label">Valor líquido</span>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--accent)' }}>{brl.format(item.salarioLiquido)}</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="metric-label">Chave PIX</span>
                  <div style={{ fontWeight: 500, fontSize: '0.9375rem', wordBreak: 'break-all' }}>{item.funcionario.chavePix || 'Não informada'}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                {item.funcionario.chavePix ? (
                  <PixQR chave={item.funcionario.chavePix} valor={item.salarioLiquido} nome={item.funcionario.nome} />
                ) : (
                  <div style={{ width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-hover)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    Sem chave PIX
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: 140 }}>
                {item.pago ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
                      <Check size={20} /> Pago
                    </div>
                    {item.dataPagamento && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(item.dataPagamento).toLocaleDateString('pt-BR')}</span>}
                    <button onClick={() => togglePago(item)} className="btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}>
                      Desfazer
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 600 }}>
                      <Clock size={20} /> Pendente
                    </div>
                    <button onClick={() => togglePago(item)} className="btn-primary" style={{ gap: '0.5rem' }}>
                      <DollarSign size={18} /> Marcar pago
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
