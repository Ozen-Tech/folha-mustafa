import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { recalcularFolhaFuncionario } from '../services/folhaService.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/competencias', async (_, res) => {
  const list = await prisma.competencia.findMany({
    orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    include: {
      folhas: {
        include: { _count: { select: { itens: true } } },
      },
    },
  });
  return res.json(list);
});

router.post('/competencias', async (req, res) => {
  const { ano, mes } = req.body;
  if (!ano || !mes) return res.status(400).json({ error: 'Ano e mês obrigatórios' });
  const exist = await prisma.competencia.findUnique({ where: { ano_mes: { ano: Number(ano), mes: Number(mes) } } });
  if (exist) return res.status(400).json({ error: 'Competência já existe' });
  const created = await prisma.competencia.create({ data: { ano: Number(ano), mes: Number(mes) } });
  return res.status(201).json(created);
});

router.get('/folha/:competenciaId', async (req, res) => {
  let folha = await prisma.folhaPagamento.findFirst({
    where: { competenciaId: req.params.competenciaId },
    include: {
      competencia: true,
      itens: {
        include: {
          funcionario: true,
          lancamentos: { include: { tipoLancamento: true } },
        },
      },
    },
  });
  if (!folha) {
    const comp = await prisma.competencia.findUnique({ where: { id: req.params.competenciaId } });
    if (!comp) return res.status(404).json({ error: 'Competência não encontrada' });
    folha = await prisma.folhaPagamento.create({
      data: { competenciaId: comp.id },
      include: {
        competencia: true,
        itens: {
          include: {
            funcionario: true,
            lancamentos: { include: { tipoLancamento: true } },
          },
        },
      },
    });
  }
  return res.json(folha);
});

router.post('/folha/:competenciaId/gerar', async (req, res) => {
  const competencia = await prisma.competencia.findUnique({ where: { id: req.params.competenciaId } });
  if (!competencia) return res.status(404).json({ error: 'Competência não encontrada' });
  let folha = await prisma.folhaPagamento.findFirst({ where: { competenciaId: competencia.id } });
  if (!folha) {
    folha = await prisma.folhaPagamento.create({ data: { competenciaId: competencia.id } });
  }
  const funcionarios = await prisma.funcionario.findMany({ where: { ativo: true } });
  const tipoSalario = await prisma.tipoLancamento.findUnique({ where: { codigo: 'SALARIO' } });
  if (!tipoSalario) return res.status(500).json({ error: 'Tipo SALARIO não configurado' });
  for (const f of funcionarios) {
    const existing = await prisma.folhaFuncionario.findFirst({
      where: { folhaPagamentoId: folha.id, funcionarioId: f.id },
    });
    if (existing) continue;
    const ff = await prisma.folhaFuncionario.create({
      data: {
        folhaPagamentoId: folha.id,
        funcionarioId: f.id,
        salarioBruto: f.salario,
        totalProventos: f.salario,
        totalDescontos: 0,
        baseInss: f.salario,
        baseIrrf: f.salario,
        valorInss: 0,
        valorIrrf: 0,
        salarioLiquido: f.salario,
      },
    });
    await prisma.lancamento.create({
      data: {
        folhaFuncionarioId: ff.id,
        tipoLancamentoId: tipoSalario.id,
        valor: f.salario,
        referencia: 'Salário base',
      },
    });
    await recalcularFolhaFuncionario(ff.id);
  }
  const updated = await prisma.folhaPagamento.findUnique({
    where: { id: folha.id },
    include: {
      competencia: true,
      itens: {
        include: {
          funcionario: true,
          lancamentos: { include: { tipoLancamento: true } },
        },
      },
    },
  });
  return res.json(updated);
});

router.get('/folha-item/:folhaFuncionarioId', async (req, res) => {
  const item = await prisma.folhaFuncionario.findUnique({
    where: { id: req.params.folhaFuncionarioId },
    include: {
      funcionario: true,
      folhaPagamento: { include: { competencia: true } },
      lancamentos: { include: { tipoLancamento: true } },
    },
  });
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  return res.json(item);
});

router.post('/folha-item/:folhaFuncionarioId/lancamento', async (req, res) => {
  const { tipoLancamentoId, valor, referencia } = req.body;
  if (!tipoLancamentoId || valor == null) return res.status(400).json({ error: 'Tipo e valor obrigatórios' });
  const ff = await prisma.folhaFuncionario.findUnique({ where: { id: req.params.folhaFuncionarioId } });
  if (!ff) return res.status(404).json({ error: 'Item da folha não encontrado' });
  const lanc = await prisma.lancamento.create({
    data: {
      folhaFuncionarioId: ff.id,
      tipoLancamentoId,
      valor: Number(valor),
      referencia: referencia || null,
    },
    include: { tipoLancamento: true },
  });
  await recalcularFolhaFuncionario(ff.id);
  return res.status(201).json(lanc);
});

router.delete('/folha-item/lancamento/:lancamentoId', async (req, res) => {
  const lanc = await prisma.lancamento.findUnique({
    where: { id: req.params.lancamentoId },
    include: { folhaFuncionario: true },
  });
  if (!lanc) return res.status(404).json({ error: 'Lançamento não encontrado' });
  await prisma.lancamento.delete({ where: { id: lanc.id } });
  await recalcularFolhaFuncionario(lanc.folhaFuncionarioId);
  return res.status(204).send();
});

router.patch('/folha/:folhaId/fechar', async (req, res) => {
  const folha = await prisma.folhaPagamento.update({
    where: { id: req.params.folhaId },
    data: { fechada: true },
  });
  return res.json(folha);
});

export { router as folhaRouter };
