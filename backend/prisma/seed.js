"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const ANO = 2025;
async function main() {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@mustafa.com' },
        update: {},
        create: {
            email: 'admin@mustafa.com',
            password: hash,
            name: 'Administrador',
        },
    });
    const tiposProvento = [
        { codigo: 'SALARIO', nome: 'Salário base', tipo: 'provento', incideInss: true, incideIrrf: true },
        { codigo: 'HE', nome: 'Horas extras', tipo: 'provento', incideInss: true, incideIrrf: true },
        { codigo: 'COMISSAO', nome: 'Comissão', tipo: 'provento', incideInss: true, incideIrrf: true },
        { codigo: 'BONUS', nome: 'Bônus', tipo: 'provento', incideInss: true, incideIrrf: true },
        { codigo: 'OUTROS_PROVENTOS', nome: 'Outros proventos', tipo: 'provento', incideInss: true, incideIrrf: true },
    ];
    const tiposDesconto = [
        { codigo: 'INSS', nome: 'INSS', tipo: 'desconto', incideInss: false, incideIrrf: false },
        { codigo: 'IRRF', nome: 'IRRF', tipo: 'desconto', incideInss: false, incideIrrf: false },
        { codigo: 'VT', nome: 'Vale transporte', tipo: 'desconto', incideInss: false, incideIrrf: false },
        { codigo: 'SAUDE', nome: 'Plano de saúde', tipo: 'desconto', incideInss: false, incideIrrf: false },
        { codigo: 'EMPRESTIMO', nome: 'Empréstimo', tipo: 'desconto', incideInss: false, incideIrrf: false },
        { codigo: 'FALTA', nome: 'Falta / atraso', tipo: 'desconto', incideInss: false, incideIrrf: false },
        { codigo: 'OUTROS_DESCONTOS', nome: 'Outros descontos', tipo: 'desconto', incideInss: false, incideIrrf: false },
    ];
    for (const t of [...tiposProvento, ...tiposDesconto]) {
        await prisma.tipoLancamento.upsert({
            where: { codigo: t.codigo },
            update: {},
            create: t,
        });
    }
    const inss2025 = [
        { ate: 1412, aliquota: 7.5, deducao: 0 },
        { ate: 2666.68, aliquota: 9, deducao: 21.18 },
        { ate: 4000.03, aliquota: 12, deducao: 101.18 },
        { ate: 7786.02, aliquota: 14, deducao: 181.18 },
    ];
    await prisma.parametroFolha.upsert({
        where: { ano_tipo: { ano: ANO, tipo: 'inss' } },
        update: { faixas: JSON.stringify(inss2025) },
        create: {
            ano: ANO,
            descricao: 'Tabela INSS ' + ANO,
            tipo: 'inss',
            faixas: JSON.stringify(inss2025),
        },
    });
    const irrf2025 = [
        { ate: 2112, aliquota: 0, deducao: 0 },
        { ate: 2826.65, aliquota: 7.5, deducao: 158.4 },
        { ate: 3751.05, aliquota: 15, deducao: 370.4 },
        { ate: 4664.68, aliquota: 22.5, deducao: 651.73 },
        { ate: 999999, aliquota: 27.5, deducao: 884.96 },
    ];
    await prisma.parametroFolha.upsert({
        where: { ano_tipo: { ano: ANO, tipo: 'irrf' } },
        update: { faixas: JSON.stringify(irrf2025) },
        create: {
            ano: ANO,
            descricao: 'Tabela IRRF ' + ANO,
            tipo: 'irrf',
            faixas: JSON.stringify(irrf2025),
        },
    });
    console.log('Seed concluído.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
