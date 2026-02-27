import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

const uploadsDir = path.join(process.cwd(), 'uploads', 'contratos');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Apenas arquivos PDF são permitidos'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', async (req, res) => {
  const { funcionarioId, estado, cidade, supervisor, ativo } = req.query;
  const where: Record<string, unknown> = {};
  if (funcionarioId) where.funcionarioId = String(funcionarioId);
  if (estado) where.estado = { contains: String(estado), mode: 'insensitive' };
  if (cidade) where.cidade = { contains: String(cidade), mode: 'insensitive' };
  if (supervisor) where.supervisor = { contains: String(supervisor), mode: 'insensitive' };
  if (ativo !== undefined) where.ativo = ativo === 'true';
  const list = await prisma.contrato.findMany({
    where,
    orderBy: { dataVencimento: 'asc' },
    include: { funcionario: { select: { id: true, nome: true, cpf: true, tipoVinculo: true } } },
  });
  return res.json(list);
});

router.get('/:id', async (req, res) => {
  const c = await prisma.contrato.findUnique({
    where: { id: req.params.id },
    include: { funcionario: true },
  });
  if (!c) return res.status(404).json({ error: 'Contrato não encontrado' });
  return res.json(c);
});

router.post('/', upload.single('arquivo'), async (req, res) => {
  const { funcionarioId, descricao, dataInicio, dataVencimento, loja, cidade, estado, supervisor } = req.body;
  if (!funcionarioId || !dataInicio || !dataVencimento) {
    return res.status(400).json({ error: 'Funcionário, data de início e data de vencimento são obrigatórios' });
  }
  const arquivoPdf = req.file ? `/uploads/contratos/${req.file.filename}` : null;
  const created = await prisma.contrato.create({
    data: {
      funcionarioId,
      descricao: descricao || null,
      dataInicio: new Date(dataInicio),
      dataVencimento: new Date(dataVencimento),
      loja: loja || null,
      cidade: cidade || null,
      estado: estado || null,
      supervisor: supervisor || null,
      arquivoPdf,
    },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
  return res.status(201).json(created);
});

router.patch('/:id', upload.single('arquivo'), async (req, res) => {
  const body = req.body;
  let arquivoPdf: string | undefined = undefined;
  if (req.file) {
    arquivoPdf = `/uploads/contratos/${req.file.filename}`;
    const existing = await prisma.contrato.findUnique({ where: { id: req.params.id } });
    if (existing?.arquivoPdf) {
      const oldPath = path.join(process.cwd(), existing.arquivoPdf);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }
  const updated = await prisma.contrato.update({
    where: { id: req.params.id },
    data: {
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.dataInicio && { dataInicio: new Date(body.dataInicio) }),
      ...(body.dataVencimento && { dataVencimento: new Date(body.dataVencimento) }),
      ...(body.loja !== undefined && { loja: body.loja }),
      ...(body.cidade !== undefined && { cidade: body.cidade }),
      ...(body.estado !== undefined && { estado: body.estado }),
      ...(body.supervisor !== undefined && { supervisor: body.supervisor }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
      ...(arquivoPdf && { arquivoPdf }),
    },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.contrato.findUnique({ where: { id: req.params.id } });
  if (existing?.arquivoPdf) {
    const filePath = path.join(process.cwd(), existing.arquivoPdf);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await prisma.contrato.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export { router as contratosRouter };
