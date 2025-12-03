/**
 * ProgressBar Component
 * 
 * Displays a visual progress bar with percentage
 * 
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} className - Additional CSS classes
 */
const ProgressBar = ({ progress = 0, className = '' }) => {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">Progress</span>
        <span className="text-sm font-medium text-slate-700">{Math.round(clampedProgress)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-sky-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;




