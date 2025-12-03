import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentsAPI } from '../api/client';

/**
 * TeacherAssignmentEditor Page
 * 
 * Allows teachers to edit assignment details and grade student submissions.
 * Route: /teacher/assignments/:assignmentId/edit
 */
const TeacherAssignmentEditor = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Assignment form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 10,
    attachment_url: '',
    is_published: false,
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

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

      // Set form data - preserve existing attachment_url if it exists and assignment doesn't have one
      setFormData(prev => ({
        title: assignmentData.title || '',
        description: assignmentData.description || '',
        due_date: assignmentData.due_date 
          ? new Date(assignmentData.due_date).toISOString().slice(0, 16)
          : '',
        max_points: assignmentData.max_points || 10,
        // Preserve attachment_url if backend doesn't return it (might be a new upload)
        attachment_url: assignmentData.attachment_url || prev.attachment_url || '',
        is_published: assignmentData.is_published || false,
      }));
      
      // Clear selected file when loading assignment
      setSelectedFile(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Clear attachment_url when new file is selected
      setFormData({ ...formData, attachment_url: '' });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    // Check file size (limit to 5MB for base64)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      alert('File size is too large. Maximum size is 5MB. Please use a file upload service for larger files.');
      return;
    }

    setUploadingFile(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);

      // Try to upload file - if backend has upload endpoint, use it
      try {
        const uploadResponse = await assessmentsAPI.uploadFile(formDataToSend);
        const fileUrl = uploadResponse.data.url || uploadResponse.data.file_url || uploadResponse.data.attachment_url;
        if (fileUrl) {
          setFormData(prev => ({ ...prev, attachment_url: fileUrl }));
          setSelectedFile(null);
          alert('File uploaded successfully!');
          setUploadingFile(false);
          return;
        }
      } catch (uploadErr) {
        // Backend doesn't have upload endpoint, continue to base64
        console.log('Upload endpoint not available, using base64 fallback');
      }

      // If no upload endpoint, use base64 as fallback
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        reader.readAsDataURL(selectedFile);
      });

      // Check if base64 string is too long (backend limit is 500 chars)
      if (base64String.length > 500) {
        alert(`File is too large (${base64String.length} chars). Backend only supports URLs up to 500 characters. Please use a file upload service or compress the file.`);
        setUploadingFile(false);
        return;
      }

      // Update form data with base64 string
      setFormData(prev => {
        const updated = { ...prev, attachment_url: base64String };
        console.log('Updated attachment_url:', updated.attachment_url ? `Set (${base64String.length} chars)` : 'Empty');
        return updated;
      });
      setSelectedFile(null);
      alert('File converted to base64 and ready to save. Note: For production, use a proper file upload service.');
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    // If file is selected but not uploaded, upload it first
    if (selectedFile && !formData.attachment_url) {
      await handleUploadFile();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSaving(true);
    try {
      // Get current attachment_url (may have been updated by handleUploadFile)
      const currentAttachmentUrl = formData.attachment_url || '';
      
      const payload = {
        title: formData.title,
        description: formData.description || '',
        due_date: formData.due_date || null,
        max_points: parseInt(formData.max_points) || 10,
        attachment_url: currentAttachmentUrl,
        is_published: formData.is_published,
      };

      console.log('Saving assignment with payload:', { 
        ...payload, 
        attachment_url: currentAttachmentUrl ? `Set: ${currentAttachmentUrl.substring(0, 50)}...` : 'empty' 
      });

      const response = await assessmentsAPI.updateTeacherAssignment(assignmentId, payload);
      
      console.log('Save response:', response.data);
      console.log('Response attachment_url:', response.data?.attachment_url);
      
      // Preserve attachment_url before fetchData
      const preservedAttachmentUrl = currentAttachmentUrl;
      
      // If response has attachment_url, use it immediately
      if (response.data && response.data.attachment_url) {
        setFormData(prev => ({
          ...prev,
          attachment_url: response.data.attachment_url,
        }));
        console.log('Updated attachment_url from response:', response.data.attachment_url);
      }
      
      // Refresh data to get updated assignment
      await fetchData();
      
      // Restore attachment_url if it was lost during fetch (backend might not return it immediately)
      if (preservedAttachmentUrl) {
        setFormData(prev => {
          // Only restore if backend didn't return it or returned empty
          const currentUrl = prev.attachment_url || '';
          if (!currentUrl || (currentUrl !== preservedAttachmentUrl && !response.data?.attachment_url)) {
            console.log('Restoring preserved attachment_url:', preservedAttachmentUrl.substring(0, 50));
            return { ...prev, attachment_url: preservedAttachmentUrl };
          }
          console.log('Keeping current attachment_url:', currentUrl.substring(0, 50));
          return prev;
        });
      }
      
      setSelectedFile(null);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      alert('Assignment saved successfully!');
    } catch (err) {
      console.error('Error saving assignment:', err);
      alert(err.response?.data?.detail || 'Failed to save assignment');
    } finally {
      setSaving(false);
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
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
          Graded
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
        Submitted
      </span>
    );
  };

  if (loading) {
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
            {error}
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-600">Assignment not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(`/teacher/courses/${assignment.course}/assignments`)}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course Assignments
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Edit Assignment</h1>
        </div>

        {/* Assignment Info Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Assignment Information</h2>
          
          <form onSubmit={handleSaveAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Points
                </label>
                <input
                  type="number"
                  value={formData.max_points}
                  onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) || 10 })}
                  min="1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Attachment
              </label>
              
              {/* File Upload */}
              <div className="mb-3">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                />
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-slate-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleUploadFile}
                      disabled={uploadingFile}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {uploadingFile ? 'Uploading...' : 'Upload File'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        // Reset file input
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Or enter URL manually */}
              <div className="text-xs text-slate-500 mb-2">Or enter URL manually:</div>
              <input
                type="text"
                value={formData.attachment_url}
                onChange={(e) => {
                  setFormData({ ...formData, attachment_url: e.target.value });
                  setSelectedFile(null);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://... or /media/uploads/..."
              />
              {formData.attachment_url && !formData.attachment_url.startsWith('data:') && (
                <div className="mt-2">
                  <a
                    href={formData.attachment_url.startsWith('http') 
                      ? formData.attachment_url 
                      : `http://localhost:8000${formData.attachment_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Attachment
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_published" className="ml-2 text-sm text-slate-700">
                Publish assignment
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentEditor;

