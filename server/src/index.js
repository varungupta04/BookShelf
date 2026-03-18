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

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

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

app.post('/api/recommendations', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Missing GEMINI_API_KEY in server/.env' });
    }

    const filters = req.body;

    // Build prompt from filters
    let prompt = "You are a book recommendation expert. Recommend exactly 5 books based on these preferences:\n";

    if (filters.mood) {
      prompt += `- Mood: ${filters.mood}\n`;
    }

    if (filters.genres && filters.genres.length > 0) {
      prompt += `- Genres: ${filters.genres.join(', ')}\n`;
    }

    if (filters.authors && filters.authors.length > 0) {
      prompt += `- Authors they enjoy: ${filters.authors.join(', ')}\n`;
    }

    if (filters.ageGroup) {
      prompt += `- Age group: ${filters.ageGroup}\n`;
    }

    if (filters.bookLength) {
      prompt += `- Book length: ${filters.bookLength}\n`;
    }

    if (filters.format) {
      prompt += `- Format: ${filters.format}\n`;
    }

    prompt += `\nReturn ONLY a valid JSON array with no markdown, no explanation, no code blocks. Just the raw JSON array.
Format exactly like this:
[{"title":"Book Title","author":"Author Name","genre":"Genre","pages":"~300 pages","reason":"Two sentence explanation of why this fits their preferences perfectly."}]`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON response
    let recommendations;
    try {
      // Clean up the response to ensure it's valid JSON
      const cleanText = text.replace(/```json|```/g, '').trim();
      recommendations = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return res.status(500).json({
        error: 'Failed to parse recommendations',
        details: 'Invalid JSON response from AI'
      });
    }

    res.json({ recommendations });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to get recommendations', details: String(err) });
  }
});

app.post('/api/recommendations/auth', authenticateUser, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Missing GEMINI_API_KEY in server/.env' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(400).json({ error: 'Missing SUPABASE credentials in server/.env' });
    }

    const { mood } = req.body;
    const userId = req.user.id;

    // Fetch user's read books
    const { data: readBooks, error: fetchError } = await supabase
      .from('shelf')
      .select('title, author')
      .eq('user_id', userId)
      .eq('status', 'read');

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch user books', details: fetchError.message });
    }

    let prompt;

    if (mood) {
      // Mood-based recommendations
      prompt = `Recommend 5 books for someone who says: "${mood}". Return ONLY a JSON array with this exact structure:
      [
        {
          "title": "Book Title",
          "author": "Author Name", 
          "genre": "Genre",
          "reason": "2 sentence explanation of why this fits the mood"
        }
      ]
      Do not include any other text or formatting, just the JSON array.`;
    } else if (!readBooks || readBooks.length === 0) {
      return res.json({
        recommendations: [],
        message: 'Start reading some books first to get personalized recommendations!'
      });
    } else {
      // Library-based recommendations
      const bookTitles = readBooks.map(book => `${book.title} by ${book.author}`).join(', ');
      const bookCount = readBooks.length;

      if (bookCount >= 5) {
        prompt = `Based on these books the user enjoyed: ${bookTitles}. Recommend 5 books they would love. Return ONLY a JSON array with this exact structure:
        [
          {
            "title": "Book Title",
            "author": "Author Name", 
            "genre": "Genre",
            "reason": "2 sentence explanation of why they would like this book"
          }
        ]
        Do not include any other text or formatting, just the JSON array.`;
      } else {
        // For 1-4 books, use those books plus popular genres
        prompt = `The user has enjoyed these few books: ${bookTitles}. Based on these preferences and popular genres, recommend 5 books they would love. Return ONLY a JSON array with this exact structure:
        [
          {
            "title": "Book Title",
            "author": "Author Name", 
            "genre": "Genre",
            "reason": "2 sentence explanation of why they would like this book"
          }
        ]
        Do not include any other text or formatting, just the JSON array.`;
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON response
    let recommendations;
    try {
      // Clean up the response to ensure it's valid JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      recommendations = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return res.status(500).json({
        error: 'Failed to parse recommendations',
        details: 'Invalid JSON response from AI'
      });
    }

    res.json({ recommendations });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to get recommendations', details: String(err) });
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

