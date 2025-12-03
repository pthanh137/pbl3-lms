/**
 * CourseReviewForm Component
 * Allows students to create or update their review for a course
 * 
 * Props:
 * - initialRating: number | null
 * - initialComment: string | ""
 * - onSubmit({ rating, comment }): Promise | void
 * - onDelete?(): Promise | void
 * - disabled?: boolean
 */
import { useState, useEffect } from 'react';

const CourseReviewForm = ({ 
  initialRating = null, 
  initialComment = "", 
  onSubmit, 
  onDelete,
  disabled = false 
}) => {
  const [rating, setRating] = useState(initialRating || 0);
  const [comment, setComment] = useState(initialComment || "");

  useEffect(() => {
    if (initialRating !== null) {
      setRating(initialRating);
    }
    if (initialComment) {
      setComment(initialComment);
    }
  }, [initialRating, initialComment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      alert('Please select a rating (1-5 stars)');
      return;
    }
    try {
      await onSubmit({ rating, comment: comment.trim() });
      // Optionally reset form if creating new review
      if (!initialRating) {
        setRating(0);
        setComment("");
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.detail || 'Failed to submit review. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }
    try {
      await onDelete();
      setRating(0);
      setComment("");
    } catch (error) {
      console.error('Error deleting review:', error);
      alert(error.response?.data?.detail || 'Failed to delete review. Please try again.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">
        {initialRating ? "Update your review" : "Write a review"}
      </h3>
      
      {/* Rating input stars */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => !disabled && setRating(star)}
            disabled={disabled}
            className="text-2xl transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={star <= rating ? "text-yellow-400" : "text-slate-300"}>
              ★
            </span>
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-slate-600 ml-2">
            {rating} {rating === 1 ? 'star' : 'stars'}
          </span>
        )}
      </div>

      {/* Comment textarea */}
      <textarea
        value={comment}
        onChange={(e) => !disabled && setComment(e.target.value)}
        disabled={disabled}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Share your experience with this course (optional)..."
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!rating || rating < 1 || rating > 5 || disabled}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {initialRating ? "Update review" : "Submit review"}
        </button>
        {initialRating && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Delete review
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseReviewForm;

