import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Check, BookOpen, BookMarked } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { InnerLayout } from '../components/InnerLayout';

export function MyShelf() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [wantToRead, setWantToRead] = useState([]);
  const [alreadyRead, setAlreadyRead] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingBook, setAddingBook] = useState(null);
  const [movingBook, setMovingBook] = useState(null);
  const [removingBook, setRemovingBook] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shelf')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      const wantToReadBooks = data.filter(book => book.status === 'want_to_read');
      const readBooks = data.filter(book => book.status === 'read');
      setWantToRead(wantToReadBooks);
      setAlreadyRead(readBooks);
    }
    setLoading(false);
  };

  const searchBooks = useCallback(async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const API_KEY = 'AIzaSyB4Gf99iX1A-CW36ERsSCrvm0PGbeKILFg';
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&orderBy=relevance&printType=books&langRestrict=en&maxResults=20&key=${API_KEY}`
      );
      const data = await response.json();

      if (data.items) {
        // Step 1: Hard filter
        let filteredBooks = data.items || [];
        filteredBooks = filteredBooks.filter(item => {
          const v = item.volumeInfo;
          return v && v.title && v.authors && v.authors.length > 0;
        });

        if (filteredBooks.length === 0) {
          filteredBooks = data.items || [];
        }


        // Step 2: Score each book
        const scoredBooks = filteredBooks.map(item => {
          const volumeInfo = item.volumeInfo;
          let score = 0;

          // Has a valid cover image: +3 points
          if (volumeInfo.imageLinks?.thumbnail) score += 3;

          // Has more than 50 ratings: +2 points
          if (volumeInfo.ratingsCount && volumeInfo.ratingsCount > 50) score += 2;

          // Average rating above 3.5: +2 points
          if (volumeInfo.averageRating && volumeInfo.averageRating > 3.5) score += 2;

          // Published after 1950: +1 point
          const year = volumeInfo.publishedDate?.split('-')[0];
          if (year && parseInt(year) > 1950) score += 1;

          // Has a description longer than 100 characters: +1 point
          if (volumeInfo.description && volumeInfo.description.length > 100) score += 1;

          // Title matches the search query directly: +3 points
          const title = (volumeInfo.title || '').toLowerCase();
          const searchLower = query.toLowerCase();
          if (title.includes(searchLower)) score += 3;

          // Author name is well known: +2 points
          const majorPublishers = ['penguin', 'harpercollins', 'random house', 'simon & schuster', 'macmillan', 'bloomsbury', 'scholastic'];
          if (volumeInfo.publisher && majorPublishers.some(pub => volumeInfo.publisher.toLowerCase().includes(pub))) score += 2;

          return { ...item, score };
        });

        // Step 3: Sort by score descending, take top 6
        scoredBooks.sort((a, b) => b.score - a.score);
        const topBooks = scoredBooks.slice(0, 6);

        // Format for display
        const books = topBooks.map(item => ({
          id: item.id,
          title: item.volumeInfo.title || 'Unknown Title',
          author: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
          year: item.volumeInfo.publishedDate?.split('-')[0] || '',
          cover_url: item.volumeInfo.imageLinks?.thumbnail || null,
          description: item.volumeInfo.description || '',
          pageCount: item.volumeInfo.pageCount || null,
          averageRating: item.volumeInfo.averageRating || null,
          ratingsCount: item.volumeInfo.ratingsCount || null,
          publisher: item.volumeInfo.publisher || '',
          score: item.score
        }));

        setSearchResults(books);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchResults([]);
    }
    setSearchLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBooks(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchBooks]);

  const addToShelf = async (book, status) => {
    if (addingBook) return;

    setAddingBook(book.id);
    try {
      const { error } = await supabase
        .from('shelf')
        .insert({
          user_id: user.id,
          book_id: book.id,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          status,
        });

      if (!error) {
        fetchBooks();
        setSearchResults([]);
        setSearchQuery('');
        addToast(
          status === 'want_to_read'
            ? `"${book.title}" added to your Want to Read list!`
            : `"${book.title}" marked as read!`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error adding book:', error);
      addToast('Failed to add book to shelf', 'error');
    } finally {
      setAddingBook(null);
    }
  };

  const moveBook = async (bookId, newStatus) => {
    if (movingBook) return;

    setMovingBook(bookId);
    try {
      const { error } = await supabase
        .from('shelf')
        .update({ status: newStatus })
        .eq('id', bookId);

      if (!error) {
        fetchBooks();
        const book = [...wantToRead, ...alreadyRead].find(b => b.id === bookId);
        addToast(
          newStatus === 'read'
            ? `"${book.title}" marked as read!`
            : `"${book.title}" moved to Want to Read!`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error moving book:', error);
      addToast('Failed to move book', 'error');
    } finally {
      setMovingBook(null);
    }
  };

  const removeBook = async (bookId) => {
    if (!confirm('Are you sure you want to remove this book from your shelf?')) return;
    if (removingBook) return;

    setRemovingBook(bookId);
    try {
      const { error } = await supabase
        .from('shelf')
        .delete()
        .eq('id', bookId);

      if (!error) {
        fetchBooks();
        const book = [...wantToRead, ...alreadyRead].find(b => b.id === bookId);
        addToast(`"${book.title}" removed from your shelf`, 'success');
      }
    } catch (error) {
      console.error('Error removing book:', error);
      addToast('Failed to remove book', 'error');
    } finally {
      setRemovingBook(null);
    }
  };

  const BookCard = ({ book, onAdd, onMove, onRemove, showActions = true, isSearchResult = false }) => {
    const isAdding = addingBook === book.id;
    const isMoving = movingBook === book.id;
    const isRemoving = removingBook === book.id;

    // Render star rating
    const renderStars = (rating) => {
      if (!rating) return null;
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;

      for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
          stars.push(<span key={i} className="text-yellow-400">★</span>);
        } else if (i === fullStars && hasHalfStar) {
          stars.push(<span key={i} className="text-yellow-400">★</span>);
        } else {
          stars.push(<span key={i} className="text-slate-300">★</span>);
        }
      }
      return <div className="flex items-center gap-1">{stars}</div>;
    };

    // Truncate description
    const truncateDescription = (description, maxLength = 120) => {
      if (!description) return '';
      if (description.length <= maxLength) return description;
      return description.substring(0, maxLength) + '...';
    };

    return (
      <div className={`glass rounded-xl p-4 flex gap-4 transition-all duration-200 ${isSearchResult ? 'hover:bg-white/70 hover:shadow-lg border-2 border-dashed border-slate-300' : 'hover:bg-white/50'
        }`}>
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-16 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <BookOpen className="h-6 w-6 text-slate-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate mb-1">{book.title}</h3>
          <p className="text-sm text-slate-600 truncate mb-1">
            {book.author}
            {book.year && <span className="text-slate-500"> • {book.year}</span>}
            {book.pageCount && <span className="text-slate-500"> • {book.pageCount} pages</span>}
          </p>

          {/* Description for search results */}
          {isSearchResult && book.description && (
            <p className="text-xs text-slate-600 mb-2 line-clamp-2">
              {truncateDescription(book.description)}
            </p>
          )}

          {/* Rating for search results */}
          {isSearchResult && book.averageRating && (
            <div className="flex items-center gap-2 mb-2">
              {renderStars(book.averageRating)}
              {book.ratingsCount && (
                <span className="text-xs text-slate-500">({book.ratingsCount.toLocaleString()})</span>
              )}
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 flex-wrap">
              {onAdd && (
                <>
                  <button
                    onClick={() => onAdd(book, 'want_to_read')}
                    disabled={isAdding}
                    className="btn-primary text-xs px-2 py-1 disabled:opacity-50"
                  >
                    {isAdding ? (
                      'Adding...'
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Want to Read
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onAdd(book, 'read')}
                    disabled={isAdding}
                    className="btn-ghost text-xs px-2 py-1 disabled:opacity-50"
                  >
                    {isAdding ? (
                      'Adding...'
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Already Read
                      </>
                    )}
                  </button>
                </>
              )}
              {onMove && (
                <>
                  <button
                    onClick={() => onMove(book.id, book.status === 'want_to_read' ? 'read' : 'want_to_read')}
                    disabled={isMoving}
                    className="btn-ghost text-xs px-2 py-1 disabled:opacity-50"
                  >
                    {isMoving ? (
                      'Moving...'
                    ) : book.status === 'want_to_read' ? (
                      <>
                        <Check className="h-3 w-3" />
                        Mark as Read
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3 w-3" />
                        Move to Want to Read
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onRemove(book.id)}
                    disabled={isRemoving}
                    className="btn-ghost text-xs px-2 py-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {isRemoving ? (
                      'Removing...'
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Remove
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <InnerLayout title="My Shelf">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A2E] mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your bookshelf...</p>
          </div>
        </div>
      </InnerLayout>
    );
  }

  return (
    <InnerLayout title="My Shelf">
      <div className="max-w-4xl mx-auto">
        {/* Search Section */}
        <div className="glass rounded-2xl p-6 mb-8 border border-white/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for books (min. 3 characters)..."
              className="w-full pl-10 pr-3 py-3 border border-white/60 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]/30 focus:border-transparent"
              autoFocus={wantToRead.length === 0 && alreadyRead.length === 0}
            />
          </div>

          {searchLoading && (
            <div className="mt-4 text-center text-slate-600 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1F3A2E]"></div>
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-slate-900 mb-3">Search Results</h3>
              {searchResults.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAdd={addToShelf}
                  isSearchResult={true}
                />
              ))}
            </div>
          )}

          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <div className="mt-4 text-center text-slate-600 py-4">
              <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              {searchQuery.length < 3 ? (
                <>
                  <p>Type at least 3 characters to search</p>
                  <p className="text-sm text-slate-500 mt-1">Keep typing to see results</p>
                </>
              ) : (
                <>
                  <p>No books found for "{searchQuery}"</p>
                  <p className="text-sm text-slate-500 mt-1">Try a different title or author name</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Want to Read Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-[#1F3A2E]" />
            <h2 className="text-xl font-semibold text-slate-900">Want to Read</h2>
            <span className="badge">{wantToRead.length}</span>
          </div>

          {wantToRead.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-white/60">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Your "Want to Read" list is empty</h3>
              <p className="text-slate-600 mb-6">Start building your reading list by searching for books above!</p>
              <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                <Search className="h-4 w-4" />
                Try searching for your favorite books or authors
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {wantToRead.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onMove={moveBook}
                  onRemove={removeBook}
                />
              ))}
            </div>
          )}
        </div>

        {/* Already Read Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookMarked className="h-5 w-5 text-[#1F3A2E]" />
            <h2 className="text-xl font-semibold text-slate-900">Already Read</h2>
            <span className="badge">{alreadyRead.length}</span>
          </div>

          {alreadyRead.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-white/60">
              <BookMarked className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No books marked as read yet</h3>
              <p className="text-slate-600 mb-6">Move books from "Want to Read" when you finish them!</p>
              {wantToRead.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                  <Check className="h-4 w-4" />
                  You have {wantToRead.length} book{wantToRead.length === 1 ? '' : 's'} waiting to be read
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {alreadyRead.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onMove={moveBook}
                  onRemove={removeBook}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </InnerLayout>
  );
}
