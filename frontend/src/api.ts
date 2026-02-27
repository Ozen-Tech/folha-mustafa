const raw = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '');
const API = raw ? (raw.endsWith('/api') ? raw : `${raw}/api`) : '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown } = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.headers as HeadersInit),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (options.body != null && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  const res = await fetch(API + path, {
    ...options,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body != null
          ? JSON.stringify(options.body)
          : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Não autorizado');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erro na requisição');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ token: string; user: { id: string; email: string; name: string | null } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (email: string, password: string, name?: string) =>
    api<{ id: string; email: string; name: string | null }>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    }),
  me: () => api<{ id: string; email: string; name: string | null }>('/auth/me'),
};

export type Funcionario = {
  id: string;
  nome: string;
  cpf: string;
  email: string | null;
  dataAdmissao: string;
  ativo: boolean;
  salario: number;
  funcao: string | null;
  chavePix: string | null;
  tipoVinculo: string;
  cidade: string | null;
  estado: string | null;
  loja: string | null;
  supervisor: string | null;
  valeTransporte: boolean;
  ajudaCusto: boolean;
  valorAjudaCusto: number;
  contratos?: Contrato[];
  distratos?: Distrato[];
  ferias?: FeriasType[];
};

export const funcionarios = {
  list: (params?: { ativo?: boolean; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.ativo != null) sp.set('ativo', String(params.ativo));
    if (params?.q) sp.set('q', params.q);
    const qs = sp.toString();
    return api<Funcionario[]>('/funcionarios' + (qs ? '?' + qs : ''));
  },
  get: (id: string) => api<Funcionario>('/funcionarios/' + id),
  create: (data: Partial<Funcionario> & { nome: string; cpf: string; dataAdmissao: string }) =>
    api<Funcionario>('/funcionarios', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Funcionario>) => api<Funcionario>('/funcionarios/' + id, { method: 'PATCH', body: data }),
  delete: (id: string) => api('/funcionarios/' + id, { method: 'DELETE' }),
};

export type Contrato = {
  id: string;
  funcionarioId: string;
  descricao: string | null;
  dataInicio: string;
  dataVencimento: string;
  loja: string | null;
  cidade: string | null;
  estado: string | null;
  supervisor: string | null;
  arquivoPdf: string | null;
  ativo: boolean;
  funcionario?: { id: string; nome: string; cpf?: string; tipoVinculo?: string };
};

export const contratos = {
  list: (params?: { funcionarioId?: string; estado?: string; cidade?: string; supervisor?: string; ativo?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.funcionarioId) sp.set('funcionarioId', params.funcionarioId);
    if (params?.estado) sp.set('estado', params.estado);
    if (params?.cidade) sp.set('cidade', params.cidade);
    if (params?.supervisor) sp.set('supervisor', params.supervisor);
    if (params?.ativo != null) sp.set('ativo', String(params.ativo));
    const qs = sp.toString();
    return api<Contrato[]>('/contratos' + (qs ? '?' + qs : ''));
  },
  get: (id: string) => api<Contrato>('/contratos/' + id),
  create: (data: FormData) =>
    api<Contrato>('/contratos', { method: 'POST', body: data }),
  update: (id: string, data: FormData) => api<Contrato>('/contratos/' + id, { method: 'PATCH', body: data }),
  delete: (id: string) => api('/contratos/' + id, { method: 'DELETE' }),
};

export type Distrato = {
  id: string;
  funcionarioId: string;
  descricao: string | null;
  dataDistrato: string;
  motivo: string | null;
  funcionario?: { id: string; nome: string; cpf?: string };
};

export const distratos = {
  list: (params?: { funcionarioId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.funcionarioId) sp.set('funcionarioId', params.funcionarioId);
    const qs = sp.toString();
    return api<Distrato[]>('/distratos' + (qs ? '?' + qs : ''));
  },
  get: (id: string) => api<Distrato>('/distratos/' + id),
  create: (data: Partial<Distrato> & { funcionarioId: string; dataDistrato: string }) =>
    api<Distrato>('/distratos', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Distrato>) => api<Distrato>('/distratos/' + id, { method: 'PATCH', body: data }),
  delete: (id: string) => api('/distratos/' + id, { method: 'DELETE' }),
};

export type FeriasType = {
  id: string;
  funcionarioId: string;
  dataInicio: string;
  dataFim: string;
  observacao: string | null;
  funcionario?: { id: string; nome: string; cpf?: string };
};

export const feriasApi = {
  list: (params?: { funcionarioId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.funcionarioId) sp.set('funcionarioId', params.funcionarioId);
    const qs = sp.toString();
    return api<FeriasType[]>('/ferias' + (qs ? '?' + qs : ''));
  },
  get: (id: string) => api<FeriasType>('/ferias/' + id),
  create: (data: Partial<FeriasType> & { funcionarioId: string; dataInicio: string; dataFim: string }) =>
    api<FeriasType>('/ferias', { method: 'POST', body: data }),
  update: (id: string, data: Partial<FeriasType>) => api<FeriasType>('/ferias/' + id, { method: 'PATCH', body: data }),
  delete: (id: string) => api('/ferias/' + id, { method: 'DELETE' }),
};

