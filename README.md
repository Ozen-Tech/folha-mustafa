# Folha de Pagamento — Mustafá

Sistema web para automatizar a folha de pagamento (substituindo o Excel), com:
- Cadastro de funcionários e cargos
- Geração de folha por competência (mês/ano)
- Lançamentos (proventos/descontos) por funcionário
- Cálculo automático de INSS e IRRF (tabelas configuráveis por ano)
- Importação de funcionários via Excel
- Relatórios: totais, exportação Excel e holerite em PDF

## Requisitos
- Node.js (testado com Node 24)

## Backend (API)

### 1) Instalar dependências
```bash
cd backend
npm install
```

### 2) Configurar ambiente
Copie o exemplo e ajuste se necessário:
```bash
cp .env.example .env
```

### 3) Criar banco e seed inicial
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4) Rodar em modo desenvolvimento
```bash
npm run dev
```

API: `http://localhost:4000/api/health`

Credenciais iniciais (seed):
- **Admin**: `admin@mustafa.com` / `admin123`
- **Teste**: `teste@mustafa.com` / `teste123`

## Frontend (Web)

### 1) Instalar dependências
```bash
cd frontend
npm install
```

### 2) Rodar em modo desenvolvimento
```bash
npm run dev
```

Frontend: `http://localhost:5173/`

> O `frontend/vite.config.ts` já faz proxy de `/api` para `http://localhost:4000`.

## Fluxo de uso (rápido)
1. Faça login com o usuário admin
2. Cadastre `Cargos` (ou use **Importar Excel** com criação automática)
3. Cadastre funcionários (ou importe via Excel)
4. Crie uma competência em **Folha de pagamento**
5. Clique em **Gerar/atualizar folha**
6. Use **Detalhar** para adicionar lançamentos e baixar holerite (PDF)
7. Exporte a folha em Excel

## Observações
- As tabelas de INSS/IRRF do seed são um ponto de partida e devem ser revisadas/atualizadas conforme o ano vigente.

