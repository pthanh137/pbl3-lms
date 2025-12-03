/**
 * TeacherCourseCard Component
 * 
 * Udemy-style course card for teacher dashboard.
 * Props:
 * - course: Course object with id, title, subtitle, thumbnail_url, price, level, category, is_published
 * - onView: callback when "View" button is clicked
 * - onEdit: callback when "Edit Course" button is clicked
 * - onManageQuizzes: callback when "Manage Quizzes" button is clicked
 * - onManageAssignments: callback when "Manage Assignments" button is clicked
 * - onManageStudents: callback when "Manage Students" button is clicked
 */
import RatingStars from './RatingStars';

const TeacherCourseCard = ({ course, onView, onEdit, onManageQuizzes, onManageAssignments, onManageStudents }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-slate-200 hover:border-primary-200 flex flex-col group">
      {/* Thumbnail with overlay on hover */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 overflow-hidden">
        {course.thumbnail_url ? (
          <>
            <img
              src={course.thumbnail_url}
              alt={course.title || 'Course'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-2">📚</div>
              <div className="text-xs text-slate-500 font-medium">No thumbnail</div>
            </div>
          </div>
        )}
        {/* Status badge on thumbnail - Coursera Style */}
        <div className="absolute top-3 right-3">
          <span
            className={
              course.is_published
                ? 'bg-accent-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1'
                : 'bg-slate-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg'
            }
          >
            {course.is_published ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Published
              </>
            ) : (
              'Draft'
            )}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-xl text-slate-900 line-clamp-2 mb-2 group-hover:text-primary-500 transition-colors">
          {course.title || 'Untitled Course'}
        </h3>

        {/* Subtitle */}
        {course.subtitle && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {course.subtitle}
          </p>
        )}

        {/* Rating display */}
        {(course.average_rating !== undefined || course.reviews_count !== undefined) && (
          <div className="flex items-center gap-1.5 text-sm text-slate-700 mb-4">
            <span className="font-bold text-slate-900">
              {course.average_rating?.toFixed(1) ?? "0.0"}
            </span>
            <RatingStars value={course.average_rating || 0} size="sm" />
            <span className="text-xs text-slate-500">
              ({course.reviews_count || 0})
            </span>
          </div>
        )}

        {/* Level and Category Tags - Coursera Style */}
        <div className="flex flex-wrap gap-2 mb-4">
          {course.level && (
            <span className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold capitalize border border-primary-200">
              {course.level}
            </span>
          )}
          {course.category && (
            <span className="px-3 py-1.5 rounded-full bg-secondary-50 text-secondary-700 text-xs font-semibold border border-secondary-200">
              {course.category}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-5">
          <span className="text-2xl font-bold text-slate-900">
            {course.price ? `$${parseFloat(course.price).toFixed(2)}` : 'Free'}
          </span>
        </div>

        {/* Action Buttons - Coursera Style */}
        <div className="mt-auto space-y-2.5">
          <div className="flex gap-2">
            <button
              onClick={onView}
              className="flex-1 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </button>
            <button
              onClick={onEdit}
              className="flex-1 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
          
          <button
            onClick={onManageQuizzes}
            className="w-full bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Manage Quizzes
          </button>
          
          <button
            onClick={onManageAssignments}
            className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Manage Assignments
          </button>
          
          <button
            onClick={onManageStudents}
            className="w-full bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Manage Students
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseCard;
