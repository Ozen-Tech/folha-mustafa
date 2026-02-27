import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (_, res) => {
  const list = await prisma.cargo.findMany({ orderBy: { nome: 'asc' } });
  return res.json(list);
});

router.get('/:id', async (req, res) => {
  const c = await prisma.cargo.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { funcionarios: true } } },
  });
  if (!c) return res.status(404).json({ error: 'Cargo não encontrado' });
  return res.json(c);
});

router.post('/', async (req, res) => {
  const { nome, salarioBase } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
  const created = await prisma.cargo.create({
    data: { nome, salarioBase: Number(salarioBase) || 0 },
  });
  return res.status(201).json(created);
});

router.patch('/:id', async (req, res) => {
  const { nome, salarioBase } = req.body;
  const updated = await prisma.cargo.update({
    where: { id: req.params.id },
    data: {
      ...(nome != null && { nome }),
      ...(salarioBase !== undefined && { salarioBase: Number(salarioBase) }),
    },
  });
  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const count = await prisma.funcionario.count({ where: { cargoId: req.params.id } });
  if (count > 0) return res.status(400).json({ error: 'Cargo possui funcionários vinculados' });
  await prisma.cargo.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export { router as cargosRouter };
