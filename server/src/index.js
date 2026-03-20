import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';


const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Optional: clients are created even with placeholder envs; routes will validate before use.
const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_ANON_KEY ?? ''
);

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
  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY'].filter(
    (k) => !process.env[k]
  );
  res.json({ ok: missing.length === 0, missing });
});

app.post('/api/ai/recommendations', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(400).json({ error: 'Missing OPENROUTER_API_KEY in server/.env' });
    }

    const { prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Body must include { prompt: string }' });
    }

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const aiResult = await aiResponse.json();
    console.log('OpenRouter response:', JSON.stringify(aiResult));
    if (!aiResult.choices || !aiResult.choices[0]) {
      const errorMsg = aiResult.error?.message || 'AI service unavailable';
      return res.status(429).json({ error: errorMsg });
    }
    const text = aiResult.choices[0].message.content;

    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed', details: String(err) });
  }
});

app.post('/api/recommendations', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(400).json({ error: 'Missing OPENROUTER_API_KEY in server/.env' });
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

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const aiResult = await aiResponse.json();
    console.log('OpenRouter response:', JSON.stringify(aiResult));
    if (!aiResult.choices || !aiResult.choices[0]) {
      const errorMsg = aiResult.error?.message || 'AI service unavailable';
      return res.status(429).json({ error: errorMsg });
    }
    const text = aiResult.choices[0].message.content;

    // Parse JSON response
    let recommendations;
    try {
      // Clean up the response to ensure it's valid JSON
      const cleanText = text.replace(/```json|```/g, '').trim();
      recommendations = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
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
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(400).json({ error: 'Missing OPENROUTER_API_KEY in server/.env' });
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

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const aiResult = await aiResponse.json();
    console.log('OpenRouter response:', JSON.stringify(aiResult));
    if (!aiResult.choices || !aiResult.choices[0]) {
      const errorMsg = aiResult.error?.message || 'AI service unavailable';
      return res.status(429).json({ error: errorMsg });
    }
    const text = aiResult.choices[0].message.content;

    // Parse JSON response
    let recommendations;
    try {
      // Clean up the response to ensure it's valid JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      recommendations = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
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

// Search users by email/username
app.get('/api/friends/search', authenticateUser, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, username')
      .or(`email.ilike.%${q}%,username.ilike.%${q}%`)
      .neq('id', req.user.id)
      .limit(10);

    if (error) {
      console.error('Search users error:', error);
      return res.status(500).json({ error: 'Failed to search users' });
    }

    res.json({ users: data || [] });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send friend request
app.post('/api/friends/request', authenticateUser, async (req, res) => {
  try {
    const { receiver_id } = req.body;
    if (!receiver_id) {
      return res.status(400).json({ error: 'receiver_id is required' });
    }

    if (receiver_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: req.user.id,
        receiver_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Send friend request error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Friend request already exists' });
      }
      return res.status(500).json({ error: 'Failed to send friend request' });
    }

    res.json({ request: data });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get pending incoming requests
app.get('/api/friends/requests/incoming', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        created_at,
        profiles!friend_requests_sender_id_fkey (
          email,
          username
        )
      `)
      .eq('receiver_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get incoming requests error:', error);
      return res.status(500).json({ error: 'Failed to get incoming requests' });
    }

    res.json({ requests: data || [] });
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ error: 'Failed to get incoming requests' });
  }
});

// Accept or decline request
app.put('/api/friends/request/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined' });
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status })
      .eq('id', id)
      .eq('receiver_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Update friend request error:', error);
      return res.status(500).json({ error: 'Failed to update friend request' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ request: data });
  } catch (error) {
    console.error('Update friend request error:', error);
    res.status(500).json({ error: 'Failed to update friend request' });
  }
});

// Get all accepted friends
app.get('/api/friends', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        created_at,
        profiles!friend_requests_sender_id_fkey (
          id,
          email,
          username
        ),
        profiles!friend_requests_receiver_id_fkey (
          id,
          email,
          username
        )
      `)
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get friends error:', error);
      return res.status(500).json({ error: 'Failed to get friends' });
    }

    // Extract friend info from either sender or receiver (whichever is not the current user)
    const friends = (data || []).map(request => {
      if (request.sender_id === req.user.id) {
        return {
          id: request.profiles.friend_requests_receiver_id_fkey.id,
          email: request.profiles.friend_requests_receiver_id_fkey.email,
          username: request.profiles.friend_requests_receiver_id_fkey.username,
          friendship_id: request.id,
          created_at: request.created_at
        };
      } else {
        return {
          id: request.profiles.friend_requests_sender_id_fkey.id,
          email: request.profiles.friend_requests_sender_id_fkey.email,
          username: request.profiles.friend_requests_sender_id_fkey.username,
          friendship_id: request.id,
          created_at: request.created_at
        };
      }
    });

    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`BookShelf server running on http://localhost:${PORT}`);
});

