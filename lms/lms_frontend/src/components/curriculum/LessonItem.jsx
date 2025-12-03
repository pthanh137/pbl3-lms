import { useState, useEffect, useRef } from 'react';

/**
 * Premium Lesson Item Component
 * Displays lesson with type icon, completion status, and locked state
 */
const LessonItem = ({ 
  lesson, 
  isActive, 
  isCompleted, 
  isLocked,
  isPreview = false,
  onClick 
}) => {
  const itemRef = useRef(null);

  // Scroll into view when lesson becomes active
  useEffect(() => {
    if (isActive && itemRef.current) {
      setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }, 200);
    }
  }, [isActive]);
  // Determine lesson type
  const getLessonType = () => {
    if (lesson.video_url) return 'video';
    if (lesson.content && lesson.content.trim()) return 'article';
    return 'video'; // Default
  };

  const lessonType = getLessonType();

  // Get icon for lesson type
  const getIcon = () => {
    switch (lessonType) {
      case 'video':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        );
      case 'article':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'quiz':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <button
      ref={itemRef}
      onClick={onClick}
      disabled={isLocked && !isPreview}
      className={`w-full text-left px-3 py-2.5 rounded transition-all duration-150 group relative ${
        isActive
          ? 'bg-primary-50 text-primary-900 font-semibold border-l-2 border-primary-500'
          : isLocked && !isPreview
          ? 'text-slate-400 cursor-not-allowed opacity-50'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Icon */}
        <div className={`flex-shrink-0 w-4 h-4 flex items-center justify-center ${
          isActive 
            ? 'text-primary-500' 
            : isLocked && !isPreview 
            ? 'text-slate-400' 
            : 'text-slate-500 group-hover:text-slate-700'
        }`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm leading-snug truncate ${
              isActive ? 'font-semibold' : 'font-normal'
            }`}>
              {lesson.title}
            </span>
            
            {/* Right side: Duration + Status */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {/* Preview Badge */}
              {isPreview && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold uppercase tracking-wide">
                  Preview
                </span>
              )}
              
              {/* Duration */}
              {formatDuration(lesson.duration) && (
                <span className={`text-xs whitespace-nowrap font-medium ${
                  isActive ? 'text-primary-500' : 'text-slate-500'
                }`}>
                  {formatDuration(lesson.duration)}
                </span>
              )}
              
              {/* Completion Checkmark - Coursera Style */}
              {isCompleted && (
                <div className={`flex-shrink-0 w-4 h-4 flex items-center justify-center ${
                  isActive ? 'text-primary-500' : 'text-accent-500'
                }`}>
                  <svg 
                    className="w-4 h-4"
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Locked Icon */}
              {isLocked && !isPreview && (
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400">
                  <svg 
                    className="w-4 h-4"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default LessonItem;

