const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') || '/api';

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
  me: () => api<{ id: string; email: string; name: string | null }>('/auth/me'),
};

export const cargos = {
  list: () => api<{ id: string; nome: string; salarioBase: number }[]>('/cargos'),
  get: (id: string) => api<{ id: string; nome: string; salarioBase: number }>('/cargos/' + id),
  create: (data: { nome: string; salarioBase?: number }) => api('/cargos', { method: 'POST', body: data }),
  update: (id: string, data: { nome?: string; salarioBase?: number }) => api('/cargos/' + id, { method: 'PATCH', body: data }),
  delete: (id: string) => api('/cargos/' + id, { method: 'DELETE' }),
};

export type Funcionario = {
  id: string;
  nome: string;
  cpf: string;
  email: string | null;
  dataAdmissao: string;
  ativo: boolean;
  cargoId: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  valeTransporte: boolean;
  cargo?: { id: string; nome: string; salarioBase: number };
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
  create: (data: Partial<Funcionario> & { nome: string; cpf: string; dataAdmissao: string; cargoId: string }) =>
    api<Funcionario>('/funcionarios', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Funcionario>) => api<Funcionario>('/funcionarios/' + id, { method: 'PATCH', body: data }),
  delete: (id: string) => api('/funcionarios/' + id, { method: 'DELETE' }),
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
  funcionario: Funcionario & { cargo: { nome: string } };
  lancamentos: { id: string; valor: number; referencia: string | null; tipoLancamento: { codigo: string; nome: string; tipo: string } }[];
};

export const folha = {
  competencias: () => api<Competencia[]>('/folha/competencias'),
  createCompetencia: (ano: number, mes: number) => api<Competencia>('/folha/competencias', { method: 'POST', body: { ano, mes } }),
  getFolha: (competenciaId: string) => api<FolhaPagamento>('/folha/folha/' + competenciaId),
  gerarFolha: (competenciaId: string) => api<FolhaPagamento>('/folha/folha/' + competenciaId + '/gerar', { method: 'POST' }),
  getItem: (folhaFuncionarioId: string) =>
    api<FolhaItem & { folhaPagamento: { competencia: Competencia }; funcionario: Funcionario & { cargo: { nome: string } } }>(
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
    api<{ rows: { nome: string; cpf: string; cargo: string; salario: number; _errors: string[] }[]; errors: string[]; validCount: number }>(
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
