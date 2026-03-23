# BookShelf
*Because your reading life deserves better than a notes app.*

---

I'm an avid reader. Always have been. But somewhere between juggling three different apps, losing track of recommendations, and spending 20 minutes deciding what to read next, the joy was getting lost in the admin.

Goodreads felt like a social network I didn't ask for. Notion trackers felt like homework. And none of them could answer the one question I always had: *"What should I read next?"*

So I did what any developer with an AI obsession would do — I built my own. BookShelf is the reading companion I always wanted. Clean, fast, and smart enough to recommend your next favourite book based on your mood, the authors you love, and the genres you actually enjoy reading at 11pm.

---

## What's working

**Book Search**
Search millions of books instantly via Google Books. Find exactly what you're looking for and save it in one click.

**Your Shelf**
Two simple lists — Want to Read and Already Read. No noise, no social pressure. Just your books.

**AI Book Discovery**
The main event. Tell AI your mood, your favourite authors, how long you want the book to be, and what genre you're feeling. Get 5 handpicked recommendations in seconds. Add any of them to your shelf instantly.

**Daily Reading Habit Tracker**
Build your reading streak with a 30-day calendar view. See your consistency at a glance and keep the momentum going.

**Reviews & Star Ratings**
Rate every book you finish and write a review while it's still fresh. Your shelf, your opinions.

**Reading Progress Tracker**
Log your progress by pages or percentage. Always know exactly where you left off and how far you've come.

**Book Clubs & Shared Shelves**
Read together. Share a shelf with friends, see what they're reading, and discover books through people whose taste you actually trust.

**Auth**
Secure sign up and sign in. Your shelf is yours alone.

---

## Try it live
[book-shelf-client-ruby.vercel.app](https://book-shelf-client-ruby.vercel.app)

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database + Auth | Supabase (Postgres) |
| Book Search | Google Books API |
| AI | OpenRouter (Gemma / Mistral free tier) |
| Hosting | Railway (backend) + Vercel (frontend) |

## Running locally

```bash
# 1. Clone
git clone https://github.com/varungupta04/BookShelf.git
cd BookShelf

# 2. Install
npm install

# 3. Environment variables

# Create server/.env
SUPABASE_URL=your_value
SUPABASE_ANON_KEY=your_value
OPENROUTER_API_KEY=your_value

# Create client/.env
VITE_SUPABASE_URL=your_value
VITE_SUPABASE_ANON_KEY=your_value
VITE_GOOGLE_BOOKS_API_KEY=your_value
VITE_API_URL=your_railway_backend_url

# 4. Run
npm run dev

# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

---

*Feedback, issues, and feature requests welcome.*
