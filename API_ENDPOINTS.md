# 📚 Documentação da API - Folha Mustafá

Base URL: `https://folha-mustafa.onrender.com/api`

---

## 🔐 Autenticação

A maioria dos endpoints requer autenticação via JWT. Envie o token no header:

```
Authorization: Bearer <seu-token>
```

---

## ✅ Health Check

### `GET /api/health`
Verifica se a API está funcionando.

**Resposta:**
```json
{
  "ok": true
}
```

---

## 🔑 Autenticação (`/api/auth`)

### `POST /api/auth/login`
Faz login e retorna o token JWT.

**Body:**
```json
{
  "email": "admin@mustafa.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxxx",
    "email": "admin@mustafa.com",
    "name": "Admin"
  }
}
```

### `GET /api/auth/me`
Retorna os dados do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Resposta:**
```json
{
  "id": "clxxx",
  "email": "admin@mustafa.com",
  "name": "Admin"
}
```

---

## 👥 Funcionários (`/api/funcionarios`)

**Todos os endpoints requerem autenticação.**

### `GET /api/funcionarios`
Lista todos os funcionários.

**Query Parameters:**
- `ativo` (boolean, opcional): Filtrar por status ativo/inativo
- `q` (string, opcional): Buscar por nome ou CPF

**Exemplo:** `GET /api/funcionarios?ativo=true&q=João`

**Resposta:**
```json
[
  {
    "id": "clxxx",
    "nome": "João Silva",
    "cpf": "12345678901",
    "email": "joao@email.com",
    "dataAdmissao": "2024-01-15T00:00:00.000Z",
    "ativo": true,
    "cargoId": "clyyy",
    "banco": "001",
    "agencia": "1234",
    "conta": "56789",
    "valeTransporte": false,
    "cargo": {
      "id": "clyyy",
      "nome": "Desenvolvedor",
      "salarioBase": 5000
    }
  }
]
```

### `GET /api/funcionarios/:id`
Busca um funcionário específico.

**Resposta:**
```json
{
  "id": "clxxx",
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@email.com",
  "dataAdmissao": "2024-01-15T00:00:00.000Z",
  "ativo": true,
  "cargoId": "clyyy",
  "cargo": {
    "id": "clyyy",
    "nome": "Desenvolvedor",
    "salarioBase": 5000
  }
}
```

### `POST /api/funcionarios`
Cria um novo funcionário.

**Body:**
```json
{
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@email.com",
  "dataAdmissao": "2024-01-15",
  "cargoId": "clyyy",
  "banco": "001",
  "agencia": "1234",
  "conta": "56789",
  "valeTransporte": false
}
```

**Campos obrigatórios:** `nome`, `cpf`, `dataAdmissao`, `cargoId`

**Resposta:** `201 Created` com o funcionário criado

### `PATCH /api/funcionarios/:id`
Atualiza um funcionário.

**Body:** (todos os campos são opcionais)
```json
{
  "nome": "João Silva Santos",
  "email": "joao.santos@email.com",
  "ativo": false,
  "cargoId": "clzzz"
}
```

**Resposta:** Funcionário atualizado

### `DELETE /api/funcionarios/:id`
Remove um funcionário.

**Resposta:** `204 No Content`

---

## 💼 Cargos (`/api/cargos`)

**Todos os endpoints requerem autenticação.**

### `GET /api/cargos`
Lista todos os cargos.

**Resposta:**
```json
[
  {
    "id": "clyyy",
    "nome": "Desenvolvedor",
    "salarioBase": 5000
  }
]
```

### `GET /api/cargos/:id`
Busca um cargo específico.

**Resposta:**
```json
{
  "id": "clyyy",
  "nome": "Desenvolvedor",
  "salarioBase": 5000,
  "_count": {
    "funcionarios": 5
  }
}
```

### `POST /api/cargos`
Cria um novo cargo.

**Body:**
```json
{
  "nome": "Desenvolvedor",
  "salarioBase": 5000
}
```

**Campos obrigatórios:** `nome`

**Resposta:** `201 Created` com o cargo criado

### `PATCH /api/cargos/:id`
Atualiza um cargo.

