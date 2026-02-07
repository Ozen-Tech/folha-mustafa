import express from 'express';
import cors from 'cors';
import path from 'path';
import { authRouter } from './routes/auth.js';
import { funcionariosRouter } from './routes/funcionarios.js';
import { cargosRouter } from './routes/cargos.js';
import { folhaRouter } from './routes/folha.js';
import { importRouter } from './routes/import.js';
import { relatoriosRouter } from './routes/relatorios.js';
import { parametrosRouter } from './routes/parametros.js';
import { tiposLancamentoRouter } from './routes/tiposLancamento.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/funcionarios', funcionariosRouter);
app.use('/api/cargos', cargosRouter);
app.use('/api/folha', folhaRouter);
app.use('/api/import', importRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/parametros', parametrosRouter);
app.use('/api/tipos-lancamento', tiposLancamentoRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
