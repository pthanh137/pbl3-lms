import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyCertificateForCourse } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CertificateView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchCertificate();
  }, [courseId, isAuthenticated, navigate]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyCertificateForCourse(courseId);
      setCertificate(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Certificate not found. Please complete the course and issue a certificate first.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load certificate. Please try again.');
      }
      console.error('Error fetching certificate:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Certificate Not Found</h2>
            <p className="text-slate-600 mb-6">{error || 'Certificate not available.'}</p>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Certificate Card */}
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-emerald-500 p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-emerald-100 rounded-full p-4 mb-4">
              <svg className="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Certificate of Completion</h1>
            <p className="text-lg text-slate-600">This is to certify that</p>
          </div>

          {/* Student Name */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 border-b-2 border-slate-300 pb-4 inline-block px-8">
              {certificate.student_name || user?.full_name || user?.email}
            </h2>
          </div>

          {/* Course Title */}
          <div className="text-center mb-8">
            <p className="text-lg text-slate-600 mb-2">has successfully completed the course</p>
            <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">
              {certificate.course_title}
            </h3>
          </div>

          {/* Certificate Code and Date */}
          <div className="mt-12 pt-8 border-t-2 border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-sm text-slate-500 mb-1">Certificate Code</p>
                <p className="text-lg font-mono font-semibold text-slate-900">{certificate.certificate_code}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Issued On</p>
                <p className="text-lg font-semibold text-slate-900">{formatDate(certificate.issued_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
          >
            Back to Course
          </button>
          <button
            onClick={() => navigate('/student/certificates')}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
          >
            View All Certificates
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;

