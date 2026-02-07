import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (_, res) => {
  const list = await prisma.parametroFolha.findMany({ orderBy: [{ ano: 'desc' }, { tipo: 'asc' }] });
  return res.json(list);
});

router.get('/inss/:ano', async (req, res) => {
  const p = await prisma.parametroFolha.findUnique({
    where: { ano_tipo: { ano: Number(req.params.ano), tipo: 'inss' } },
  });
  if (!p) return res.status(404).json({ error: 'Tabela INSS não encontrada' });
  return res.json({ ...p, faixas: JSON.parse(p.faixas) });
});

router.get('/irrf/:ano', async (req, res) => {
  const p = await prisma.parametroFolha.findUnique({
    where: { ano_tipo: { ano: Number(req.params.ano), tipo: 'irrf' } },
  });
  if (!p) return res.status(404).json({ error: 'Tabela IRRF não encontrada' });
  return res.json({ ...p, faixas: JSON.parse(p.faixas) });
});

export { router as parametrosRouter };
