import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (_, res) => {
  const list = await prisma.tipoLancamento.findMany({
    orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }],
  });
  const proventos = list.filter((t) => t.tipo === 'provento');
  const descontos = list.filter((t) => t.tipo === 'desconto');
  return res.json({ all: list, proventos, descontos });
});

export { router as tiposLancamentoRouter };
