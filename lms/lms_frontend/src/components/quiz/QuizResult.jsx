import { useNavigate } from 'react-router-dom';
import QuizHistory from './QuizHistory';

/**
 * Quiz Result Component
 * Displays quiz results with score and basic information
 */
const QuizResult = ({
  quiz,
  result, // { score, total_points, percentage }
  userAnswers, // { [questionId]: selectedChoiceId }
  questions = [],
  onRetake
}) => {
  const navigate = useNavigate();

  // Calculate correct/incorrect counts based on score
  const estimatedCorrect = result?.score && result?.total_points && questions.length > 0
    ? Math.round((result.score / result.total_points) * questions.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Sticky Header with Actions - Coursera Style */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-slate-200 shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Quiz Results</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-lg font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all border-2 border-slate-300"
              >
                Back to Course
              </button>
              {onRetake && (
                <button
                  onClick={onRetake}
                  className="px-5 py-2.5 rounded-lg font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-all shadow-md hover:shadow-lg"
                >
                  Retake Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Score Card - Coursera Style */}
        <div className="bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 rounded-2xl p-10 border-2 border-primary-200 text-center shadow-lg mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{quiz?.title || 'Quiz Results'}</h2>
          <div className="flex items-center justify-center gap-12 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-200">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                {result?.percentage?.toFixed(1) || 0}%
              </div>
              <div className="text-base font-semibold text-slate-600">Score</div>
            </div>
            <div className="w-px h-20 bg-slate-300"></div>
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-200">
              <div className="text-4xl font-bold text-slate-900 mb-2">
                {result?.score || 0} / {result?.total_points || 0}
              </div>
              <div className="text-base font-semibold text-slate-600">Points</div>
            </div>
          </div>
          
          {/* Stats - Coursera Style */}
          {questions.length > 0 && (
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-3 bg-accent-50 px-6 py-3 rounded-full border-2 border-accent-200">
                <div className="w-4 h-4 rounded-full bg-accent-500"></div>
                <span className="text-slate-900 font-bold">
                  <span className="text-lg">{estimatedCorrect}</span> Correct
                </span>
              </div>
              <div className="flex items-center gap-3 bg-red-50 px-6 py-3 rounded-full border-2 border-red-200">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-slate-900 font-bold">
                  <span className="text-lg">{questions.length - estimatedCorrect}</span> Incorrect
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quiz History */}
        <QuizHistory 
          quizId={quiz?.id} 
          quiz={quiz}
        />
      </div>
    </div>
  );
};

export default QuizResult;
