import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentsAPI } from '../api/client';

/**
 * TeacherQuizSubmissionDetail Page
 * 
 * Displays detailed view of a student's quiz submission.
 * Route: /teacher/submissions/:submissionId
 */
const TeacherQuizSubmissionDetail = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'teacher') {
      navigate('/');
      return;
    }

    fetchData();
  }, [submissionId, isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await assessmentsAPI.getQuizSubmissionDetail(submissionId);
      setSubmission(response.data);
    } catch (err) {
      console.error('Error fetching submission detail:', err);
      setError(err.response?.data?.detail || 'Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '0 min';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading submission details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error || 'Submission not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Submission</h1>
              <p className="text-gray-600">
                {submission.student_name || submission.student_email} • {submission.quiz_title}
              </p>
            </div>
            <Link
              to={`/teacher/quizzes/${submission.quiz_id}/results`}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Back to Results
            </Link>
          </div>
        </div>

        {/* Submission Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Score</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {submission.score?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Correct Answers</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {submission.correct_answers || 0}/{submission.total_questions || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Time Spent</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatTime(submission.time_spent_seconds || submission.time_spent)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Submitted At</div>
              <div className="text-sm font-medium text-gray-900 mt-1">
                {formatDate(submission.submitted_at || submission.completed_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Answers</h2>
          {submission.answers && submission.answers.length > 0 ? (
            <div className="space-y-4">
              {submission.answers.map((answer, index) => (
                <div
                  key={answer.id || index}
                  className={`border-2 rounded-lg p-4 ${
                    answer.is_correct
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-500 mb-1">
                        Question {index + 1}
                      </div>
                      <div className="text-base font-medium text-gray-900 mb-2">
                        {answer.question_text || `Question ${answer.question_id}`}
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Selected:</span>{' '}
                        {answer.selected_choice_text || 'No answer selected'}
                      </div>
                    </div>
                    <div className="ml-4">
                      {answer.is_correct ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          ✗ Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No answers available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherQuizSubmissionDetail;

