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
  const list = await prisma.distrato.findMany({
    where,
    orderBy: { dataDistrato: 'desc' },
    include: { funcionario: { select: { id: true, nome: true, cpf: true } } },
  });
  return res.json(list);
});

router.get('/:id', async (req, res) => {
  const d = await prisma.distrato.findUnique({
    where: { id: req.params.id },
    include: { funcionario: true },
  });
  if (!d) return res.status(404).json({ error: 'Distrato não encontrado' });
  return res.json(d);
});

router.post('/', async (req, res) => {
  const { funcionarioId, descricao, dataDistrato, motivo } = req.body;
  if (!funcionarioId || !dataDistrato) {
    return res.status(400).json({ error: 'Funcionário e data do distrato são obrigatórios' });
  }
  const created = await prisma.distrato.create({
    data: {
      funcionarioId,
      descricao: descricao || null,
      dataDistrato: new Date(dataDistrato),
      motivo: motivo || null,
    },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
  return res.status(201).json(created);
});

router.patch('/:id', async (req, res) => {
  const body = req.body;
  const updated = await prisma.distrato.update({
    where: { id: req.params.id },
    data: {
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.dataDistrato && { dataDistrato: new Date(body.dataDistrato) }),
      ...(body.motivo !== undefined && { motivo: body.motivo }),
    },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await prisma.distrato.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export { router as distratosRouter };
