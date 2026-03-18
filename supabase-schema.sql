-- Create shelf table
CREATE TABLE IF NOT EXISTS shelf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('want_to_read', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shelf ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own books
CREATE POLICY "Users can view their own books" ON shelf
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own books
CREATE POLICY "Users can insert their own books" ON shelf
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own books
CREATE POLICY "Users can update their own books" ON shelf
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own books
CREATE POLICY "Users can delete their own books" ON shelf
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_shelf_user_id ON shelf(user_id);
CREATE INDEX idx_shelf_status ON shelf(status);
CREATE INDEX idx_shelf_book_id ON shelf(book_id);

-- Create reading_logs table
CREATE TABLE IF NOT EXISTS reading_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Enable Row Level Security
ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for reading logs
CREATE POLICY "Users can view their own reading logs" ON reading_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading logs" ON reading_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading logs" ON reading_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for reading logs
CREATE INDEX idx_reading_logs_user_id ON reading_logs(user_id);
CREATE INDEX idx_reading_logs_date ON reading_logs(log_date);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Users can view their own reviews" ON reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for reviews
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_book_id ON reviews(book_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for shelf
CREATE TRIGGER update_shelf_updated_at 
  BEFORE UPDATE ON shelf 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for reviews
CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON reviews 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
