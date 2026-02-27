import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/vencimento', async (_, res) => {
  const hoje = new Date();
  const em7dias = new Date();
  em7dias.setDate(em7dias.getDate() + 7);

  const contratos = await prisma.contrato.findMany({
    where: {
      ativo: true,
      dataVencimento: { lte: em7dias, gte: hoje },
      funcionario: { tipoVinculo: 'PJ' },
    },
    include: {
      funcionario: { select: { id: true, nome: true, tipoVinculo: true } },
    },
    orderBy: { dataVencimento: 'asc' },
  });
  return res.json(contratos);
});

export { router as alertasRouter };
