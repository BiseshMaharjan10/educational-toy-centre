import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import prisma from './config/prisma';   

const app: Application = express();

// ── Security & utility middleware ────────────────────────────────
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────────
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database connection check
app.get('/api/v1/db-check', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ database: 'connected' });
  } catch (error) {
    res.status(500).json({ database: 'failed', error: String(error) });
  }
});

export default app;