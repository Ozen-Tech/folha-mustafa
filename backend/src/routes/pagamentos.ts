import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/folha/:folhaId', async (req, res) => {
  const itens = await prisma.folhaFuncionario.findMany({
    where: { folhaPagamentoId: req.params.folhaId },
    include: {
      funcionario: { select: { id: true, nome: true, cpf: true, chavePix: true, funcao: true } },
      pagamentos: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  const result = itens.map((item) => ({
    folhaFuncionarioId: item.id,
    funcionario: item.funcionario,
    salarioLiquido: item.salarioLiquido,
    pago: item.pagamentos.length > 0 && item.pagamentos[0].pago,
    pagamentoId: item.pagamentos[0]?.id ?? null,
    dataPagamento: item.pagamentos[0]?.dataPagamento ?? null,
  }));
  return res.json(result);
});

router.post('/marcar-pago', async (req, res) => {
  const { folhaFuncionarioId } = req.body;
  if (!folhaFuncionarioId) return res.status(400).json({ error: 'folhaFuncionarioId obrigatório' });
  const existing = await prisma.pagamento.findFirst({
    where: { folhaFuncionarioId, pago: true },
  });
  if (existing) return res.json(existing);
  const pagamento = await prisma.pagamento.create({
    data: {
      folhaFuncionarioId,
      pago: true,
      dataPagamento: new Date(),
    },
  });
  return res.status(201).json(pagamento);
});

router.post('/desmarcar-pago', async (req, res) => {
  const { folhaFuncionarioId } = req.body;
  if (!folhaFuncionarioId) return res.status(400).json({ error: 'folhaFuncionarioId obrigatório' });
  await prisma.pagamento.deleteMany({
    where: { folhaFuncionarioId },
  });
  return res.json({ ok: true });
});

export { router as pagamentosRouter };