**Body:**
```json
{
  "nome": "Desenvolvedor Senior",
  "salarioBase": 8000
}
```

**Resposta:** Cargo atualizado

### `DELETE /api/cargos/:id`
Remove um cargo (apenas se não houver funcionários vinculados).

**Resposta:** `204 No Content` ou `400 Bad Request` se houver funcionários

---

## 📊 Folha de Pagamento (`/api/folha`)

**Todos os endpoints requerem autenticação.**

### `GET /api/folha/competencias`
Lista todas as competências (ano/mês).

**Resposta:**
```json
[
  {
    "id": "claaa",
    "ano": 2024,
    "mes": 1,
    "folhas": [
      {
        "id": "clbbb",
        "fechada": false,
        "_count": {
          "itens": 10
        }
      }
    ]
  }
]
```

### `POST /api/folha/competencias`
Cria uma nova competência.

**Body:**
```json
{
  "ano": 2024,
  "mes": 1
}
```

**Resposta:** `201 Created` com a competência criada

### `GET /api/folha/folha/:competenciaId`
Busca ou cria a folha de pagamento de uma competência.

**Resposta:**
```json
{
  "id": "clbbb",
  "competenciaId": "claaa",
  "fechada": false,
  "competencia": {
    "id": "claaa",
    "ano": 2024,
    "mes": 1
  },
  "itens": [
    {
      "id": "clccc",
      "funcionarioId": "clxxx",
      "salarioBruto": 5000,
      "totalProventos": 5000,
      "totalDescontos": 1000,
      "valorInss": 500,
      "valorIrrf": 200,
      "salarioLiquido": 3800,
      "funcionario": {
        "id": "clxxx",
        "nome": "João Silva",
        "cargo": {
          "nome": "Desenvolvedor"
        }
      },
      "lancamentos": [
        {
          "id": "clddd",
          "valor": 5000,
          "referencia": "Salário base",
          "tipoLancamento": {
            "codigo": "SALARIO",
            "nome": "Salário",
            "tipo": "provento"
          }
        }
      ]
    }
  ]
}
```

### `POST /api/folha/folha/:competenciaId/gerar`
Gera a folha de pagamento para todos os funcionários ativos.

**Resposta:** Folha completa com todos os itens gerados

### `GET /api/folha/folha-item/:folhaFuncionarioId`
Busca um item específico da folha (holerite).

**Resposta:** Item completo com funcionário, competência e lançamentos

### `POST /api/folha/folha-item/:folhaFuncionarioId/lancamento`
Adiciona um lançamento (provento ou desconto) ao item da folha.

**Body:**
```json
{
  "tipoLancamentoId": "cleee",
  "valor": 500,
  "referencia": "Horas extras"
}
```

**Campos obrigatórios:** `tipoLancamentoId`, `valor`

**Resposta:** `201 Created` com o lançamento criado

### `DELETE /api/folha/folha-item/lancamento/:lancamentoId`
Remove um lançamento da folha.

**Resposta:** `204 No Content`

### `PATCH /api/folha/folha/:folhaId/fechar`
Fecha uma folha de pagamento (impede edições).

**Resposta:** Folha atualizada com `fechada: true`

---

## 📤 Importação (`/api/import`)

**Todos os endpoints requerem autenticação.**

### `POST /api/import/upload`
Faz upload de uma planilha Excel (.xlsx ou .xls).

**Content-Type:** `multipart/form-data`

**Body:** `file` (arquivo Excel)

**Resposta:**
```json
{
  "sheetName": "Plan1",
  "sheets": ["Plan1", "Plan2"],
  "headers": ["Nome", "CPF", "Cargo", "Salário"],
  "rowCount": 10,
  "rows": [
    ["João Silva", "12345678901", "Desenvolvedor", 5000],
    ["Maria Santos", "98765432100", "Designer", 4000]
  ]
}
```

### `POST /api/import/preview`
Faz preview da importação com validação.

**Body:**
```json
{
  "headers": ["Nome", "CPF", "Cargo", "Salário"],
  "mapping": {
    "nome": "Nome",
    "cpf": "CPF",
    "cargo": "Cargo",
    "salario": "Salário"
  },
  "rows": [
    ["João Silva", "12345678901", "Desenvolvedor", 5000]
  ]
}
```

