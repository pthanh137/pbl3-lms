import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentsAPI } from '../api/client';

/**
 * TeacherAssignmentSubmissions Page
 * 
 * Allows teachers to view and grade student submissions for an assignment.
 * Route: /teacher/assignments/:assignmentId/submissions
 */
const TeacherAssignmentSubmissions = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Grading state per submission
  const [gradingStates, setGradingStates] = useState({}); // { submissionId: { grade, feedback } }

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
  }, [assignmentId, isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignment detail
      const assignmentResponse = await assessmentsAPI.getTeacherAssignmentDetail(assignmentId);
      const assignmentData = assignmentResponse.data;
      setAssignment(assignmentData);
      
      // Fetch submissions
      try {
        const submissionsResponse = await assessmentsAPI.getAssignmentSubmissions(assignmentId);
        let submissionsData = [];
        if (Array.isArray(submissionsResponse.data)) {
          submissionsData = submissionsResponse.data;
        } else if (submissionsResponse.data?.results) {
          submissionsData = submissionsResponse.data.results;
        }
        setSubmissions(submissionsData);

        // Initialize grading states
        const initialGradingStates = {};
        submissionsData.forEach(sub => {
          initialGradingStates[sub.id] = {
            grade: sub.grade || '',
            feedback: sub.feedback || '',
          };
        });
        setGradingStates(initialGradingStates);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
      setError(err.response?.data?.detail || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    const gradingState = gradingStates[submissionId];
    if (!gradingState) return;

    const grade = parseFloat(gradingState.grade);
    if (isNaN(grade) || grade < 0) {
      alert('Please enter a valid grade');
      return;
    }

    if (grade > (assignment?.max_points || 10)) {
      alert(`Grade cannot exceed max points (${assignment?.max_points || 10})`);
      return;
    }

    try {
      await assessmentsAPI.gradeSubmission(submissionId, {
        grade: grade,
        feedback: gradingState.feedback || '',
      });
      
      // Refresh submissions
      await fetchData();
      alert('Grade saved successfully!');
    } catch (err) {
      console.error('Error grading submission:', err);
      alert(err.response?.data?.detail || 'Failed to save grade');
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

  const getStatusBadge = (status) => {
    if (status === 'graded') {
      return (
        <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-semibold border border-accent-200">
          Graded
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
        Submitted
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-red-800">
            {error}
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-slate-600">Assignment not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <button
            onClick={() => navigate(`/teacher/assignments/${assignmentId}/edit`)}
            className="text-slate-600 hover:text-primary-500 mb-4 flex items-center gap-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Assignment
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Submissions</h1>
              <p className="text-base text-slate-600 mt-1">{assignment.title}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Total Submissions</div>
              <div className="text-2xl font-bold text-primary-500">{submissions.length}</div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No submissions yet</h3>
            <p className="text-slate-600">Students haven't submitted their work for this assignment yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const studentName = submission.student_name || 'N/A';
              const studentEmail = submission.student_email || submission.student?.email || `Student #${submission.student}`;
              const gradingState = gradingStates[submission.id] || { grade: submission.grade || '', feedback: submission.feedback || '' };

              return (
                <div
                  key={submission.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-bold text-lg">
                          {studentName !== 'N/A' ? studentName.charAt(0).toUpperCase() : 'S'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-slate-900">
                          {studentName !== 'N/A' ? studentName : 'Student'}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          {submission.student_email || submission.student?.email || `ID: ${submission.student}`}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Submitted at: {formatDate(submission.submitted_at)}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  {/* Submission Content or File */}
                  {submission.content && (
                    <div className="mb-4">
                      {/* Check if content is a file URL */}
                      {(submission.content.startsWith('http') || submission.content.startsWith('/media/')) ? (
                        <div>
                          <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Submitted File</div>
                          <a
                            href={submission.content.startsWith('http') 
                              ? submission.content 
                              : `http://localhost:8000${submission.content}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition shadow-md hover:shadow-lg text-sm font-semibold"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View Submitted File
                          </a>
                          <p className="text-xs text-slate-500 mt-2">
                            {submission.content.startsWith('http') 
                              ? submission.content 
                              : `http://localhost:8000${submission.content}`}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Submission</div>
                          <div className="text-sm text-slate-900 whitespace-pre-wrap">
                            {submission.content}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback: Check file_url if content is not a file */}
                  {!submission.content && submission.file_url && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Attachment</div>
                      <a
                        href={submission.file_url.startsWith('http') 
                          ? submission.file_url 
                          : `http://localhost:8000${submission.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition shadow-md hover:shadow-lg text-sm font-semibold"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Submission File
                      </a>
                    </div>
                  )}

                  {/* Grading Form */}
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Grade (out of {assignment.max_points})
                        </label>
                        <input
                          type="number"
                          value={gradingState.grade}
                          onChange={(e) => {
                            setGradingStates({
                              ...gradingStates,
                              [submission.id]: {
                                ...gradingState,
                                grade: e.target.value,
                              },
                            });
                          }}
                          min="0"
                          max={assignment.max_points}
                          step="0.1"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback</label>
                        <textarea
                          value={gradingState.feedback}
                          onChange={(e) => {
                            setGradingStates({
                              ...gradingStates,
                              [submission.id]: {
                                ...gradingState,
                                feedback: e.target.value,
                              },
                            });
                          }}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 resize-y"
                          placeholder="Feedback for student..."
                        />
                      </div>
                    </div>

                    {/* Current Grade Display */}
                    {submission.grade !== null && submission.grade !== undefined && (
                      <div className="mb-4 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                        <div className="text-sm text-primary-700">
                          Current grade: <span className="font-bold text-lg">{submission.grade}</span> / {assignment.max_points}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleGradeSubmission(submission.id)}
                        className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
                      >
                        Save Grade
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignmentSubmissions;

