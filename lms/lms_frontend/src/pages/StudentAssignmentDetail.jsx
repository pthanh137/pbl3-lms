import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAssignmentAPI, assessmentsAPI, enrollmentsAPI } from '../api/client';
import AssignmentStatusBadge from '../components/AssignmentStatusBadge';

/**
 * Student Assignment Detail Page
 * Allows students to view assignment details and submit their answers
 * Route: /courses/:courseId/assignments/:assignmentId
 */
const StudentAssignmentDetail = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [status, setStatus] = useState('not_submitted'); // 'not_submitted' | 'submitted' | 'graded'
  const [answerContent, setAnswerContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionType, setSubmissionType] = useState('text'); // 'text' or 'file'
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
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
  }, [courseId, assignmentId, isAuthenticated, user, authLoading, navigate]);

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
        setError('You must enroll in this course first to view and submit assignments.');
        setLoading(false);
        return;
      }
      
      // If enrolled, fetch assignment data
      fetchData();
    } catch (err) {
      console.error('Error checking enrollment:', err);
      setError('Failed to verify enrollment. Please try again.');
      setLoading(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignment detail
      const assignmentResponse = await studentAssignmentAPI.getAssignmentDetail(assignmentId);
      setAssignment(assignmentResponse.data);

      // Fetch my submission (404 is handled in API, returns { data: null })
      const submissionResponse = await studentAssignmentAPI.getMySubmission(assignmentId);
      const submissionData = submissionResponse.data;
      
      if (!submissionData) {
        // No submission found
        setSubmission(null);
        setStatus('not_submitted');
      } else {
        setSubmission(submissionData);
        
        // Derive status
        if (submissionData.status === 'submitted' && (submissionData.grade === null || submissionData.grade === undefined)) {
          setStatus('submitted');
        } else if (submissionData.status === 'graded' || (submissionData.grade !== null && submissionData.grade !== undefined)) {
          setStatus('graded');
        } else {
          setStatus('submitted');
        }
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
      // Clear text answer when file is selected
      setAnswerContent('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (submissionType === 'text' && !answerContent.trim()) {
      alert('Please enter your answer or select a file');
      return;
    }

    if (submissionType === 'file' && !selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      let contentToSubmit = '';

      if (submissionType === 'file') {
        // Upload file first to get URL
        setUploadingFile(true);
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          // Upload file to get URL
          const uploadResponse = await assessmentsAPI.uploadFile(formData);
          contentToSubmit = uploadResponse.data.url || uploadResponse.data.file_url || uploadResponse.data.attachment_url;
          
          if (!contentToSubmit) {
            throw new Error('Failed to get file URL after upload');
          }
        } catch (uploadErr) {
          console.error('Error uploading file:', uploadErr);
          throw new Error(uploadErr.response?.data?.detail || 'Failed to upload file. Please try again.');
        } finally {
          setUploadingFile(false);
        }
      } else {
        contentToSubmit = answerContent;
      }

      // Submit assignment with content (text or file URL)
      await studentAssignmentAPI.submitAssignmentText(assignmentId, contentToSubmit);
      
      // Refresh submission data
      await fetchData();
      
      // Clear form
      setAnswerContent('');
      setSelectedFile(null);
      setSubmissionType('text');
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Show success message
      setSuccessMessage('Assignment submitted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error submitting assignment:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to submit assignment';
      setError(errorMessage);
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

  if (authLoading || loading || checkingEnrollment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
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

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-600">Assignment not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{assignment.title}</h1>
          {assignment.due_date && (
            <p className="text-slate-600 mt-2">Due: {formatDate(assignment.due_date)}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm">
            {successMessage}
          </div>
        )}

        {/* Assignment Info Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-slate-900">Assignment Details</h2>
          </div>
          
          <div className="space-y-5">
            {/* Description */}
            {assignment.description && (
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              {assignment.due_date && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Due Date</h3>
                    <p className="text-sm font-medium text-slate-900">{formatDate(assignment.due_date)}</p>
                  </div>
                </div>
              )}

              {/* Max Points */}
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0-1.946-.806 3.42 3.42 0 00-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Maximum Points</h3>
                  <p className="text-sm font-medium text-slate-900">{assignment.max_points || 10} points</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</h3>
                  <div className="mt-1">
                    <AssignmentStatusBadge status={status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Attachment */}
            {assignment.attachment_url && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Attachment</h3>
                <a
                  href={assignment.attachment_url.startsWith('http') 
                    ? assignment.attachment_url 
                    : `http://localhost:8000${assignment.attachment_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download attachment
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Submission Block */}
        {status === 'not_submitted' ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Submit Assignment</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Submission Type Toggle */}
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="submissionType"
                    value="text"
                    checked={submissionType === 'text'}
                    onChange={() => {
                      setSubmissionType('text');
                      setSelectedFile(null);
                      const fileInput = document.querySelector('input[type="file"]');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Text Answer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="submissionType"
                    value="file"
                    checked={submissionType === 'file'}
                    onChange={() => {
                      setSubmissionType('file');
                      setAnswerContent('');
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Upload File</span>
                </label>
              </div>

              {/* Text Answer */}
              {submissionType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your answer here..."
                    required={submissionType === 'text'}
                  />
                </div>
              )}

              {/* File Upload */}
              {submissionType === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2.5 text-sm border-2 border-dashed border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer hover:border-slate-400"
                      required={submissionType === 'file'}
                    />
                  </div>
                  {selectedFile && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || uploadingFile || (submissionType === 'text' && !answerContent.trim()) || (submissionType === 'file' && !selectedFile)}
                className="mt-3 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {uploadingFile ? 'Uploading file...' : submitting ? 'Submitting...' : 'Submit assignment'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Submission</h2>
            
            {submission && (
              <div className="space-y-4">
                {/* Submitted Content */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Your Submission</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    {/* Check if content is a URL (file submission) */}
                    {submission.content && (submission.content.startsWith('http') || submission.content.startsWith('/media/')) ? (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Submitted file:</p>
                        <a
                          href={submission.content.startsWith('http') 
                            ? submission.content 
                            : `http://localhost:8000${submission.content}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Submitted File
                        </a>
                      </div>
                    ) : (
                      <p className="text-slate-900 whitespace-pre-wrap">{submission.content || 'No content submitted'}</p>
                    )}
                  </div>
                </div>

                {/* Submitted At */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Submitted At</h3>
                  <p className="text-slate-600">{formatDate(submission.submitted_at)}</p>
                </div>

                {/* Grade & Feedback (if graded) */}
                {status === 'graded' && (
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Grade & Feedback</h3>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <span className="text-2xl font-bold text-emerald-700">
                            {submission.grade} / {assignment.max_points || 10}
                          </span>
                        </div>
                        <div className="text-sm text-emerald-700">
                          ({((submission.grade / (assignment.max_points || 10)) * 100).toFixed(1)}%)
                        </div>
                      </div>
                      {submission.feedback && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-slate-700 mb-1">Feedback:</p>
                          <p className="text-slate-900 whitespace-pre-wrap">{submission.feedback}</p>
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

export default StudentAssignmentDetail;

