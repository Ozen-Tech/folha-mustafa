import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ColumnMapping = Record<string, string>; // excel column letter/index -> our field key

const DEFAULT_FIELDS = [
  'nome',
  'cpf',
  'email',
  'dataAdmissao',
  'cargo',
  'salario',
  'banco',
  'agencia',
  'conta',
  'valeTransporte',
] as const;

export function parseExcelBuffer(buffer: Buffer): { sheets: string[]; rows: Record<string, unknown[][]> } {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheets = workbook.SheetNames;
  const rows: Record<string, unknown[][]> = {};
  for (const name of sheets) {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
    rows[name] = data;
  }
  return { sheets, rows };
}

function cleanCpfCnpj(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s || s === '−' || s === '-') return '';
  const digits = s.replace(/\D/g, '');
  if (digits.length === 11 || digits.length === 14) return digits;
  return '';
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number' && value > 0) {
    return new Date((value - 25569) * 86400 * 1000);
  }
  const s = String(value ?? '').trim();
  if (!s || s === '−' || s === '-') return null;
  
  // Tenta formato MM/DD/YYYY (americano)
  const partsSlash = s.split('/');
  if (partsSlash.length === 3) {
    const [m, d, y] = partsSlash.map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 1900) {
      return new Date(y, m - 1, d);
    }
  }
  
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseCurrency(value: unknown): number {
  if (typeof value === 'number') return value;
  const s = String(value ?? '').trim();
  if (!s || s === '−' || s === '-') return 0;
  // Remove "R$", espaços e trata vírgula como decimal
  const cleaned = s.replace(/R\$\s*/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function normalizeHeader(h: string): string {
  return String(h ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export interface ImportRow {
  nome: string;
  cpf: string;
  email?: string;
  dataAdmissao: Date | null;
  cargo: string;
  salario: number;
  chavePix?: string;
  tipoVinculo?: string;
  ajudaCusto: boolean;
  valorAjudaCusto: number;
  _raw: Record<string, unknown>;
  _errors: string[];
}

const HEADER_ALIASES: Record<string, string[]> = {
  nome: ['nome promotor', 'nome', 'funcionario', 'colaborador', 'promotor'],
  cpf: ['cpf x cnpj', 'cpf', 'cnpj', 'cpf/cnpj', 'documento'],
  tipoVinculo: ['clt x contrato', 'tipo vinculo', 'vinculo', 'tipo', 'clt/contrato'],
  dataAdmissao: ['data de contratacao', 'data contratacao', 'data admissao', 'admissao', 'contratacao'],
  salario: ['pagamento', 'salario', 'valor', 'remuneracao'],
  ajudaCusto: ['ajuda de custo', 'ajuda custo', 'auxilio'],
  chavePix: ['pix', 'chave pix', 'chavepix'],
};

function findColumnIndex(headerRow: unknown[], fieldName: string): number {
  const aliases = HEADER_ALIASES[fieldName] || [fieldName];
  for (const alias of aliases) {
    const idx = headerRow.findIndex((h) => normalizeHeader(String(h)) === normalizeHeader(alias));
    if (idx >= 0) return idx;
  }
  for (const alias of aliases) {
    const idx = headerRow.findIndex((h) => normalizeHeader(String(h)).includes(normalizeHeader(alias)));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function mapRow(
  row: unknown[],
  headerRow: unknown[],
  mapping: ColumnMapping
): ImportRow {
  const getByField = (fieldName: string): unknown => {
    // Primeiro tenta pelo mapping explícito
    const col = mapping[fieldName];
    if (col !== undefined && col !== null && col !== '') {
      let i: number;
      if (typeof col === 'number') {
        i = col;
      } else if (typeof col === 'string' && col.length <= 2 && /^[A-Za-z]+$/.test(col)) {
        i = col.toUpperCase().charCodeAt(0) - 65;
      } else {
        i = headerRow.findIndex((h) => normalizeHeader(String(h)) === normalizeHeader(col));
      }
      if (i >= 0 && i < row.length) return row[i];
    }
    
    // Se não, tenta encontrar automaticamente pelos aliases
    const idx = findColumnIndex(headerRow, fieldName);
    if (idx >= 0 && idx < row.length) return row[idx];
    
    return undefined;
  };

  const errors: string[] = [];
  
  // Nome
  const nomeRaw = String(getByField('nome') ?? '').trim();
  const nome = (nomeRaw === '−' || nomeRaw === '-') ? '' : nomeRaw;
  if (!nome) errors.push('Nome obrigatório');
  
  // CPF/CNPJ
  const cpf = cleanCpfCnpj(getByField('cpf'));
  if (!cpf) errors.push('CPF/CNPJ inválido');
  
  // Salário (PAGAMENTO)
  const salario = parseCurrency(getByField('salario'));
  
  // Data de admissão
  const dataAdmissao = parseDate(getByField('dataAdmissao'));
  if (!dataAdmissao) errors.push('Data de contratação inválida');
  
  // Tipo de vínculo (CLT X CONTRATO)
  const tipoVinculoRaw = String(getByField('tipoVinculo') ?? '').trim().toUpperCase();
  let tipoVinculo = 'CONTRATO';
  if (tipoVinculoRaw === 'CLT') {
    tipoVinculo = 'CLT';
  } else if (tipoVinculoRaw.includes('PJ') || tipoVinculoRaw.includes('CNPJ')) {
    tipoVinculo = 'PJ';
  }
  
  // Ajuda de custo
  const valorAjudaCusto = parseCurrency(getByField('ajudaCusto'));
  const ajudaCusto = valorAjudaCusto > 0;
  
  // Chave PIX
  const chavePix = String(getByField('chavePix') ?? '').trim();
  const chavePixFinal = (chavePix === '−' || chavePix === '-' || !chavePix) ? undefined : chavePix;
  
  // Raw data para debug
  const raw: Record<string, unknown> = {};
  headerRow.forEach((h, i) => {
    if (row[i] !== undefined && row[i] !== '') raw[String(h)] = row[i];
  });

  return {
    nome,
    cpf,
    dataAdmissao,
    funcao: 'Promotor',
    salario,
    chavePix: chavePixFinal,
    tipoVinculo,
    ajudaCusto,
    valorAjudaCusto,
    _raw: raw,
    _errors: errors,
  };
}

export function previewImport(
  rows: unknown[][],
  mapping: ColumnMapping
): { rows: ImportRow[]; errors: string[]; validCount: number } {
  if (rows.length < 2) return { rows: [], errors: ['Planilha deve ter linha de cabeçalho e ao menos uma linha de dados'], validCount: 0 };
  const header = rows[0] as unknown[];
  const importRows: ImportRow[] = [];
  const errors: string[] = [];
  const seenCpfs = new Set<string>();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    
    // Pula linhas vazias ou com dados inválidos
    const hasContent = row.some((cell) => {
      const s = String(cell ?? '').trim();
      return s && s !== '−' && s !== '-';
    });
    if (!hasContent) continue;
    
    const mapped = mapRow(row, header, mapping);
    
    // Ignora duplicatas na mesma importação (mesmo CPF)
    if (mapped.cpf && seenCpfs.has(mapped.cpf)) {
      continue;
    }
    if (mapped.cpf) seenCpfs.add(mapped.cpf);
    
    importRows.push(mapped);
    if (mapped._errors.length) errors.push(`Linha ${i + 1}: ${mapped._errors.join(', ')}`);
  }
  const validCount = importRows.filter((r) => r._errors.length === 0).length;
  return { rows: importRows, errors, validCount };
}

export async function applyImport(
  sheetName: string,
  importRows: ImportRow[],
  createDeptCargo: boolean
): Promise<{ created: number; updated: number; errors: string[] }> {
  const created = { count: 0 };
  const updated = { count: 0 };
  const errors: string[] = [];
  const validRows = importRows.filter((r) => r._errors.length === 0);
  const cargoCache = new Map<string, string>();

  for (const row of validRows) {
    try {
      let cargoId = cargoCache.get(row.cargo);
      if (!cargoId && row.cargo) {
        let cargo = await prisma.cargo.findFirst({ where: { nome: row.cargo } });
        if (!cargo && createDeptCargo) {
          cargo = await prisma.cargo.create({ data: { nome: row.cargo, salarioBase: row.salario } });
        } else if (!cargo) {
          cargo = await prisma.cargo.create({ data: { nome: row.cargo, salarioBase: row.salario } });
        }
        if (cargo) {
          cargoId = cargo.id;
          cargoCache.set(row.cargo, cargo.id);
        }
      }
      if (!cargoId) {
        errors.push(`${row.nome}: cargo "${row.cargo}" não encontrado`);
        continue;
      }

      const existing = await prisma.funcionario.findUnique({ where: { cpf: row.cpf } });
      const data = {
        nome: row.nome,
        cpf: row.cpf,
        email: row.email ?? null,
        dataAdmissao: row.dataAdmissao!,
        salario: row.salario,
        funcao: row.funcao || 'Promotor',
        chavePix: row.chavePix ?? null,
        tipoVinculo: row.tipoVinculo || 'CONTRATO',
        ajudaCusto: row.ajudaCusto,
        valorAjudaCusto: row.valorAjudaCusto,
      };
      if (existing) {
        await prisma.funcionario.update({ where: { id: existing.id }, data });
        updated.count++;
      } else {
        await prisma.funcionario.create({ data });
        created.count++;
      }
    } catch (e) {
      errors.push(`${row.nome}: ${e instanceof Error ? e.message : 'Erro ao importar'}`);
    }
  }

  return { created: created.count, updated: updated.count, errors };
}