export type PagamentoItem = {
  folhaFuncionarioId: string;
  funcionario: { id: string; nome: string; cpf: string; chavePix: string | null; funcao: string | null };
  salarioLiquido: number;
  pago: boolean;
  pagamentoId: string | null;
  dataPagamento: string | null;
};

export const pagamentos = {
  listarPorFolha: (folhaId: string) => api<PagamentoItem[]>('/pagamentos/folha/' + folhaId),
  marcarPago: (folhaFuncionarioId: string) => api('/pagamentos/marcar-pago', { method: 'POST', body: { folhaFuncionarioId } }),
  desmarcarPago: (folhaFuncionarioId: string) => api('/pagamentos/desmarcar-pago', { method: 'POST', body: { folhaFuncionarioId } }),
};

export type AlertaContrato = Contrato & {
  funcionario: { id: string; nome: string; tipoVinculo: string };
};

export const alertas = {
  vencimento: () => api<AlertaContrato[]>('/alertas/vencimento'),
};

export type Competencia = { id: string; ano: number; mes: number };
export type FolhaPagamento = {
  id: string;
  competenciaId: string;
  fechada: boolean;
  competencia: Competencia;
  itens: FolhaItem[];
};
export type FolhaItem = {
  id: string;
  funcionarioId: string;
  salarioBruto: number;
  totalProventos: number;
  totalDescontos: number;
  valorInss: number;
  valorIrrf: number;
  salarioLiquido: number;
  funcionario: Funcionario;
  lancamentos: { id: string; valor: number; referencia: string | null; tipoLancamento: { codigo: string; nome: string; tipo: string } }[];
};

export const folha = {
  competencias: () => api<Competencia[]>('/folha/competencias'),
  createCompetencia: (ano: number, mes: number) => api<Competencia>('/folha/competencias', { method: 'POST', body: { ano, mes } }),
  getFolha: (competenciaId: string) => api<FolhaPagamento>('/folha/folha/' + competenciaId),
  gerarFolha: (competenciaId: string) => api<FolhaPagamento>('/folha/folha/' + competenciaId + '/gerar', { method: 'POST' }),
  getItem: (folhaFuncionarioId: string) =>
    api<FolhaItem & { folhaPagamento: { competencia: Competencia }; funcionario: Funcionario }>(
      '/folha/folha-item/' + folhaFuncionarioId
    ),
  addLancamento: (folhaFuncionarioId: string, tipoLancamentoId: string, valor: number, referencia?: string) =>
    api('/folha/folha-item/' + folhaFuncionarioId + '/lancamento', {
      method: 'POST',
      body: { tipoLancamentoId, valor, referencia },
    }),
  removeLancamento: (lancamentoId: string) =>
    api('/folha/folha-item/lancamento/' + lancamentoId, { method: 'DELETE' }),
  fecharFolha: (folhaId: string) => api('/folha/folha/' + folhaId + '/fechar', { method: 'PATCH' }),
};

export const tiposLancamento = {
  list: () =>
    api<{ all: { id: string; codigo: string; nome: string; tipo: string }[]; proventos: { id: string; codigo: string; nome: string }[]; descontos: { id: string; codigo: string; nome: string }[] }>(
      '/tipos-lancamento'
    ),
};

export const importacao = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api<{ sheetName: string; sheets: string[]; headers: unknown[]; rowCount: number; rows: unknown[][] }>('/import/upload', {
      method: 'POST',
      body: fd,
    });
  },
  preview: (headers: unknown[], mapping: Record<string, string>, rows: unknown[][]) =>
    api<{ rows: { nome: string; cpf: string; funcao: string; salario: number; _errors: string[] }[]; errors: string[]; validCount: number }>(
      '/import/preview',
      { method: 'POST', body: { headers, mapping, rows } }
    ),
  confirm: (rows: unknown[], createDeptCargo: boolean, sheetName?: string) =>
    api<{ created: number; updated: number; errors: string[] }>('/import/confirm', {
      method: 'POST',
      body: { rows, createDeptCargo, sheetName },
    }),
};

export const relatorios = {
  totais: (folhaId: string) =>
    api<{ totalProventos: number; totalDescontos: number; totalLiquido: number; totalInss: number; totalIrrf: number; quantidade: number }>(
      '/relatorios/folha/' + folhaId + '/totais'
    ),
  async downloadHoleritePdf(folhaFuncionarioId: string): Promise<void> {
    const token = getToken();
    const res = await fetch(API + '/relatorios/holerite/' + folhaFuncionarioId + '/pdf', {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    });
    if (!res.ok) throw new Error('Falha ao gerar PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'holerite.pdf';
    a.click();
    URL.revokeObjectURL(url);
  },
  async downloadExcel(folhaId: string): Promise<void> {
    const token = getToken();
    const res = await fetch(API + '/relatorios/folha/' + folhaId + '/export/excel', {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    });
    if (!res.ok) throw new Error('Falha ao exportar Excel');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'folha.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  },
};
