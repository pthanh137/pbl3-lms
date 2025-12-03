import { useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';

const InstructorCard = ({ instructor }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/instructor/${instructor.id}/profile`);
  };

  const getAvatarUrl = () => {
    if (instructor.avatar_url) {
      return instructor.avatar_url;
    }
    const name = instructor.full_name || 'Instructor';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5624d0&color=fff&size=128`;
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-slate-200 rounded-xl p-6 min-w-[240px] cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-primary-300 hover:-translate-y-1 group"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img
            src={getAvatarUrl()}
            alt={instructor.full_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 group-hover:border-primary-300 transition-colors"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.full_name || 'I')}&background=0056D2&color=fff&size=128`;
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full border-4 border-white flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 text-base group-hover:text-primary-600 transition-colors">
          {instructor.full_name}
        </h3>
        {instructor.headline && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2 min-h-[2.5rem]">
            {instructor.headline}
          </p>
        )}
        {instructor.average_rating > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-base font-bold text-slate-900">
              {instructor.average_rating.toFixed(1)}
            </span>
            <RatingStars value={instructor.average_rating} size="xs" />
            <span className="text-xs text-slate-500">
              ({instructor.total_reviews})
            </span>
          </div>
        )}
        <div className="w-full pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-semibold">{instructor.total_courses}</span>
            <span>{instructor.total_courses === 1 ? 'course' : 'courses'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-semibold">{instructor.total_students.toLocaleString()}</span>
            <span>{instructor.total_students === 1 ? 'student' : 'students'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCard;

