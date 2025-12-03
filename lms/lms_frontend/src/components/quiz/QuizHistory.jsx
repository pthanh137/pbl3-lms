import { useState, useEffect } from 'react';
import { studentQuizAPI } from '../../api/client';

/**
 * Quiz History Component
 * Displays history of quiz attempts
 */
const QuizHistory = ({ quizId, quiz, onViewAttempt }) => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, [quizId]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await studentQuizAPI.getMyQuizAttempt(quizId);
      const attemptsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.results || [];
      // Only show completed attempts
      const completedAttempts = attemptsData.filter(a => a.status === 'completed');
      setAttempts(completedAttempts);
    } catch (err) {
      console.error('Error fetching quiz attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculatePercentage = (score, totalPoints) => {
    if (!totalPoints || totalPoints === 0) return 0;
    return (score / totalPoints) * 100;
  };

  const totalPoints = quiz?.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        <p className="mt-3 text-slate-600 font-medium">Loading attempt history...</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Attempt History</h3>
      <div className="space-y-4">
        {attempts.map((attempt, index) => {
          const percentage = calculatePercentage(attempt.score, totalPoints);
          const isLatest = index === 0;
          const isPerfect = percentage === 100;
          const isGood = percentage >= 70;
          
          return (
            <div
              key={attempt.id}
              className={`bg-white rounded-2xl border-2 p-6 shadow-md hover:shadow-xl transition-all ${
                isLatest 
                  ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-secondary-50 shadow-lg' 
                  : 'border-slate-200 hover:border-primary-200'
              }`}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-base font-bold text-slate-900">
                      Attempt #{attempts.length - index}
                    </span>
                    {isLatest && (
                      <span className="px-4 py-1.5 bg-primary-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Latest
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(attempt.completed_at || attempt.started_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold ${
                        isPerfect 
                          ? 'text-accent-600' 
                          : isGood 
                          ? 'text-primary-600' 
                          : 'text-slate-600'
                      }`}>
                        {percentage.toFixed(1)}%
                      </span>
                      <span className="text-sm font-semibold text-slate-500">Score</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-lg border-2 border-slate-200">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-base font-bold text-slate-900">
                        {attempt.score} / {totalPoints} points
                      </span>
                    </div>
                  </div>
                </div>
                {onViewAttempt && (
                  <button
                    onClick={() => onViewAttempt(attempt)}
                    className="px-6 py-3 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all shadow-sm hover:shadow-md flex-shrink-0 border-2 border-slate-300"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizHistory;

