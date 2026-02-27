import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { funcionarioId } = req.query;
  const where: Record<string, unknown> = {};
  if (funcionarioId) where.funcionarioId = String(funcionarioId);
  const list = await prisma.ferias.findMany({
    where,
    orderBy: { dataInicio: 'desc' },
    include: { funcionario: { select: { id: true, nome: true, cpf: true } } },
  });
  return res.json(list);
});

router.get('/:id', async (req, res) => {
  const f = await prisma.ferias.findUnique({
    where: { id: req.params.id },
    include: { funcionario: true },
  });
  if (!f) return res.status(404).json({ error: 'Férias não encontradas' });
  return res.json(f);
});

router.post('/', async (req, res) => {
  const { funcionarioId, dataInicio, dataFim, observacao } = req.body;
  if (!funcionarioId || !dataInicio || !dataFim) {
    return res.status(400).json({ error: 'Funcionário, data de início e data de fim são obrigatórios' });
  }
  const created = await prisma.ferias.create({
    data: {
      funcionarioId,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      observacao: observacao || null,
    },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
  return res.status(201).json(created);
});

router.patch('/:id', async (req, res) => {
  const body = req.body;
  const updated = await prisma.ferias.update({
    where: { id: req.params.id },
    data: {
      ...(body.dataInicio && { dataInicio: new Date(body.dataInicio) }),
      ...(body.dataFim && { dataFim: new Date(body.dataFim) }),
      ...(body.observacao !== undefined && { observacao: body.observacao }),
    },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await prisma.ferias.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export { router as feriasRouter };