**Resposta:**
```json
{
  "rows": [
    {
      "nome": "João Silva",
      "cpf": "12345678901",
      "cargo": "Desenvolvedor",
      "salario": 5000,
      "_errors": []
    }
  ],
  "errors": [],
  "validCount": 1
}
```

### `POST /api/import/confirm`
Confirma e executa a importação.

**Body:**
```json
{
  "sheetName": "Plan1",
  "rows": [
    {
      "nome": "João Silva",
      "cpf": "12345678901",
      "cargo": "Desenvolvedor",
      "salario": 5000
    }
  ],
  "createDeptCargo": true
}
```

**Resposta:**
```json
{
  "created": 5,
  "updated": 2,
  "errors": []
}
```

---

## 📈 Relatórios (`/api/relatorios`)

**Todos os endpoints requerem autenticação.**

### `GET /api/relatorios/folha/:folhaId/totais`
Retorna os totais de uma folha de pagamento.

**Resposta:**
```json
{
  "totalProventos": 50000,
  "totalDescontos": 10000,
  "totalLiquido": 40000,
  "totalInss": 5000,
  "totalIrrf": 2000,
  "quantidade": 10
}
```

### `GET /api/relatorios/holerite/:folhaFuncionarioId/pdf`
Gera e baixa o holerite em PDF.

**Resposta:** Arquivo PDF para download

### `GET /api/relatorios/folha/:folhaId/export/excel`
Exporta a folha completa em Excel.

**Resposta:** Arquivo .xlsx para download

---

## ⚙️ Parâmetros (`/api/parametros`)

**Todos os endpoints requerem autenticação.**

### `GET /api/parametros`
Lista todos os parâmetros de folha (INSS, IRRF).

**Resposta:**
```json
[
  {
    "id": "clfff",
    "ano": 2024,
    "descricao": "Tabela INSS 2024",
    "tipo": "inss",
    "faixas": "[{\"ate\":1000,\"aliquota\":7.5}]"
  }
]
```

### `GET /api/parametros/inss/:ano`
Busca a tabela INSS de um ano.

**Resposta:**
```json
{
  "id": "clfff",
  "ano": 2024,
  "descricao": "Tabela INSS 2024",
  "tipo": "inss",
  "faixas": [
    {
      "ate": 1000,
      "aliquota": 7.5
    }
  ]
}
```

### `GET /api/parametros/irrf/:ano`
Busca a tabela IRRF de um ano.

**Resposta:** Similar ao INSS, mas com tipo `irrf`

---

## 🏷️ Tipos de Lançamento (`/api/tipos-lancamento`)

**Todos os endpoints requerem autenticação.**

### `GET /api/tipos-lancamento`
Lista todos os tipos de lançamento.

**Resposta:**
```json
{
  "all": [
    {
      "id": "cleee",
      "codigo": "SALARIO",
      "nome": "Salário",
      "tipo": "provento",
      "incideInss": true,
      "incideIrrf": true
    }
  ],
  "proventos": [
    {
      "id": "cleee",
      "codigo": "SALARIO",
      "nome": "Salário"
    }
  ],
  "descontos": []
}
```

---

## 📁 Arquivos Estáticos

### `GET /uploads/:filename`
Acessa arquivos enviados (uploads).

---

## 🔒 Códigos de Status HTTP

- `200 OK` - Sucesso
- `201 Created` - Recurso criado
- `204 No Content` - Sucesso sem conteúdo
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor

---

## 📝 Exemplos de Uso

### Login e obter token:

```bash
curl -X POST https://folha-mustafa.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mustafa.com","password":"admin123"}'
```

### Listar funcionários:

```bash
curl -X GET https://folha-mustafa.onrender.com/api/funcionarios \
  -H "Authorization: Bearer <seu-token>"
```

### Criar funcionário:

```bash
curl -X POST https://folha-mustafa.onrender.com/api/funcionarios \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "12345678901",
    "dataAdmissao": "2024-01-15",
    "cargoId": "clyyy"
  }'
```

---

**Última atualização**: 2026-02-11

