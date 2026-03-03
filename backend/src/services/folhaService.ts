import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Faixa {
  ate: number;
  aliquota: number;
  deducao?: number;
}

async function getParametroFallback(tipo: 'inss' | 'irrf', ano: number) {
  let p = await prisma.parametroFolha.findUnique({
    where: { ano_tipo: { ano, tipo } },
  });
  if (p) return p;
  const disponivel = await prisma.parametroFolha.findFirst({
    where: { tipo },
    orderBy: { ano: 'desc' },
  });
  if (disponivel) return disponivel;
  throw new Error(`Tabela ${tipo.toUpperCase()} não encontrada para ano ${ano} (nenhuma tabela cadastrada)`);
}

export async function getParametroInss(ano: number): Promise<Faixa[]> {
  const p = await getParametroFallback('inss', ano);
  return JSON.parse(p.faixas) as Faixa[];
}

export async function getParametroIrrf(ano: number): Promise<Faixa[]> {
  const p = await getParametroFallback('irrf', ano);
  return JSON.parse(p.faixas) as Faixa[];
}

const TETO_INSS = 7786.02;

export function calcularInss(base: number, faixas: Faixa[]): number {
  if (base <= 0) return 0;
  let restante = Math.min(base, TETO_INSS);
  let total = 0;
  let faixaAnteriorAte = 0;
  for (const faixa of faixas) {
    const ate = Math.min(faixa.ate, TETO_INSS);
    if (restante <= 0) break;
    const baseFaixa = Math.min(restante, ate - faixaAnteriorAte);
    if (baseFaixa <= 0) break;
    total += (baseFaixa * faixa.aliquota) / 100;
    restante -= baseFaixa;
    faixaAnteriorAte = ate;
  }
  return Math.round(total * 100) / 100;
}

export function calcularIrrf(base: number, dependentes: number, faixas: Faixa[]): number {
  const deducaoPorDependente = 189.59;
  const baseCalculo = Math.max(0, base - dependentes * deducaoPorDependente);
  if (baseCalculo <= 0) return 0;
  for (let i = faixas.length - 1; i >= 0; i--) {
    if (baseCalculo > faixas[i].ate) {
      const deducao = faixas[i].deducao ?? 0;
      return Math.round(((baseCalculo * faixas[i].aliquota) / 100 - deducao) * 100) / 100;
    }
  }
  return 0;
}

export async function recalcularFolhaFuncionario(
  folhaFuncionarioId: string
): Promise<{ totalProventos: number; totalDescontos: number; baseInss: number; valorInss: number; baseIrrf: number; valorIrrf: number; salarioLiquido: number }> {
  const ff = await prisma.folhaFuncionario.findUnique({
    where: { id: folhaFuncionarioId },
    include: {
      lancamentos: { include: { tipoLancamento: true } },
      funcionario: true,
      folhaPagamento: { include: { competencia: true } },
    },
  });
  if (!ff) throw new Error('Folha do funcionário não encontrada');
  const ano = ff.folhaPagamento.competencia.ano;
  const mes = ff.folhaPagamento.competencia.mes;
  const funcionario = ff.funcionario;

  let totalProventos = 0;
  let totalDescontos = 0;
  let baseInss = 0;
  let baseIrrf = 0;

  for (const lanc of ff.lancamentos) {
    const valor = lanc.valor;
    const tipo = lanc.tipoLancamento;
    if (tipo.tipo === 'provento') {
      totalProventos += valor;
      if (tipo.incideInss) baseInss += valor;
      if (tipo.incideIrrf) baseIrrf += valor;
    } else {
      totalDescontos += valor;
    }
  }

  const salarioBruto = totalProventos;
  
  // Calcula INSS e IRRF apenas se o funcionário tiver os descontos habilitados
  let valorInss = 0;
  let valorIrrf = 0;

  if (funcionario.descontoInss) {
    const faixasInss = await getParametroInss(ano);
    valorInss = calcularInss(baseInss, faixasInss);
  }

  if (funcionario.descontoIrrf) {
    const faixasIrrf = await getParametroIrrf(ano);
    valorIrrf = calcularIrrf(baseIrrf, funcionario.dependentesIrrf ?? 0, faixasIrrf);
  }

  // Aplicar descontos do sistema de ponto (preparado para integração futura)
  if (funcionario.descontosAtivos) {
    const descontosPonto = await prisma.descontoPonto.findMany({
      where: {
        funcionarioId: funcionario.id,
        competenciaAno: ano,
        competenciaMes: mes,
        aplicado: false,
      },
    });

    for (const desconto of descontosPonto) {
      totalDescontos += desconto.valor;
      await prisma.descontoPonto.update({
        where: { id: desconto.id },
        data: { aplicado: true },
      });
    }
  }

  totalDescontos += valorInss + valorIrrf;
  const salarioLiquido = Math.round((salarioBruto - totalDescontos) * 100) / 100;

  await prisma.folhaFuncionario.update({
    where: { id: folhaFuncionarioId },
    data: {
      salarioBruto,
      totalProventos,
      totalDescontos,
      baseInss,
      valorInss,
      baseIrrf,
      valorIrrf,
      salarioLiquido,
    },
  });

  return {
    totalProventos,
    totalDescontos,
    baseInss,
    valorInss,
    baseIrrf,
    valorIrrf,
    salarioLiquido,
  };
}
