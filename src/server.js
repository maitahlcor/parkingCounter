import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import vehiclesRoutes from './routes/vehicles.js';
import eventsRoutes from './routes/events.js';
import syncRoutes from './routes/sync.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api', meRoutes);
app.use('/api', vehiclesRoutes);
app.use('/api', eventsRoutes);
app.use('/api/sync', syncRoutes);

const port = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(port, () => console.log(`[api] escuchando en http://localhost:${port}`));
}).catch(err => {
  console.error('Error conectando a Mongo:', err);
  process.exit(1);
});
