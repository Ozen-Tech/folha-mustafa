import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

function formatCpf(value: string): string {
  const digits = (value || '').replace(/\D/g, '');
  return digits.length === 11 ? digits : value;
}

router.get('/', async (req, res) => {
  const { ativo, q } = req.query;
  const where: Record<string, unknown> = {};
  if (ativo !== undefined) where.ativo = ativo === 'true';
  if (q) {
    where.OR = [
      { nome: { contains: String(q), mode: 'insensitive' } },
      { cpf: { contains: String(q).replace(/\D/g, '') } },
    ];
  }
  const list = await prisma.funcionario.findMany({
    where,
    orderBy: { nome: 'asc' },
    include: { cargo: { select: { id: true, nome: true, salarioBase: true } } },
  });
  return res.json(list);
});

router.get('/:id', async (req, res) => {
  const f = await prisma.funcionario.findUnique({
    where: { id: req.params.id },
    include: { cargo: true },
  });
  if (!f) return res.status(404).json({ error: 'Funcionário não encontrado' });
  return res.json(f);
});

router.post('/', async (req, res) => {
  const { nome, cpf, email, dataAdmissao, cargoId, banco, agencia, conta, valeTransporte } = req.body;
  if (!nome || !cpf || !dataAdmissao || !cargoId) {
    return res.status(400).json({ error: 'Nome, CPF, data de admissão e cargo são obrigatórios' });
  }
  const cpfClean = formatCpf(cpf);
  if (cpfClean.length !== 11) return res.status(400).json({ error: 'CPF inválido' });
  const existing = await prisma.funcionario.findUnique({ where: { cpf: cpfClean } });
  if (existing) return res.status(400).json({ error: 'CPF já cadastrado' });
  const created = await prisma.funcionario.create({
    data: {
      nome,
      cpf: cpfClean,
      email: email || null,
      dataAdmissao: new Date(dataAdmissao),
      cargoId,
      banco: banco || null,
      agencia: agencia || null,
      conta: conta || null,
      valeTransporte: Boolean(valeTransporte),
    },
    include: { cargo: { select: { id: true, nome: true, salarioBase: true } } },
  });
  return res.status(201).json(created);
});

router.patch('/:id', async (req, res) => {
  const body = req.body;
  if (body.cpf) body.cpf = formatCpf(body.cpf);
  if (body.dataAdmissao) body.dataAdmissao = new Date(body.dataAdmissao);
  const updated = await prisma.funcionario.update({
    where: { id: req.params.id },
    data: {
      ...(body.nome != null && { nome: body.nome }),
      ...(body.cpf != null && { cpf: body.cpf }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.dataAdmissao != null && { dataAdmissao: body.dataAdmissao }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
      ...(body.cargoId != null && { cargoId: body.cargoId }),
      ...(body.banco !== undefined && { banco: body.banco }),
      ...(body.agencia !== undefined && { agencia: body.agencia }),
      ...(body.conta !== undefined && { conta: body.conta }),
      ...(body.valeTransporte !== undefined && { valeTransporte: body.valeTransporte }),
    },
    include: { cargo: { select: { id: true, nome: true, salarioBase: true } } },
  });
  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await prisma.funcionario.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export { router as funcionariosRouter };
