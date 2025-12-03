import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAssignmentAPI } from '../api/client';
import AssignmentStatusBadge from '../components/AssignmentStatusBadge';

/**
 * Assignment Detail Page
 * Allows students to view and submit assignments
 */
const AssignmentDetail = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Submission form state
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionType, setSubmissionType] = useState('text'); // 'text' or 'file'

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

    fetchAssignmentData();
  }, [assignmentId, isAuthenticated, user, authLoading, navigate]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignment detail
      const assignmentResponse = await studentAssignmentAPI.getAssignmentDetail(assignmentId);
      setAssignment(assignmentResponse.data);

      // Fetch my submission
      try {
        const submissionResponse = await studentAssignmentAPI.getMySubmission(assignmentId);
        setSubmission(submissionResponse.data);
        if (submissionResponse.data?.content) {
          setTextAnswer(submissionResponse.data.content);
        }
      } catch (err) {
        // No submission found, that's okay
        setSubmission(null);
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
      setError(err.response?.data?.detail || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setSubmissionType('file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignment) return;

    // Validation
    if (submissionType === 'text' && !textAnswer.trim()) {
      alert('Please enter your answer');
      return;
    }

    if (submissionType === 'file' && !selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let payload;
      
      if (submissionType === 'text') {
        // Backend expects 'content' field for text submissions
        payload = { content: textAnswer };
      } else {
        // File upload - use FormData
        const formData = new FormData();
        formData.append('file', selectedFile);
        payload = formData;
      }

      await studentAssignmentAPI.submitAssignment(assignmentId, payload);
      
      // Refresh submission data
      await fetchAssignmentData();
      
      alert('Assignment submitted successfully!');
    } catch (err) {
      console.error('Error submitting assignment:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Failed to submit assignment';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatus = () => {
    if (!submission) return 'not_submitted';
    if (submission.grade !== null && submission.grade !== undefined) {
      return 'graded';
    }
    return 'submitted';
  };

  const status = getStatus();
  const canSubmit = status === 'not_submitted';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-red-800 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-lg">{error}</span>
            </div>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center">
        <div className="text-center text-lg text-slate-600 font-medium">Assignment not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white py-10">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header - Coursera Style */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="text-slate-600 hover:text-primary-600 mb-6 flex items-center gap-2 font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-lg text-slate-600">{assignment.description}</p>
          )}
        </div>

        {/* Error Message - Coursera Style */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-xl p-5 text-base mb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Assignment Info Card - Coursera Style */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Assignment Details</h2>
          <div className="space-y-6">
            {/* Due Date */}
            {assignment.due_date && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-1">DUE DATE</h3>
                  <p className="text-base text-slate-900 font-medium">{formatDate(assignment.due_date)}</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">STATUS</h3>
                <AssignmentStatusBadge status={status} />
              </div>
            </div>

            {/* Maximum Points */}
            {assignment.max_points > 0 && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-1">MAXIMUM POINTS</h3>
                  <p className="text-base text-slate-900 font-medium">{assignment.max_points} points</p>
                </div>
              </div>
            )}

            {/* Attached File */}
            {assignment.attachment_url && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">ATTACHMENT</h3>
                  <a
                    href={assignment.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download attachment
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submission Section - Coursera Style */}
        {canSubmit ? (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Submit Assignment</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Submission Type Toggle - Coursera Style */}
              <div className="flex items-center gap-6 mb-6 bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="submissionType"
                    value="text"
                    checked={submissionType === 'text'}
                    onChange={() => setSubmissionType('text')}
                    className="w-5 h-5 text-primary-500"
                  />
                  <span className="text-base font-semibold text-slate-700">Text Answer</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="submissionType"
                    value="file"
                    checked={submissionType === 'file'}
                    onChange={() => setSubmissionType('file')}
                    className="w-5 h-5 text-primary-500"
                  />
                  <span className="text-base font-semibold text-slate-700">File Upload</span>
                </label>
              </div>

              {/* Text Answer */}
              {submissionType === 'text' && (
                <div>
                  <label className="block text-base font-bold text-slate-900 mb-3">
                    Your Answer
                  </label>
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    rows={12}
                    className="w-full px-5 py-4 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                    placeholder="Enter your answer here..."
                    required
                  />
                </div>
              )}

              {/* File Upload */}
              {submissionType === 'file' && (
                <div>
                  <label className="block text-base font-bold text-slate-900 mb-3">
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-5 py-4 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                    required={submissionType === 'file'}
                  />
                  {selectedFile && (
                    <div className="mt-3 bg-primary-50 border-2 border-primary-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-primary-700">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none text-base"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Assignment'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Submission</h2>
            
            {submission && (
              <div className="space-y-6">
                {/* Submission Info */}
                <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200">
                  <p className="text-sm font-semibold text-slate-600 mb-2">Submitted on:</p>
                  <p className="text-lg text-slate-900 font-bold">
                    {formatDate(submission.submitted_at)}
                  </p>
                </div>

                {/* Text Submission */}
                {submission.content && !submission.content.startsWith('http') && (
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">Your Answer</h3>
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
                      <p className="text-base text-slate-900 whitespace-pre-wrap leading-relaxed">{submission.content}</p>
                    </div>
                  </div>
                )}

                {/* File Submission */}
                {(submission.file_url || (submission.content && submission.content.startsWith('http'))) && (
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">Submitted File</h3>
                    <a
                      href={submission.file_url || submission.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Submitted File
                    </a>
                  </div>
                )}

                {/* Grade & Feedback - Coursera Style */}
                {status === 'graded' && (
                  <div className="border-t-2 border-slate-200 pt-6 mt-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Grade & Feedback</h3>
                    <div className="bg-gradient-to-br from-accent-50 to-accent-100 border-2 border-accent-200 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl font-bold text-accent-700">
                          {submission.grade} / {assignment.max_points || 0}
                        </span>
                        <span className="text-lg font-semibold text-accent-700">
                          ({((submission.grade / (assignment.max_points || 1)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      {submission.feedback && (
                        <div className="mt-4 pt-4 border-t-2 border-accent-200">
                          <p className="text-sm font-bold text-slate-700 mb-2">Feedback:</p>
                          <p className="text-base text-slate-900 whitespace-pre-wrap leading-relaxed">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetail;

