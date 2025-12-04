import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentsAPI } from '../api/client';
import StudentProfileModal from '../components/StudentProfileModal';

/**
 * TeacherQuizResults Page
 * 
 * Displays all quiz submissions (results) for a specific quiz.
 * Route: /teacher/quizzes/:quizId/results
 */
function TeacherQuizResults() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  }, [quizId, isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quiz detail
      try {
        const quizResponse = await assessmentsAPI.getTeacherQuizDetail(quizId);
        setQuiz(quizResponse.data);
      } catch (err) {
        console.error('Error fetching quiz:', err);
      }

      // Fetch submissions with defensive normalization
      const response = await assessmentsAPI.getQuizSubmissions(quizId);
      console.log("API result:", response.data);
      
      // Normalize response to always be an array
      const normalized = Array.isArray(response.data)
        ? response.data
        : response.data?.results || response.data?.submissions || [];
      
      // Ensure it's always an array
      if (!Array.isArray(normalized)) {
        console.warn("Submissions data is not an array, using empty array:", normalized);
        setSubmissions([]);
      } else {
        setSubmissions(normalized);
      }
    } catch (err) {
      console.error('Error fetching quiz submissions:', err);
      setError(err.response?.data?.detail || 'Failed to load quiz results');
      // On error, set empty array to prevent map errors
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTimeSpent = (seconds) => {
    // Handle null, undefined, or invalid values
    if (seconds === null || seconds === undefined || seconds <= 0) return '0 min';
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score) => {
    if (score == null || score === undefined) return '#6B7280'; // gray-500
    if (score >= 80) return '#16A34A'; // green-600
    if (score >= 50) return '#F59E0B'; // amber-500
    return '#DC2626'; // red-600
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading quiz results...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h1>
              {quiz && (
                <p className="text-gray-600">
                  {quiz.title} • {Array.isArray(submissions) ? submissions.length : 0} submission{Array.isArray(submissions) && submissions.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {quiz && (
                <Link
                  to={`/teacher/courses/${quiz.course}/quizzes`}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Back to Quizzes
                </Link>
              )}
            </div>
          </div>
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

        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No submissions yet</p>
            <p className="text-gray-400 mt-2">Students haven't completed this quiz yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correct
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="student-info flex items-center gap-3 cursor-pointer"
                          onClick={() => {
                            setSelectedStudent(submission.student);
                            setIsModalOpen(true);
                          }}
                        >
                          <img
                            src={submission.student?.avatar || "/default-avatar.png"}
                            alt={submission.student?.full_name || "Student"}
                            className="student-avatar w-10 h-10 rounded-full object-cover border-2 border-gray-200 transition-transform hover:scale-105"
                            onError={(e) => {
                              // Fallback to default avatar if image fails to load
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors">
                            {submission.student?.full_name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="text-sm font-semibold"
                          style={{ color: getScoreColor(submission.score) }}
                        >
                          {submission.score != null ? submission.score.toFixed(1) : '0.0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {submission.correct_answers || 0}/{submission.total_questions || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeSpent(submission.time_spent_seconds || submission.time_spent || (submission.time_spent_minutes ? submission.time_spent_minutes * 60 : null))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.submitted_at || submission.completed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/teacher/submissions/${submission.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
};

export default TeacherQuizResults;

