import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './types';
import { scanRoutes } from './routes/scan';
import { reportRoutes } from './routes/report';
import { badgeRoutes } from './routes/badge';
import { compareRoutes } from './routes/compare';

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  }),
);

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '1.0.0' });
});

app.route('/api/scan', scanRoutes);
app.route('/api/report', reportRoutes);
app.route('/api/badge', badgeRoutes);
app.route('/api/compare', compareRoutes);

export default app;
