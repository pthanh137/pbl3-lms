import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentQuizAPI, enrollmentsAPI } from '../api/client';

/**
 * QuizStartPage Component
 * 
 * Displays quiz information and Start button before allowing user to take quiz.
 * Route: /quiz-start/:quizId
 */
const QuizStartPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [maxAttempts, setMaxAttempts] = useState(null); // null means unlimited

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'student') {
      navigate('/');
      return;
    }

    fetchData();
  }, [quizId, isAuthenticated, user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quiz detail
      const quizResponse = await studentQuizAPI.getQuizDetail(quizId);
      const quizData = quizResponse.data;
      setQuiz(quizData);
      setCourse(quizData.course);

      // Check enrollment
      const enrollmentsResponse = await enrollmentsAPI.getMyEnrollments();
      let enrollments = [];
      if (Array.isArray(enrollmentsResponse.data)) {
        enrollments = enrollmentsResponse.data;
      } else if (enrollmentsResponse.data?.results) {
        enrollments = enrollmentsResponse.data.results;
      } else if (enrollmentsResponse.data?.data) {
        enrollments = enrollmentsResponse.data.data;
      }

      const enrolled = enrollments.some(
        (enrollment) => 
          enrollment.course?.id === quizData.course?.id || 
          enrollment.course_id === quizData.course?.id
      );
      setIsEnrolled(enrolled);

      if (!enrolled) {
        setError('You must enroll in this course first to take quizzes.');
        setLoading(false);
        return;
      }

      // Fetch existing attempts
      try {
        const attemptsResponse = await studentQuizAPI.getMyQuizAttempt(quizId);
        const attemptsData = Array.isArray(attemptsResponse.data)
          ? attemptsResponse.data
          : attemptsResponse.data?.results || [];
        setAttempts(attemptsData);
        
        // Check if there's a max attempts limit (you can add this to quiz model later)
        // For now, we'll assume unlimited attempts
        setMaxAttempts(null);
      } catch (err) {
        console.log('No attempts found or error fetching attempts:', err);
        setAttempts([]);
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err.response?.data?.detail || 'Failed to load quiz information');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz || !isEnrolled) return;

    // Check if max attempts reached
    if (maxAttempts !== null) {
      const completedAttempts = attempts.filter(a => a.status === 'completed').length;
      if (completedAttempts >= maxAttempts) {
        setError(`You have reached the maximum number of attempts (${maxAttempts}).`);
        return;
      }
    }

    try {
      setStarting(true);
      setError(null);

      // Start quiz attempt
      await studentQuizAPI.startQuiz(quizId);

      // Navigate to quiz taking page
      if (course?.id) {
        navigate(`/courses/${course.id}/quizzes/${quizId}/take`);
      } else {
        // Fallback if course ID is not available
        navigate(`/courses/${quiz.course}/quizzes/${quizId}/take`);
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError(err.response?.data?.detail || 'Failed to start quiz. Please try again.');
      setStarting(false);
    }
  };

  const formatTimeLimit = (minutes) => {
    if (!minutes || minutes === 0) return 'No time limit';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getRemainingAttempts = () => {
    if (maxAttempts === null) return 'Unlimited';
    const completedCount = attempts.filter(a => a.status === 'completed').length;
    const remaining = maxAttempts - completedCount;
    return remaining > 0 ? remaining : 0;
  };

  const canStartQuiz = () => {
    if (!isEnrolled) return false;
    if (maxAttempts !== null) {
      const completedCount = attempts.filter(a => a.status === 'completed').length;
      return completedCount < maxAttempts;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading quiz information...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          {course && (
            <p className="text-gray-600 text-lg">
              {course.title || course.name || 'Course'}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quiz Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Information</h2>
          
          <div className="space-y-4">
            {/* Description */}
            {quiz.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                <p className="text-gray-600">{quiz.description}</p>
              </div>
            )}

            {/* Number of Questions */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Number of Questions</span>
              <span className="text-sm text-gray-900 font-semibold">
                {quiz.questions?.length || 0}
              </span>
            </div>

            {/* Time Limit */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Time Limit</span>
              <span className="text-sm text-gray-900 font-semibold">
                {formatTimeLimit(quiz.time_limit)}
              </span>
            </div>

            {/* Remaining Attempts */}
            {maxAttempts !== null && (
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Remaining Attempts</span>
                <span className="text-sm text-gray-900 font-semibold">
                  {getRemainingAttempts()}
                </span>
              </div>
            )}

            {/* Previous Attempts */}
            {attempts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Previous Attempts</h3>
                <div className="space-y-2">
                  {attempts.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-600">
                        {attempt.status === 'completed' ? 'Completed' : 'In Progress'}
                        {attempt.score !== null && attempt.score !== undefined && (
                          <span className="ml-2">- Score: {attempt.score.toFixed(1)}%</span>
                        )}
                      </span>
                      {attempt.completed_at && (
                        <span className="text-xs text-gray-500">
                          {formatDate(attempt.completed_at)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="text-yellow-600 text-xl mr-3">⚠️</div>
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Click "Start Quiz" to begin. The timer will start counting once you start the quiz.
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <button
            onClick={handleStartQuiz}
            disabled={!canStartQuiz() || starting}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
              canStartQuiz() && !starting
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {starting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Starting...
              </span>
            ) : !canStartQuiz() ? (
              maxAttempts !== null ? 'Maximum Attempts Reached' : 'Cannot Start Quiz'
            ) : (
              'Start Quiz'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizStartPage;

