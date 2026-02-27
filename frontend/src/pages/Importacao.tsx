import { useMemo, useState } from 'react';
import { importacao } from '../api';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle } from 'lucide-react';

type FieldKey =
  | 'nome'
  | 'cpf'
  | 'email'
  | 'dataAdmissao'
  | 'funcao'
  | 'salario'
  | 'chavePix'
  | 'tipoVinculo'
  | 'valeTransporte';

const REQUIRED: FieldKey[] = ['nome', 'cpf', 'dataAdmissao', 'salario'];

export default function Importacao() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'select' | 'map' | 'preview' | 'done'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [headers, setHeaders] = useState<unknown[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>(() => ({
    nome: '', cpf: '', email: '', dataAdmissao: '', funcao: '', salario: '',
    chavePix: '', tipoVinculo: '', valeTransporte: '',
  }));

  const [preview, setPreview] = useState<{ rows: any[]; errors: string[]; validCount: number } | null>(null);
  const [createDeptCargo, setCreateDeptCargo] = useState(true);
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);

  const headerOptions = useMemo(() => headers.map((h) => String(h)), [headers]);

  async function handleUpload() {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const data = await importacao.upload(file);
      setHeaders(data.headers);
      setRows(data.rows);
      const lower = (data.headers as unknown[]).map((h) => String(h).toLowerCase().trim());
      const setIf = (key: FieldKey, ...candidates: string[]) => {
        const idx = lower.findIndex((h) => candidates.some((c) => c.toLowerCase() === h));
        if (idx >= 0) {
          setMapping((m) => ({ ...m, [key]: String(data.headers[idx]) }));
        }
      };
      setIf('nome', 'nome', 'funcionario', 'funcionário');
      setIf('cpf', 'cpf');
      setIf('dataAdmissao', 'dataadmissao', 'data de admissão', 'admissao', 'admissão');
      setIf('funcao', 'funcao', 'função', 'cargo');
      setIf('salario', 'salario', 'salário', 'salariobase', 'salário base');
      setIf('chavePix', 'chavepix', 'pix', 'chave pix');
      setStep('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload');
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    setError('');
    setLoading(true);
    try {
      for (const k of REQUIRED) {
        if (!mapping[k]) throw new Error(`Mapeie o campo obrigatório: ${k}`);
      }
      const data = await importacao.preview(headers, mapping, rows);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no preview');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setError('');
    setLoading(true);
    try {
      const res = await importacao.confirm(preview.rows as any[], createDeptCargo, 'Plan1');
      setResult(res);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Importar Excel</h1>
          <p className="page-subtitle">
            Faça upload da planilha e mapeie as colunas para os campos do sistema.
          </p>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {step === 'select' && (
        <div className="card" style={{ padding: '1.5rem', maxWidth: 480 }}>
          <label className="form-label">Arquivo (.xlsx / .xls)</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ display: 'block', marginTop: '0.5rem', marginBottom: '1rem' }}
          />
          <button disabled={!file || loading} onClick={handleUpload} className="btn-primary">
            <Upload size={18} />
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      )}

      {step === 'map' && (
        <div className="card" style={{ padding: '1.5rem', maxWidth: 640 }}>
          <h3 className="modal-title" style={{ marginBottom: '0.5rem' }}>Mapeamento de colunas</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
            Campos obrigatórios: {REQUIRED.join(', ')}.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {(Object.keys(mapping) as FieldKey[]).map((k) => (
              <div key={k}>
                <label className="form-label">{k} {REQUIRED.includes(k) ? '*' : ''}</label>
                <select
                  value={mapping[k]}
                  onChange={(e) => setMapping((m) => ({ ...m, [k]: e.target.value }))}
                  className="input-field"
                >
                  <option value="">(não mapear)</option>
                  {headerOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button disabled={loading} onClick={handlePreview} className="btn-primary">
              <ArrowRight size={18} />
              {loading ? 'Processando...' : 'Gerar preview'}
            </button>
            <button
              disabled={loading}
              onClick={() => {
                setStep('select');
                setPreview(null);
                setResult(null);
                setHeaders([]);
                setRows([]);
              }}
              className="btn-secondary"
            >
              Recomeçar
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="card" style={{ padding: '1.5rem', maxWidth: 900 }}>
          <h3 className="modal-title" style={{ marginBottom: '0.5rem' }}>Preview</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
            Linhas válidas: <b>{preview.validCount}</b> / {preview.rows.length}
          </p>

          {preview.errors.length > 0 && (
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 500 }}>
                Ver erros ({preview.errors.length})
              </summary>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', color: 'var(--danger)' }}>
                {preview.errors.slice(0, 50).map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </details>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={createDeptCargo} onChange={(e) => setCreateDeptCargo(e.currentTarget.checked)} />
            Criar dados automaticamente se não existirem
          </label>

          <div className="table-container" style={{ marginBottom: '1.25rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Função</th>
                  <th style={{ textAlign: 'right' }}>Salário</th>
                  <th>Erros</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 20).map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{r.nome}</td>
                    <td>{r.cpf}</td>
                    <td>{r.funcao || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{Number(r.salario || 0).toFixed(2)}</td>
                    <td style={{ color: r._errors?.length ? 'var(--danger)' : 'var(--success)', fontSize: '0.875rem' }}>
                      {r._errors?.length ? r._errors.join(', ') : 'OK'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button disabled={loading || preview.validCount === 0} onClick={handleConfirm} className="btn-primary">
              <CheckCircle size={18} />
              {loading ? 'Importando...' : 'Confirmar importação'}
            </button>
            <button disabled={loading} onClick={() => setStep('map')} className="btn-secondary">
              Voltar ao mapeamento
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="card" style={{ padding: '1.5rem', maxWidth: 480 }}>
          <h3 className="modal-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={24} style={{ color: 'var(--success)' }} />
            Importação concluída
          </h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>
            Criados: <b>{result.created}</b> — Atualizados: <b>{result.updated}</b>
          </p>
          {result.errors.length > 0 && (
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 500 }}>
                Ver erros ({result.errors.length})
              </summary>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', color: 'var(--danger)' }}>
                {result.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </details>
          )}
          <button
            onClick={() => {
              setStep('select');
              setFile(null);
              setHeaders([]);
              setRows([]);
              setPreview(null);
              setResult(null);
            }}
            className="btn-primary"
          >
            <FileSpreadsheet size={18} />
            Importar outra planilha
          </button>
        </div>
      )}
    </div>
  );
}
