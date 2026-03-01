import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './types';
import { scanRoute } from './routes/scan';
import { reportRoute } from './routes/report';
import { badgeRoute } from './routes/badge';
import { compareRoute } from './routes/compare';

const app = new Hono<{ Bindings: Bindings }>();

// ── CORS ──
app.use(
  '/api/*',
  cors({
    origin: ['https://scan.zovo.dev', '*'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  }),
);

// ── Health Check ──
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '1.0.0' });
});

// ── Mount Routes ──
app.route('/api/scan', scanRoute);
app.route('/api/report', reportRoute);
app.route('/api/badge', badgeRoute);
app.route('/api/compare', compareRoute);

export default app;
