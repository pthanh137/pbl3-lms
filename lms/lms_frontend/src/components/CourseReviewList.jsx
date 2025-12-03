/**
 * CourseReviewList Component
 * Displays a list of course reviews with pagination
 * 
 * Props:
 * - reviews: array of review objects
 * - currentUserId?: number (optional, to highlight user's review)
 * - reviewsPerPage?: number (default: 5)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const CourseReviewList = ({ reviews = [], currentUserId, reviewsPerPage = 5 }) => {
  // Ensure reviews is always an array
  const reviewsArray = Array.isArray(reviews) ? reviews : [];
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  
  // Calculate pagination
  const totalReviews = reviewsArray.length;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = reviewsArray.slice(startIndex, endIndex);
  
  // Reset to page 1 if current page is out of bounds (only if we have reviews)
  if (totalPages > 0 && currentPage > totalPages) {
    setCurrentPage(1);
  }
  
  if (reviewsArray.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-slate-200">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-slate-600">No reviews yet.</p>
        <p className="text-sm text-slate-500 mt-1">Be the first to review this course!</p>
      </div>
    );
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top of reviews section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to top of reviews section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    // Scroll to top of reviews section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getAvatarUrl = (user) => {
    if (user?.avatar_url) return user.avatar_url;
    const name = user?.full_name || user?.email || 'Anonymous';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0056D2&color=fff&size=64`;
  };

  return (
    <div className="space-y-6">
      {/* Reviews List - Coursera Style */}
      <div className="space-y-4">
        {currentReviews.map((review) => (
          <div 
            key={review.id} 
            className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 hover:border-primary-200 transition-all shadow-sm"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={getAvatarUrl(review.user)}
                  alt={review.user?.full_name || 'User'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                  onError={(e) => {
                    e.target.src = getAvatarUrl(review.user);
                  }}
                />
              </div>
              
              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {review.user?.id ? (
                        <button
                          onClick={() => navigate(`/profile/${review.user.id}`)}
                          className="text-base font-bold text-slate-900 hover:text-primary-600 transition cursor-pointer"
                        >
                          {review.user?.full_name || review.user?.email || 'Anonymous'}
                        </button>
                      ) : (
                        <div className="text-base font-bold text-slate-900">
                          {review.user?.full_name || review.user?.email || 'Anonymous'}
                        </div>
                      )}
                      {currentUserId && review.user?.id === currentUserId && (
                        <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs font-semibold rounded-full border border-accent-200">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingStars value={review.rating} size="sm" />
                      <span className="text-xs text-slate-500 font-medium">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-base text-slate-700 leading-relaxed mb-2">{review.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls - Coursera Style */}
      {totalPages > 1 && (
        <div className="pt-6 border-t-2 border-slate-200">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1);
                
                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-slate-500 font-medium">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                      currentPage === page
                        ? 'bg-primary-500 text-white shadow-md hover:bg-primary-600'
                        : 'text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-primary-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Pagination Info */}
          <div className="text-sm text-slate-600 text-center pt-4 font-medium">
            Showing {startIndex + 1}-{Math.min(endIndex, totalReviews)} of {totalReviews} reviews
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseReviewList;
