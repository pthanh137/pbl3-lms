import { useState, useEffect } from 'react';
import CurriculumSection from './CurriculumSection';

/**
 * Premium Curriculum Panel Component
 * Displays full curriculum with sections, lessons, and progress
 */
const CurriculumPanel = ({
  curriculum,
  currentLessonId,
  completedLessonIds = [],
  isEnrolled = true,
  onLessonClick,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Auto-expand section containing current lesson
  useEffect(() => {
    if (currentLessonId && curriculum?.sections) {
      const lessonIdNum = parseInt(currentLessonId);
      for (const section of curriculum.sections) {
        if (section.lessons?.some(lesson => {
          const lessonId = parseInt(lesson.id) || lesson.id;
          return lessonId === lessonIdNum || lessonId === currentLessonId;
        })) {
          setExpandedSections(prev => new Set([...prev, section.id]));
          break;
        }
      }
    }
  }, [currentLessonId, curriculum]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (!curriculum?.sections || curriculum.sections.length === 0) {
    return (
      <div className={`p-5 ${className}`}>
        <p className="text-slate-500 text-sm">No content available</p>
      </div>
    );
  }

  // Calculate total course stats
  const allLessons = curriculum.sections.flatMap(section => section.lessons || []);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter(lesson => 
    completedLessonIds.includes(lesson.id)
  ).length;
  const totalDuration = allLessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header - Coursera Style */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-white flex-shrink-0">
        <h2 className="text-xs font-bold text-slate-900 mb-2.5 uppercase tracking-wider">
          Course Content
        </h2>
        {totalLessons > 0 && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="text-slate-600 font-medium">
              {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
            </span>
            {totalDuration > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">
                  {formatDuration(totalDuration)}
                </span>
              </>
            )}
            {isEnrolled && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-primary-500">
                  {completedLessons}/{totalLessons} completed
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="py-1">
          {curriculum.sections.map((section, index) => (
            <CurriculumSection
              key={section.id}
              section={section}
              sectionIndex={index + 1}
              lessons={section.lessons || []}
              currentLessonId={currentLessonId}
              completedLessonIds={completedLessonIds}
              isEnrolled={isEnrolled}
              onLessonClick={onLessonClick}
              defaultExpanded={expandedSections.has(section.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurriculumPanel;

