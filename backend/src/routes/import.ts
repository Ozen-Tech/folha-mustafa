import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import {
  parseExcelBuffer,
  previewImport,
  applyImport,
  type ColumnMapping,
  type ImportRow,
} from '../services/excelImportService.js';

const router = Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) cb(null, true);
    else cb(new Error('Apenas arquivos .xlsx ou .xls'));
  },
});

router.use(authMiddleware);

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const buffer = fs.readFileSync(req.file.path);
    const { sheets, rows } = parseExcelBuffer(buffer);
    fs.unlinkSync(req.file.path);
    const firstSheet = sheets[0];
    const data = rows[firstSheet] || [];
    const headers = (data[0] as unknown[]) || [];
    const dataRows = data.slice(1) as unknown[][];
    return res.json({
      sheetName: firstSheet,
      sheets,
      headers,
      rowCount: dataRows.length,
      rows: dataRows,
    });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao ler planilha' });
  }
});

router.post('/preview', (req, res) => {
  const { headers, mapping, rows: bodyRows } = req.body as {
    sheetName?: string;
    headers: unknown[];
    mapping: ColumnMapping;
    rows?: unknown[][];
  };
  if (!headers?.length || !mapping) {
    return res.status(400).json({ error: 'headers e mapping obrigatórios' });
  }
  const rows: unknown[][] = [headers];
  if (Array.isArray(bodyRows) && bodyRows.length) {
    bodyRows.forEach((r) => rows.push(r));
  }
  const result = previewImport(rows, mapping);
  return res.json({
    ...result,
    rows: result.rows.map((r) => ({
      nome: r.nome,
      cpf: r.cpf,
      email: r.email,
      dataAdmissao: r.dataAdmissao,
      cargo: r.cargo,
      salario: r.salario,
      banco: r.banco,
      agencia: r.agencia,
      conta: r.conta,
      valeTransporte: r.valeTransporte,
      _errors: r._errors,
    })),
  });
});

router.post('/confirm', async (req, res) => {
  const { sheetName, rows, createDeptCargo } = req.body as {
    sheetName: string;
    rows: ImportRow[];
    createDeptCargo?: boolean;
  };
  if (!rows?.length) return res.status(400).json({ error: 'Nenhuma linha para importar' });
  const result = await applyImport(sheetName || 'Plan1', rows, !!createDeptCargo);
  return res.json(result);
});

export { router as importRouter };
