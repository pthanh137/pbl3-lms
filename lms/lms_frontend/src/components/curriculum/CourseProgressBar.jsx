/**
 * Premium Course Progress Bar Component - Coursera Style
 * Displays overall course progress at the top of learning page
 */
const CourseProgressBar = ({
  progress = 0,
  completedLessons = 0,
  totalLessons = 0,
  className = ''
}) => {
  return (
    <div className={`bg-white border-b border-slate-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Progress Info */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Course Progress
                </span>
                <span className="text-base font-bold text-primary-500">
                  {Math.round(progress)}%
                </span>
              </div>
              {/* Progress Bar - Coursera Style */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats - Coursera Style */}
          {totalLessons > 0 && (
            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <span className="font-bold text-slate-900 text-base">{completedLessons}</span>
              <span className="text-slate-400 font-medium">/</span>
              <span className="text-slate-600 font-medium">{totalLessons}</span>
              <span className="text-slate-500 ml-1">lessons</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseProgressBar;

