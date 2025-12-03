import { useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';
import { getCategoryLabel } from '../config/courseCategories';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-200 group"
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-slate-200 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100">
            <svg className="w-20 h-20 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-2 leading-tight group-hover:text-primary-600 transition-colors">
          {course.title}
        </h3>
        
        {/* Instructor name - if available */}
        {course.teacher_name && (
          <p className="text-xs text-slate-600 mb-2 line-clamp-1">
            {course.teacher_name}
          </p>
        )}

        {/* Rating */}
        {(course.average_rating !== undefined || course.reviews_count !== undefined) && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm font-bold text-slate-900">
              {course.average_rating?.toFixed(1) ?? "0.0"}
            </span>
            <RatingStars value={course.average_rating || 0} size="xs" />
            <span className="text-xs text-slate-500">
              ({course.reviews_count || 0})
            </span>
          </div>
        )}

        {/* Level and Category */}
        <div className="flex gap-2 flex-wrap mb-3">
          <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-200">
            {course.level}
          </span>
          {course.category && (
            <span className="px-2.5 py-1 bg-secondary-50 text-secondary-700 text-xs font-semibold rounded-full border border-secondary-200">
              {getCategoryLabel(course.category)}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-slate-900">
              ${parseFloat(course.price || 0).toFixed(2)}
            </span>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

