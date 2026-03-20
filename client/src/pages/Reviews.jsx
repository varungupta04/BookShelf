import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star as StarIcon, Edit, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { InnerLayout } from '../components/InnerLayout';

export function Reviews() {
  const { user } = useAuth();
  const [readBooks, setReadBooks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReadBooksAndReviews();
  }, []);

  const fetchReadBooksAndReviews = async () => {
    setLoading(true);
    try {
      // Fetch read books
      const { data: shelfData } = await supabase
        .from('shelf')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'read')
        .order('created_at', { ascending: false });

      if (shelfData) {
        setReadBooks(shelfData);

        // Fetch existing reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('user_id', user.id);

        if (reviewsData) {
          const reviewsMap = {};
          reviewsData.forEach(review => {
            reviewsMap[review.book_id] = review;
          });
          setReviews(reviewsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, interactive = true }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange(star)}
            disabled={!interactive}
            className={`transition-colors ${interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
              }`}
          >
            <StarIcon
              className={`h-5 w-5 ${star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-slate-300'
                }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleAddReview = async (book) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          book_id: book.book_id,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          rating: newReview.rating,
          review_text: newReview.text
        });

      if (!error) {
        setNewReview({ rating: 5, text: '' });
        await fetchReadBooksAndReviews();
      }
    } catch (error) {
      console.error('Error adding review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: editingReview.rating,
          review_text: editingReview.text
        })
        .eq('id', reviewId);

      if (!error) {
        setEditingReview(null);
        await fetchReadBooksAndReviews();
      }
    } catch (error) {
      console.error('Error updating review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (!error) {
        await fetchReadBooksAndReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const BookReviewCard = ({ book }) => {
    const review = reviews[book.book_id];
    const isEditing = editingReview?.id === review?.id;
    const isAddingNew = !review && newReview.bookId === book.book_id;

    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex gap-4">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-28 bg-slate-200 rounded-lg flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">{book.title}</h3>
            <p className="text-sm text-slate-600 mb-3">by {book.author}</p>

            {review ? (
              // Existing review
              <div>
                {isEditing ? (
                  // Edit form
                  <div className="space-y-3">
                    <StarRating
                      rating={editingReview.rating}
                      onRatingChange={(rating) => setEditingReview({ ...editingReview, rating })}
                    />
                    <textarea
                      value={editingReview.text}
                      onChange={(e) => setEditingReview({ ...editingReview, text: e.target.value })}
                      className="w-full p-3 border border-white/60 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]/30 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Share your thoughts about this book..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateReview(review.id)}
                        disabled={submitting}
                        className="btn-primary text-sm"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingReview(null)}
                        className="btn-ghost text-sm"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display review
                  <div>
                    <StarRating rating={review.rating} interactive={false} />
                    <p className="text-slate-700 mt-2 mb-3">{review.review_text}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingReview({
                          id: review.id,
                          rating: review.rating,
                          text: review.review_text
                        })}
                        className="btn-ghost text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="btn-ghost text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Add new review
              <div>
                {isAddingNew ? (
                  <div className="space-y-3">
                    <StarRating
                      rating={newReview.rating}
                      onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                    />
                    <textarea
                      value={newReview.text}
                      onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                      className="w-full p-3 border border-white/60 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]/30 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Share your thoughts about this book..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddReview(book)}
                        disabled={submitting || !newReview.text.trim()}
                        className="btn-primary text-sm"
                      >
                        <Check className="h-4 w-4" />
                        Submit Review
                      </button>
                      <button
                        onClick={() => setNewReview({ rating: 5, text: '', bookId: null })}
                        className="btn-ghost text-sm"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewReview({ rating: 5, text: '', bookId: book.book_id })}
                    className="btn-primary text-sm"
                  >
                    <Star className="h-4 w-4" />
                    Add Review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7F2]">
        <div className="flex">
          <aside className="w-56 min-h-screen bg-[#1C2B22] fixed left-0 top-14">
            <div className="p-6">
            </div>
          </aside>
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-slate-600">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <InnerLayout title="Reviews">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reviews</h1>
          <p className="text-slate-600">
            Share your thoughts and ratings for books you've read.
          </p>
        </div>

        {/* Reviews List */}
        {readBooks.length === 0 ? (
          <div className="card text-center">
            <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No books to review yet</h3>
            <p className="text-slate-600 mb-6">
              Mark books as "Read" in your shelf to start reviewing them.
            </p>
            <Link to="/shelf" className="btn-primary">
              Go to My Shelf
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {readBooks.map((book) => (
              <BookReviewCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </InnerLayout>
  );
}
