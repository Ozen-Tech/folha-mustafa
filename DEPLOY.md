# 🚀 Guia de Deploy - Folha Mustafá

Este documento contém todas as instruções para fazer deploy da aplicação no Render.

## 📋 Estrutura da Aplicação

- **Backend**: Web Service (Node.js/Express)
- **Frontend**: Static Site (React/Vite)
- **Database**: PostgreSQL

---

## 🔧 Configuração do Backend (Web Service)

### Variáveis de Ambiente

No dashboard do Render, acesse o serviço do **backend** e configure:

**Settings** → **Environment** → Adicione:

```
DATABASE_URL=postgresql://user:password@dpg-xxx-a/database_name
JWT_SECRET=seu-secret-jwt-super-seguro
FRONTEND_ORIGIN=https://folha-mustafa-front.onrender.com
NODE_ENV=production
```

### ⚠️ Importante sobre DATABASE_URL

- **Em PRODUÇÃO (Render)**: Use a **Internal Database URL** (sem `.oregon-postgres.render.com`)
  - Exemplo: `postgresql://user:pass@dpg-xxx-a/db`
  
- **Em DESENVOLVIMENTO LOCAL**: Use a **External Database URL** (com `.oregon-postgres.render.com`)
  - Exemplo: `postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/db`

### Build & Deploy Settings

- **Root Directory**: `backend`
- **Build Command**: `npm install --include=dev && npx prisma generate && npm run build`
- **Start Command**: `npm start`

⚠️ **IMPORTANTE**: O `--include=dev` garante que as devDependencies (tipos TypeScript) sejam instaladas durante o build.

### Primeira Configuração do Banco

Após criar o banco PostgreSQL no Render, você precisa:

1. Conectar via SSH ou usar o Shell do Render
2. Executar os comandos:

```bash
cd backend
npx prisma db push
npm run db:seed
```

---

## 🎨 Configuração do Frontend (Static Site)

### Variáveis de Ambiente

No dashboard do Render, acesse o serviço do **frontend** e configure:

**Settings** → **Environment** → Adicione:

```
VITE_API_URL=https://folha-mustafa.onrender.com
```

⚠️ **IMPORTANTE**: 
- **SEM** `/api` no final
- **SEM** aspas
- **COM** `https://`

### Build & Deploy Settings

- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### ⚠️ Deploy Manual Obrigatório

Após adicionar ou modificar variáveis `VITE_*`, você **DEVE** fazer um **Manual Deploy** porque essas variáveis só são aplicadas durante o build!

---

## 🔐 Credenciais Padrão

Após rodar o seed, você pode fazer login com:

1. **Admin Principal:**
   - Email: `admin@mustafa.com`
   - Senha: `admin123`

2. **Usuário Teste:**
   - Email: `teste@mustafa.com`
   - Senha: `teste123`

3. **Admin Mustafá:**
   - Email: `mustafa@mustafa.com`
   - Senha: `mustafa123`

---

## 🧪 Verificação Pós-Deploy

### Backend

Teste se o backend está funcionando:

```bash
curl https://folha-mustafa.onrender.com/api/health
```

Deve retornar: `{"ok":true}`

### Frontend

1. Acesse: `https://folha-mustafa-front.onrender.com`
2. Abra o Console do navegador (F12)
3. Digite:

```javascript
console.log(import.meta.env.VITE_API_URL)
```

Deve mostrar: `https://folha-mustafa.onrender.com`

Se mostrar `undefined`, a variável não foi aplicada no build. Faça um novo deploy manual.

---

## 💻 Desenvolvimento Local

### Backend

1. Copie a **External Database URL** do Render
2. Crie o arquivo `backend/.env`:

```bash
DATABASE_URL="postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/db"
JWT_SECRET="seu-secret-local"
FRONTEND_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

3. Instale dependências e rode:

```bash
cd backend
npm install
npm run dev
```

### Frontend

1. Crie o arquivo `frontend/.env` (opcional para local):

```bash
VITE_API_URL=http://localhost:4000
```

2. Instale dependências e rode:

```bash
cd frontend
npm install
npm run dev
```

O Vite já está configurado com proxy para `/api` apontar para `http://localhost:4000`.

---

## 🐛 Troubleshooting

### Erro 404 no Frontend

**Problema**: Frontend tentando acessar `https://folha-mustafa-front.onrender.com/api/...`

**Solução**:
1. Verifique se `VITE_API_URL` está configurada no Render
2. Faça **Manual Deploy** do frontend
3. Verifique no console do navegador se a variável está sendo lida

### Erro "Cannot GET /"

**Problema**: Acessando a raiz do backend

**Solução**: Isso é normal! O backend não tem rota na raiz. Use os endpoints específicos:
- `/api/health` - Health check
- `/api/auth/login` - Login
- etc.

### Erro de Conexão com Banco

**Problema**: `Can't reach database server`

**Solução**:
- **Em produção**: Use Internal Database URL
- **Em local**: Use External Database URL
- Verifique se o banco está rodando no Render

### CORS Error

**Problema**: Erro de CORS no navegador

**Solução**: Verifique se `FRONTEND_ORIGIN` está configurada corretamente no backend com a URL do frontend (sem barra no final).

---

## 📝 Checklist de Deploy

### Backend
- [ ] Variável `DATABASE_URL` configurada (Internal URL)
- [ ] Variável `JWT_SECRET` configurada
- [ ] Variável `FRONTEND_ORIGIN` configurada
- [ ] Variável `NODE_ENV=production` configurada
- [ ] Root Directory = `backend`
- [ ] Build Command configurado
- [ ] Start Command = `npm start`
- [ ] Banco de dados criado e seed executado

### Frontend
- [ ] Variável `VITE_API_URL` configurada (URL pública do backend)
- [ ] Root Directory = `frontend`
- [ ] Build Command configurado
- [ ] Publish Directory = `dist`
- [ ] **Manual Deploy** feito após configurar variáveis

### Testes
- [ ] Backend responde em `/api/health`
- [ ] Frontend consegue fazer login
- [ ] Console do navegador não mostra erros 404
- [ ] Variável `VITE_API_URL` está sendo lida corretamente

---

## 🔗 URLs de Produção

- **Backend**: `https://folha-mustafa.onrender.com`
- **Frontend**: `https://folha-mustafa-front.onrender.com`
- **API Health**: `https://folha-mustafa.onrender.com/api/health`

---

## 📚 Recursos Úteis

- [Documentação do Render](https://render.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Última atualização**: 2026-02-11

