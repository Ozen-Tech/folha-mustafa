import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/folha/:folhaId/totais', async (req, res) => {
  const itens = await prisma.folhaFuncionario.findMany({
    where: { folhaPagamentoId: req.params.folhaId },
  });
  const totais = {
    totalProventos: 0,
    totalDescontos: 0,
    totalLiquido: 0,
    totalInss: 0,
    totalIrrf: 0,
    quantidade: itens.length,
  };
  for (const i of itens) {
    totais.totalProventos += i.totalProventos;
    totais.totalDescontos += i.totalDescontos;
    totais.totalLiquido += i.salarioLiquido;
    totais.totalInss += i.valorInss;
    totais.totalIrrf += i.valorIrrf;
  }
  return res.json(totais);
});

router.get('/holerite/:folhaFuncionarioId/pdf', async (req, res) => {
  const ff = await prisma.folhaFuncionario.findUnique({
    where: { id: req.params.folhaFuncionarioId },
    include: {
      funcionario: true,
      folhaPagamento: { include: { competencia: true } },
      lancamentos: { include: { tipoLancamento: true } },
    },
  });
  if (!ff) return res.status(404).json({ error: 'Item não encontrado' });
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="holerite-${ff.funcionario.nome.replace(/\s/g, '-')}-${ff.folhaPagamento.competencia.ano}-${ff.folhaPagamento.competencia.mes}.pdf"`);
  doc.pipe(res);
  const comp = ff.folhaPagamento.competencia;
  const mesNome = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][comp.mes];
  doc.fontSize(18).text('Holerite', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`${mesNome}/${comp.ano}`, { align: 'center' });
  doc.moveDown(1);
  doc.text(`Funcionário: ${ff.funcionario.nome}`, 50, doc.y);
  doc.text(`CPF: ${ff.funcionario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`, 50, doc.y + 15);
  doc.text(`Função: ${ff.funcionario.funcao || '—'}`, 50, doc.y + 30);
  doc.moveDown(2);
  doc.fontSize(11).text('Proventos', 50, doc.y);
  doc.moveDown(0.5);
  for (const l of ff.lancamentos.filter((l) => l.tipoLancamento.tipo === 'provento')) {
    doc.fontSize(10).text(`${l.tipoLancamento.nome}: R$ ${l.valor.toFixed(2)}`, 60, doc.y);
    doc.y += 18;
  }
  doc.text(`Total Proventos: R$ ${ff.totalProventos.toFixed(2)}`, 60, doc.y);
  doc.moveDown(1.5);
  doc.fontSize(11).text('Descontos', 50, doc.y);
  doc.moveDown(0.5);
  for (const l of ff.lancamentos.filter((l) => l.tipoLancamento.tipo === 'desconto')) {
    doc.fontSize(10).text(`${l.tipoLancamento.nome}: R$ ${l.valor.toFixed(2)}`, 60, doc.y);
    doc.y += 18;
  }
  doc.text(`INSS: R$ ${ff.valorInss.toFixed(2)}`, 60, doc.y);
  doc.y += 18;
  doc.text(`IRRF: R$ ${ff.valorIrrf.toFixed(2)}`, 60, doc.y);
  doc.y += 18;
  doc.text(`Total Descontos: R$ ${ff.totalDescontos.toFixed(2)}`, 60, doc.y);
  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').fontSize(12).text(`Líquido: R$ ${ff.salarioLiquido.toFixed(2)}`, 50, doc.y);
  doc.font('Helvetica');
  doc.end();
});

router.get('/folha/:folhaId/export/excel', async (req, res) => {
  const folha = await prisma.folhaPagamento.findUnique({
    where: { id: req.params.folhaId },
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
  if (!folha) return res.status(404).json({ error: 'Folha não encontrada' });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Folha');
  sheet.columns = [
    { header: 'Nome', key: 'nome', width: 25 },
    { header: 'CPF', key: 'cpf', width: 14 },
    { header: 'Função', key: 'funcao', width: 15 },
    { header: 'Proventos', key: 'proventos', width: 12 },
    { header: 'Descontos', key: 'descontos', width: 12 },
    { header: 'Líquido', key: 'liquido', width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const item of folha.itens) {
    sheet.addRow({
      nome: item.funcionario.nome,
      cpf: item.funcionario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      funcao: item.funcionario.funcao || '—',
      proventos: item.totalProventos,
      descontos: item.totalDescontos,
      liquido: item.salarioLiquido,
    });
  }
  const buf = await workbook.xlsx.writeBuffer();
  const comp = folha.competencia;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="folha-${comp.ano}-${comp.mes}.xlsx"`);
  res.send(Buffer.from(buf));
});

export { router as relatoriosRouter };
