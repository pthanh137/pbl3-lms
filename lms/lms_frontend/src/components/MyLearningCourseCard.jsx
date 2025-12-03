import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueCertificate, getMyCertificateForCourse } from '../api/client';

const MyLearningCourseCard = ({ course }) => {
  const navigate = useNavigate();
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(course.granted_certificate || false);

  const handleContinue = () => {
    // Always go to CourseLearning page with curriculum sidebar
    // This provides better UX with full curriculum view
    if (course.last_accessed_lesson_id) {
      navigate(`/courses/${course.course_id}/learn?lesson=${course.last_accessed_lesson_id}`);
    } else {
      navigate(`/courses/${course.course_id}/learn`);
    }
  };

  const handleGetCertificate = async () => {
    if (!course.course_id) return;
    
    try {
      setIssuingCertificate(true);
      await issueCertificate(course.course_id);
      // Navigate to certificate page
      navigate(`/courses/${course.course_id}/certificate`);
    } catch (err) {
      // If certificate already exists, just navigate to view it
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('already')) {
        navigate(`/courses/${course.course_id}/certificate`);
      } else {
        const errorMsg = err.response?.data?.detail || 'Failed to issue certificate. Please try again.';
        alert(errorMsg);
      }
    } finally {
      setIssuingCertificate(false);
    }
  };

  const handleViewCertificate = () => {
    navigate(`/courses/${course.course_id}/certificate`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-primary-200 transition-all duration-300 group">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-primary-100 to-secondary-100 overflow-hidden">
        {course.course_thumbnail ? (
          <img
            src={course.course_thumbnail}
            alt={course.course_title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ display: course.course_thumbnail ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <svg className="w-16 h-16 text-primary-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-xs text-slate-500 font-medium">Course Image</p>
          </div>
        </div>
        {/* Status Badge Overlay */}
        {course.status === 'completed' && (
          <div className="absolute top-3 right-3">
            <div className="bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Completed
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {course.course_title}
          </h3>
          {course.instructor_name && (
            <p className="text-sm text-slate-600">By {course.instructor_name}</p>
          )}
        </div>

        {/* Progress bar - Coursera Style */}
        <div className="mt-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
            <span>{Math.round(course.progress_percentage || 0)}% completed</span>
            <span className="text-slate-500">
              {course.completed_lessons || 0}/{course.total_lessons || 0} lessons
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(Math.max(course.progress_percentage || 0, 0), 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Status Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={
              course.status === 'completed'
                ? 'inline-flex items-center px-3 py-1 rounded-full bg-accent-50 text-accent-700 font-semibold text-xs border border-accent-200'
                : 'inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold text-xs border border-primary-200'
            }
          >
            {course.status === 'completed' ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Completed
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                In progress
              </>
            )}
          </span>
          {course.enrollment_type && (
            <span
              className={
                course.enrollment_type === 'paid'
                  ? 'inline-flex items-center px-3 py-1 rounded-full bg-secondary-50 text-secondary-700 font-semibold text-xs border border-secondary-200'
                  : 'inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200'
              }
            >
              {course.enrollment_type === 'paid' ? 'Paid' : 'Audit'}
            </span>
          )}
        </div>

        {/* Enrollment Date */}
        {course.enrolled_at && (
          <p className="text-xs text-slate-500">
            Enrolled {formatDate(course.enrolled_at)}
          </p>
        )}

        {/* Last accessed lesson */}
        {course.last_accessed_lesson_title && (
          <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
            <svg className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="line-clamp-1">
              <span className="font-medium">Last lesson:</span> {course.last_accessed_lesson_title}
            </span>
          </div>
        )}

        {/* Buttons - Coursera Style */}
        <div className="mt-auto pt-2 space-y-2">
          <button
            onClick={handleContinue}
            className="w-full px-4 py-3 text-sm font-bold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {course.status === 'completed' ? 'Review course' : 'Continue learning'}
          </button>
          
          {/* Get Certificate button - only show for completed paid courses */}
          {course.status === 'completed' && course.enrollment_type === 'paid' && (
            <button
              onClick={hasCertificate ? handleViewCertificate : handleGetCertificate}
              disabled={issuingCertificate}
              className="w-full px-4 py-3 text-sm font-bold rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none transform hover:-translate-y-0.5"
            >
              {issuingCertificate ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Issuing...
                </span>
              ) : hasCertificate ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Certificate
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Get Certificate
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLearningCourseCard;

