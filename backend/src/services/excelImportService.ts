import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ColumnMapping = Record<string, string>;

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

function cleanCpf(value: unknown): string {
  const s = String(value ?? '').replace(/\D/g, '');
  return s.length === 11 ? s : String(value ?? '');
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number' && value > 0) return new Date((value - 25569) * 86400 * 1000);
  const s = String(value ?? '').trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export interface ImportRow {
  nome: string;
  cpf: string;
  email?: string;
  dataAdmissao: Date | null;
  funcao: string;
  salario: number;
  chavePix?: string;
  tipoVinculo?: string;
  valeTransporte: boolean;
  _raw: Record<string, unknown>;
  _errors: string[];
}

export function mapRow(
  row: unknown[],
  headerRow: unknown[],
  mapping: ColumnMapping
): ImportRow {
  const get = (key: string): unknown => {
    const col = mapping[key];
    if (col === undefined || col === null) return undefined;
    let i: number;
    if (typeof col === 'number' && Number.isInteger(col)) {
      i = col;
    } else if (typeof col === 'string' && col.length <= 2 && /^[A-Za-z]$/.test(col)) {
      i = col.toUpperCase().charCodeAt(0) - 65;
    } else {
      i = headerRow.findIndex((h) => String(h).toLowerCase().trim() === String(col).toLowerCase().trim());
      if (i < 0) i = headerRow.findIndex((h) => String(h).toLowerCase().trim() === String(key).toLowerCase().trim());
    }
    if (i >= 0 && i < row.length) return row[i];
    return undefined;
  };
  const errors: string[] = [];
  const nome = String(get('nome') ?? '').trim();
  if (!nome) errors.push('Nome obrigatório');
  const cpf = cleanCpf(get('cpf'));
  if (cpf.length !== 11) errors.push('CPF inválido');
  const salario = Number(get('salario')) || 0;
  if (salario < 0) errors.push('Salário inválido');
  const dataAdmissao = parseDate(get('dataAdmissao'));
  if (!dataAdmissao) errors.push('Data de admissão inválida');
  const funcao = String(get('funcao') ?? '').trim();
  const raw: Record<string, unknown> = {};
  headerRow.forEach((h, i) => {
    if (row[i] !== undefined && row[i] !== '') raw[String(h)] = row[i];
  });
  return {
    nome,
    cpf,
    email: String(get('email') ?? '').trim() || undefined,
    dataAdmissao,
    funcao,
    salario,
    chavePix: String(get('chavePix') ?? '').trim() || undefined,
    tipoVinculo: String(get('tipoVinculo') ?? '').trim() || undefined,
    valeTransporte: /^(1|true|sim|s|x)$/i.test(String(get('valeTransporte') ?? '')),
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
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const mapped = mapRow(row, header, mapping);
    importRows.push(mapped);
    if (mapped._errors.length) errors.push(`Linha ${i + 1}: ${mapped._errors.join(', ')}`);
  }
  const validCount = importRows.filter((r) => r._errors.length === 0).length;
  return { rows: importRows, errors, validCount };
}

export async function applyImport(
  _sheetName: string,
  importRows: ImportRow[],
  _createDeptCargo: boolean
): Promise<{ created: number; updated: number; errors: string[] }> {
  const created = { count: 0 };
  const updated = { count: 0 };
  const errors: string[] = [];
  const validRows = importRows.filter((r) => r._errors.length === 0);

  for (const row of validRows) {
    try {
      const existing = await prisma.funcionario.findUnique({ where: { cpf: row.cpf } });
      const data = {
        nome: row.nome,
        cpf: row.cpf,
        email: row.email ?? null,
        dataAdmissao: row.dataAdmissao!,
        salario: row.salario,
        funcao: row.funcao || null,
        chavePix: row.chavePix ?? null,
        tipoVinculo: row.tipoVinculo || 'CLT',
        valeTransporte: row.valeTransporte,
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
