/**
 * RatingStars Component
 * Displays a visual star rating (1-5 stars)
 * 
 * Props:
 * - value: number (average rating or integer, 0-5)
 * - max?: number (default: 5)
 * - size?: "sm" | "md" (for star size)
 * - showValue?: boolean (optional: show numeric value next to stars)
 */
const RatingStars = ({ value = 0, max = 5, size = "md", showValue = false }) => {
  const rating = Math.min(Math.max(value || 0, 0), max);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, index) => {
        const starNumber = index + 1;
        let starClass = "text-slate-300";
        
        if (starNumber <= fullStars) {
          starClass = "text-yellow-400";
        } else if (starNumber === fullStars + 1 && hasHalfStar) {
          starClass = "text-yellow-400 opacity-50";
        }
        
        return (
          <svg
            key={index}
            className={`${starClass} ${sizeClasses[size]}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
      {showValue && (
        <span className={`text-slate-600 ml-1 text-sm`}>
          {rating?.toFixed(1) || "0.0"}
        </span>
      )}
    </div>
  );
};

export default RatingStars;

