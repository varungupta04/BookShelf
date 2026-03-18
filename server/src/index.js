import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Optional: clients are created even with placeholder envs; routes will validate before use.
const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_ANON_KEY ?? ''
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'bookshelf-server' });
});

app.get('/api/env-check', (_req, res) => {
  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_API_KEY'].filter(
    (k) => !process.env[k]
  );
  res.json({ ok: missing.length === 0, missing });
});

app.post('/api/ai/recommendations', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Missing GEMINI_API_KEY in server/.env' });
    }

    const { prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Body must include { prompt: string }' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Gemini request failed', details: String(err) });
  }
});

// Example Supabase route (placeholder; verifies env only)
app.get('/api/supabase/ping', async (_req, res) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res
      .status(400)
      .json({ error: 'Missing SUPABASE_URL / SUPABASE_ANON_KEY in server/.env' });
  }

  // Simple no-op call: just returns current timestamp from JS to show route is live.
  // Replace with real queries once you have tables.
  const now = new Date().toISOString();
  res.json({ ok: true, now });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`BookShelf server running on http://localhost:${PORT}`);
});

