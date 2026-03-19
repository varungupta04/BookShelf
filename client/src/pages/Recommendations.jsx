import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, RefreshCw, Sparkles, Heart, Brain, Laugh, Sword, Lightbulb, Clock, Book, Star, Filter, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { InnerLayout } from '../components/InnerLayout';
import API_URL from '../config';

export function Recommendations() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [addingBook, setAddingBook] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    mood: '',
    genres: [],
    authors: [],
    ageGroup: '',
    bookLength: '',
    format: ''
  });

  const moodOptions = [
    'Thrilling & suspenseful',
    'Heartwarming',
    'Dark & intense',
    'Funny & lighthearted',
    'Inspiring & motivating',
    'Calm & reflective'
  ];

  const genreOptions = [
    'Fiction', 'Non-fiction', 'Fantasy', 'Sci-Fi', 'Romance', 'Mystery',
    'Thriller', 'Biography', 'Self-help', 'History', 'Philosophy', 'Business'
  ];

  const authorOptions = [
    'Stephen King', 'Agatha Christie', 'J.K. Rowling', 'Haruki Murakami',
    'Malcolm Gladwell', 'Yuval Noah Harari', 'James Clear', 'Colleen Hoover',
    'George R.R. Martin', 'Paulo Coelho', 'Toni Morrison', 'Dan Brown'
  ];

  const ageGroupOptions = [
    'Young Adult (13-17)', 'New Adult (18-25)', 'Adult', 'Mature themes only'
  ];

  const bookLengthOptions = [
    'Quick read (under 200 pages)', 'Medium (200-400 pages)', 'Long (400+ pages)', 'Any length'
  ];

  const formatOptions = [
    'Novel', 'Short stories', 'Essays', 'Any'
  ];

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'genres') {
      setFilters(prev => ({
        ...prev,
        genres: prev.genres.includes(value)
          ? prev.genres.filter(g => g !== value)
          : [...prev.genres, value]
      }));
    } else if (filterType === 'authors') {
      setFilters(prev => ({
        ...prev,
        authors: prev.authors.includes(value)
          ? prev.authors.filter(a => a !== value)
          : [...prev.authors, value]
      }));
    } else {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
          setShowFilters(false);
        } else {
          setMessage('No recommendations found. Try adjusting your filters.');
          setRecommendations([]);
        }
      } else {
        setError(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToShelf = async (book) => {
    if (addingBook) return;

    setAddingBook(book.title);
    try {
      if (!user) {
        addToast('Please sign in to add books to your shelf', 'error');
        return;
      }

      const { error } = await supabase
        .from('shelf')
        .insert({
          user_id: user.id,
          book_id: `rec_${Date.now()}_${book.title.replace(/\s+/g, '_')}`,
          title: book.title,
          author: book.author,
          cover_url: null,
          status: 'want_to_read'
        });

      if (error) {
        setError('Failed to add book to shelf');
      } else {
        setRecommendations(prev => prev.filter(rec => rec.title !== book.title));
        addToast(`"${book.title}" added to your Want to Read list!`, 'success');
      }
    } catch (err) {
      setError('Failed to add book to shelf');
      console.error('Error adding book:', err);
    } finally {
      setAddingBook(null);
    }
  };

  const RecommendationCard = ({ book }) => {
    const isLoading = addingBook === book.title;

    return (
      <div className="glass rounded-2xl p-6 border border-white/60 hover:bg-white/70 transition-all duration-200 hover:shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-lg mb-1">{book.title}</h3>
            <p className="text-slate-600 mb-2">by {book.author}</p>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
              {book.genre && <span className="badge">{book.genre}</span>}
              {book.pages && <span>{book.pages}</span>}
            </div>
          </div>
          <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0" />
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-700 leading-relaxed">{book.reason}</p>
        </div>

        <button
          onClick={() => addToShelf(book)}
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            'Adding...'
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to Want to Read
            </>
          )}
        </button>
      </div>
    );
  };

  const FilterSection = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );

  const RadioGroup = ({ options, selected, onChange }) => (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name={options[0]}
            value={option}
            checked={selected === option}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 text-[#1F3A2E] focus:ring-[#1F3A2E]/30"
          />
          <span className="text-sm text-slate-700">{option}</span>
        </label>
      ))}
    </div>
  );

  const CheckboxGroup = ({ options, selected, onChange }) => (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            value={option}
            checked={selected.includes(option)}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 text-[#1F3A2E] focus:ring-[#1F3A2E]/30 rounded"
          />
          <span className="text-sm text-slate-700">{option}</span>
        </label>
      ))}
    </div>
  );

  return (
    <InnerLayout title="AI Recommendations">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Book Discovery Tool</h1>
          <p className="text-slate-600">
            Get personalized book recommendations based on your preferences and reading mood.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-2xl p-4 mb-6 border border-red-100 bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="glass rounded-2xl p-6 mb-8 border border-white/60">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-5 w-5 text-[#1F3A2E]" />
              <h2 className="text-xl font-semibold text-slate-900">Tell us what you're looking for</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Mood */}
              <FilterSection title="Mood">
                <RadioGroup
                  options={moodOptions}
                  selected={filters.mood}
                  onChange={(value) => setFilters(prev => ({ ...prev, mood: value }))}
                />
              </FilterSection>

              {/* Genres */}
              <FilterSection title="Genre">
                <CheckboxGroup
                  options={genreOptions}
                  selected={filters.genres}
                  onChange={(value) => handleFilterChange('genres', value)}
                />
              </FilterSection>

              {/* Authors */}
              <FilterSection title="Popular Authors you like">
                <CheckboxGroup
                  options={authorOptions}
                  selected={filters.authors}
                  onChange={(value) => handleFilterChange('authors', value)}
                />
              </FilterSection>

              {/* Age Group */}
              <FilterSection title="Age group / reading level">
                <RadioGroup
                  options={ageGroupOptions}
                  selected={filters.ageGroup}
                  onChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}
                />
              </FilterSection>

              {/* Book Length */}
              <FilterSection title="Book length">
                <RadioGroup
                  options={bookLengthOptions}
                  selected={filters.bookLength}
                  onChange={(value) => setFilters(prev => ({ ...prev, bookLength: value }))}
                />
              </FilterSection>

              {/* Format */}
              <FilterSection title="Format preference">
                <RadioGroup
                  options={formatOptions}
                  selected={filters.format}
                  onChange={(value) => setFilters(prev => ({ ...prev, format: value }))}
                />
              </FilterSection>
            </div>

            {/* Find Button */}
            <div className="mt-8 text-center">
              <button
                onClick={fetchRecommendations}
                disabled={loading}
                className="btn-primary btn-lg flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  'Finding your books...'
                ) : (
                  <>
                    Find my next book
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="glass rounded-2xl p-8 mb-6 text-center border border-blue-100 bg-blue-50">
            <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No recommendations found</h3>
            <p className="text-slate-600 mb-6">{message}</p>
            <button
              onClick={() => setShowFilters(true)}
              className="btn-primary"
            >
              <Filter className="h-4 w-4" />
              Try Different Filters
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !showFilters && (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Sparkles className="h-12 w-12 text-[#1F3A2E] animate-pulse" />
              <div>
                <p className="text-slate-900 font-medium">AI is finding your perfect books...</p>
                <p className="text-slate-600 text-sm">Analyzing your preferences</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && !showFilters && recommendations.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Your Recommendations</h2>
              <button
                onClick={() => setShowFilters(true)}
                className="btn-ghost text-sm"
              >
                <Filter className="h-4 w-4" />
                Change Filters
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {recommendations.map((book, index) => (
                <RecommendationCard key={`${book.title}-${index}`} book={book} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !showFilters && recommendations.length === 0 && !message && !error && (
          <div className="glass rounded-2xl p-12 text-center">
            <Sparkles className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No recommendations available</h3>
            <p className="text-slate-600 mb-6">
              Try adjusting your filters to get better results.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="btn-primary"
            >
              <Filter className="h-4 w-4" />
              Try Different Filters
            </button>
          </div>
        )}
      </div>
    </InnerLayout>
  );
}
