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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_shelf_updated_at 
  BEFORE UPDATE ON shelf 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
