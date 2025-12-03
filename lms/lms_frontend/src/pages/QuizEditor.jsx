import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentsAPI } from '../api/client';
import QuestionEditor from '../components/QuestionEditor';

/**
 * QuizEditor Page
 * 
 * Allows editing quiz info and managing questions/choices.
 * Route: /teacher/quizzes/:quizId/edit
 * 
 * Manual Test Steps:
 * 1. From TeacherCourseQuizzes, click "Edit" on a quiz
 * 2. Edit quiz title, description, time_limit, is_published
 * 3. Add questions
 * 4. For each question, add choices and mark correct answers
 * 5. Save changes
 */
const QuizEditor = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // Quiz form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time_limit: '',
    is_published: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'teacher') {
      navigate('/');
      return;
    }

    fetchQuiz();
  }, [quizId, isAuthenticated, user, navigate]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await assessmentsAPI.getTeacherQuizDetail(quizId);
      const quizData = response.data;
      setQuiz(quizData);
      setFormData({
        title: quizData.title || '',
        description: quizData.description || '',
        time_limit: quizData.time_limit || '',
        is_published: quizData.is_published || false,
      });
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err.response?.data?.detail || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!formData.title.trim()) {
      setError('Quiz title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await assessmentsAPI.updateTeacherQuiz(quizId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        time_limit: formData.time_limit ? parseInt(formData.time_limit) : null,
        is_published: formData.is_published,
      });
      await fetchQuiz(); // Refresh to get updated data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    setAddingQuestion(true);
    setError(null);

    try {
      // Get current max order
      const currentQuestions = quiz.questions || [];
      const maxOrder = currentQuestions.length > 0
        ? Math.max(...currentQuestions.map(q => q.order || 0))
        : 0;

      await assessmentsAPI.createQuestion(quizId, {
        text: 'New Question',
        points: 1,
        order: maxOrder + 1,
      });
      await fetchQuiz(); // Refresh to get new question
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add question');
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleQuestionUpdated = () => {
    fetchQuiz();
  };

  const handleQuestionDeleted = () => {
    fetchQuiz();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Quiz not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Header - Coursera Style */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Quiz</h1>
            <p className="text-slate-600 mt-1 text-sm">Manage quiz details, questions, and choices</p>
          </div>
          <button
            onClick={() => navigate(`/teacher/courses/${quiz.course}/quizzes`)}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Back to Course Quizzes
          </button>
        </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quiz Info Form - Coursera Style */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Quiz Information</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
              placeholder="Enter quiz description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                min="1"
                className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                placeholder="Optional"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-700">Published</span>
              </label>
            </div>
          </div>

          <div>
            <button
              onClick={handleSaveQuiz}
              disabled={saving || !formData.title.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </div>
      </div>

      {/* Questions Section - Coursera Style */}
      <div className="bg-white shadow-md rounded-2xl p-4 border-2 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
          <button
            onClick={handleAddQuestion}
            disabled={addingQuestion}
            className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
          >
            {addingQuestion ? 'Adding...' : 'Add Question'}
          </button>
        </div>

        {quiz.questions && quiz.questions.length > 0 ? (
          <div className="space-y-2">
            {quiz.questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                isExpanded={expandedQuestions.has(question.id)}
                onExpandedChange={(expanded) => {
                  const newSet = new Set(expandedQuestions);
                  if (expanded) {
                    newSet.add(question.id);
                  } else {
                    newSet.delete(question.id);
                  }
                  setExpandedQuestions(newSet);
                }}
                onUpdated={handleQuestionUpdated}
                onDeleted={handleQuestionDeleted}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            <p>No questions yet. Click "Add Question" to create your first question.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default QuizEditor;

