import 'dotenv/config';
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

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''));
app.use(
  cors({
    origin: (origin, cb) => {
      const normalized = origin ? origin.replace(/\/$/, '') : '';
      const allowed = !origin || allowedOrigins.some((o) => normalized === o);
      cb(null, allowed ? (origin || allowedOrigins[0]) : false);
    },
    credentials: true,
  })
);
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
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`API rodando em ${url}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Ambiente: PRODUÇÃO`);
  }
});
