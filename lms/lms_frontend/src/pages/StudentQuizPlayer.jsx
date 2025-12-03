import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentQuizAPI, enrollmentsAPI } from '../api/client';
import QuizPlayer from '../components/quiz/QuizPlayer';
import QuizResult from '../components/quiz/QuizResult';

/**
 * StudentQuizPlayer Page
 * 
 * Premium Udemy-style Quiz Player
 * Route: /courses/:courseId/quizzes/:quizId/take
 */
const StudentQuizPlayer = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { score, total_points, percentage }
  const [userAnswers, setUserAnswers] = useState({}); // For result display
  const [showResult, setShowResult] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

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

    checkEnrollment();
  }, [courseId, isAuthenticated, user, authLoading, navigate]);

  const checkEnrollment = async () => {
    try {
      setCheckingEnrollment(true);
      const response = await enrollmentsAPI.getMyEnrollments();
      let enrollments = [];
      if (Array.isArray(response.data)) {
        enrollments = response.data;
      } else if (response.data?.results) {
        enrollments = response.data.results;
      } else if (response.data?.data) {
        enrollments = response.data.data;
      }
      
      const enrolled = enrollments.some(
        (enrollment) => 
          enrollment.course?.id === parseInt(courseId) || 
          enrollment.course_id === parseInt(courseId)
      );
      setIsEnrolled(enrolled);
      
      if (!enrolled) {
        setError('You must enroll in this course first to take quizzes.');
        setLoading(false);
        return;
      }
      
      // If enrolled, fetch quiz data
      fetchQuizData();
    } catch (err) {
      console.error('Error checking enrollment:', err);
      setError('Failed to verify enrollment. Please try again.');
      setLoading(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quiz detail
      const quizResponse = await studentQuizAPI.getQuizDetail(quizId);
      setQuiz(quizResponse.data);

      // Check if there's an existing completed attempt (only on initial load, not on retake)
      if (!showResult) {
        try {
          const attemptResponse = await studentQuizAPI.getMyQuizAttempt(quizId);
          const attempts = Array.isArray(attemptResponse.data) 
            ? attemptResponse.data 
            : attemptResponse.data?.results || [];
          const completedAttempt = attempts.find(a => a.status === 'completed');
          const inProgressAttempt = attempts.find(a => a.status === 'in_progress');
          
          if (completedAttempt && !result) {
            // Quiz already completed, show result
            const totalPoints = quizResponse.data.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
            const percentage = totalPoints > 0 ? (completedAttempt.score / totalPoints) * 100 : 0;
            setResult({
              score: completedAttempt.score,
              total_points: totalPoints,
              percentage: percentage
            });
            setShowResult(true);
            return;
          }
          
          if (inProgressAttempt) {
            setAttempt(inProgressAttempt);
            return;
          }
        } catch (err) {
          // No attempt found, continue
          console.log('No existing attempt found');
        }
      }

      // Start quiz attempt (idempotent - safe to call multiple times)
      // This will create a new in_progress attempt even if there's a completed one
      try {
        const startResponse = await studentQuizAPI.startQuiz(quizId);
        setAttempt(startResponse.data);
      } catch (err) {
        // Ignore errors if already started
        console.log('Quiz already started or error starting:', err);
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err.response?.data?.detail || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async (payload) => {
    if (!quiz || result) return;

    setError(null);

    try {
      const response = await studentQuizAPI.submitQuiz(quizId, payload);
      setResult({
        score: response.data.score,
        total_points: response.data.total_points,
        percentage: response.data.percentage,
      });
      
      // Store user answers for result display
      const answersMap = {};
      payload.answers.forEach(answer => {
        if (answer.selected_choice) {
          answersMap[answer.question] = answer.selected_choice;
        }
      });
      setUserAnswers(answersMap);
      
      // Fetch quiz again to get questions with choices for result display
      // Note: Student API doesn't include is_correct, so we'll mark based on score calculation
      try {
        const quizResponse = await studentQuizAPI.getQuizDetail(quizId);
        setQuiz(quizResponse.data);
      } catch (err) {
        console.error('Error fetching quiz for results:', err);
      }
      
      setShowResult(true);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.detail || 'Failed to submit quiz');
    }
  };

  const handleTimeUp = async () => {
    // Auto-submit when time is up
    if (!quiz || result) return;
    
    // Get current answers from localStorage
    const saved = localStorage.getItem(`quiz_${quiz.id}_answers`);
    let answersMap = {};
    if (saved) {
      try {
        answersMap = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved answers:', e);
      }
    }
    
    // Prepare answers in API format
    const answersArray = Object.entries(answersMap).map(([questionId, choiceId]) => ({
      question: parseInt(questionId),
      selected_choice: parseInt(choiceId)
    }));
    
    await handleSubmitQuiz({ answers: answersArray });
  };

  const handleRetake = async () => {
    // Reset state for retake
    setResult(null);
    setShowResult(false);
    setUserAnswers({});
    setAttempt(null);
    
    // Clear saved answers
    if (quiz?.id) {
      localStorage.removeItem(`quiz_${quiz.id}_answers`);
    }
    
    // Start new attempt
    try {
      setLoading(true);
      // Start a new quiz attempt
      const startResponse = await studentQuizAPI.startQuiz(quizId);
      setAttempt(startResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error starting retake:', err);
      setError(err.response?.data?.detail || 'Failed to start quiz retake');
      setLoading(false);
    }
  };

  if (authLoading || loading || checkingEnrollment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-semibold mb-2">Access Denied</p>
            <p>{error}</p>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-600">Quiz not found</div>
      </div>
    );
  }

  // Show result page if quiz is completed
  if (showResult && result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <QuizResult
          quiz={quiz}
          result={result}
          userAnswers={userAnswers}
          questions={quiz.questions || []}
          onRetake={handleRetake}
        />
      </div>
    );
  }

  // Show quiz player
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-7xl mx-auto text-red-800 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Quiz Player */}
      {quiz && attempt && (
        <QuizPlayer
          quiz={quiz}
          attempt={attempt}
          onSubmit={handleSubmitQuiz}
          onTimeUp={handleTimeUp}
        />
      )}

      {/* Loading or No Attempt */}
      {!attempt && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-600">
            Starting quiz...
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuizPlayer;

