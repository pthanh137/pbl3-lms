import { useState, useEffect } from 'react';
import LessonItem from './LessonItem';

/**
 * Premium Curriculum Section Component
 * Displays section with expand/collapse, progress, and lessons
 */
const CurriculumSection = ({
  section,
  sectionIndex,
  lessons = [],
  currentLessonId,
  completedLessonIds = [],
  isEnrolled = true,
  onLessonClick,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Sync with defaultExpanded prop
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  // Calculate section duration
  const sectionDuration = lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);

  // Calculate section progress
  const completedCount = lessons.filter(lesson => 
    completedLessonIds.includes(lesson.id)
  ).length;
  const progressPercentage = lessons.length > 0 
    ? (completedCount / lessons.length) * 100 
    : 0;

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return null;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="border-b border-slate-100 last:border-b-0 bg-white">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors duration-150 group"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            <svg
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-all duration-200 ${
                isExpanded ? 'rotate-90 text-slate-600' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Section Title */}
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">
              {section.title}
            </h3>
          </div>
        </div>

        {/* Section Stats */}
        <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
          {/* Lesson Count & Duration */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="whitespace-nowrap font-medium">
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
            {sectionDuration > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="whitespace-nowrap">
                  {formatDuration(sectionDuration)}
                </span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Lessons List - Coursera Style */}
      {isExpanded && lessons.length > 0 && (
        <div className="pl-10 pr-2 pb-2.5 space-y-0.5 bg-slate-50/50">
          {lessons.map((lesson, index) => {
            const lessonId = parseInt(lesson.id) || lesson.id;
            const currentId = parseInt(currentLessonId) || currentLessonId;
            const isActive = lessonId === currentId;
            const isCompleted = completedLessonIds.includes(lessonId) || 
                               completedLessonIds.includes(parseInt(lesson.id)) ||
                               lesson.is_completed === true;
            const isLocked = !isEnrolled; // For now, all lessons are unlocked if enrolled
            
            return (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                isActive={isActive}
                isCompleted={isCompleted}
                isLocked={isLocked}
                isPreview={false} // TODO: Add is_preview from backend
                onClick={() => onLessonClick(lesson.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CurriculumSection;

