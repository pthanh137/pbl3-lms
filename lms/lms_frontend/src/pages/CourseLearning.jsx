import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { coursesAPI, lessonsAPI, enrollmentsAPI, issueCertificate } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LessonPlayer from '../components/lesson/LessonPlayer';
import CurriculumPanel from '../components/curriculum/CurriculumPanel';
import CourseProgressBar from '../components/curriculum/CourseProgressBar';

const CourseLearning = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [enrollmentType, setEnrollmentType] = useState(null);
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  // Get lesson ID from URL params or use first lesson
  const lessonIdFromUrl = searchParams.get('lesson');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCourseData();
  }, [courseId, isAuthenticated, navigate]);

  useEffect(() => {
    if (curriculum && !currentLesson && !loading) {
      // If lesson ID in URL, load that lesson
      if (lessonIdFromUrl) {
        loadLesson(lessonIdFromUrl);
      } else {
        // Otherwise, load first lesson
        const firstLesson = getFirstLesson();
        if (firstLesson) {
          navigate(`/courses/${courseId}/learn?lesson=${firstLesson.id}`, { replace: true });
          loadLesson(firstLesson.id);
        }
      }
    }
  }, [curriculum, lessonIdFromUrl, courseId, navigate]);

  // Update isCompleted when curriculum or completedLessonIds change
  useEffect(() => {
    if (currentLesson) {
      const lessonId = parseInt(currentLesson.id);
      // Check from completedLessonIds first (more reliable)
      const isInCompletedList = completedLessonIds.includes(lessonId);
      
      // Also check from curriculum
      let foundInCurriculum = false;
      if (curriculum?.sections) {
        for (const section of curriculum.sections) {
          if (section.lessons) {
            const lesson = section.lessons.find(l => parseInt(l.id) === lessonId || l.id === lessonId);
            if (lesson?.is_completed) {
              foundInCurriculum = true;
              break;
            }
          }
        }
      }
      
      const shouldBeCompleted = isInCompletedList || foundInCurriculum;
      console.log('Checking lesson completion:', {
        lessonId,
        isInCompletedList,
        foundInCurriculum,
        shouldBeCompleted,
        completedLessonIds,
        hasCurriculum: !!curriculum
      });
      setIsCompleted(shouldBeCompleted);
    } else {
      // Reset when no lesson is loaded
      setIsCompleted(false);
    }
  }, [currentLesson, curriculum, completedLessonIds]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [courseResponse, curriculumResponse] = await Promise.all([
        coursesAPI.getById(courseId),
        coursesAPI.getCurriculum(courseId),
      ]);
      const courseData = courseResponse.data;
      setCourse(courseData);
      setCurriculum(curriculumResponse.data);
      // Get enrollment type from course data
      setEnrollmentType(courseData.enrollment_type || null);
      
      // Fetch enrollment and completed lessons after curriculum is set
      await fetchEnrollmentData(curriculumResponse.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('You must enroll in this course first to access lessons.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load course. Please try again.');
      }
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async (curriculumData = null) => {
    try {
      const response = await enrollmentsAPI.getMyEnrollments();
      let enrollments = [];
      if (Array.isArray(response.data)) {
        enrollments = response.data;
      } else if (response.data?.results) {
        enrollments = response.data.results;
      }
      
      const courseEnrollment = enrollments.find(e => 
        e.course?.id === parseInt(courseId) || e.course_id === parseInt(courseId)
      );
      
      if (courseEnrollment) {
        setEnrollment(courseEnrollment);
      }
      
      // Get completed lesson IDs from curriculum (curriculum now includes is_completed from backend)
      const curriculumToUse = curriculumData || curriculum;
      if (curriculumToUse?.sections) {
        const completed = [];
        for (const section of curriculumToUse.sections) {
          if (section.lessons) {
            for (const lesson of section.lessons) {
              // Check both is_completed field and ensure we parse the ID correctly
              const lessonId = parseInt(lesson.id) || lesson.id;
              if (lesson.is_completed === true) {
                completed.push(lessonId);
              }
            }
          }
        }
        console.log('Loaded completed lesson IDs from curriculum:', completed);
        setCompletedLessonIds(completed);
      }
    } catch (err) {
      console.error('Error fetching enrollment:', err);
    }
  };

  // Refresh enrollment to get updated progress
  const refreshEnrollment = async () => {
    try {
      const response = await enrollmentsAPI.getMyEnrollments();
      let enrollments = [];
      if (Array.isArray(response.data)) {
        enrollments = response.data;
      } else if (response.data?.results) {
        enrollments = response.data.results;
      }
      
      const courseEnrollment = enrollments.find(e => 
        e.course?.id === parseInt(courseId) || e.course_id === parseInt(courseId)
      );
      
      if (courseEnrollment) {
        setEnrollment(courseEnrollment);
      }
    } catch (err) {
      console.error('Error refreshing enrollment:', err);
    }
  };

  const getFirstLesson = () => {
    if (!curriculum?.sections) return null;
    
    for (const section of curriculum.sections) {
      if (section.lessons && section.lessons.length > 0) {
        return section.lessons[0];
      }
    }
    return null;
  };

  const loadLesson = async (lessonId) => {
    try {
      setLoading(true);
      const response = await lessonsAPI.getById(lessonId);
      const lessonData = response.data;
      setCurrentLesson(lessonData);
      
      // Check if lesson is already completed from completedLessonIds or curriculum
      const isInCompletedList = completedLessonIds.includes(parseInt(lessonId));
      
      let foundInCurriculum = false;
      if (curriculum?.sections) {
        for (const section of curriculum.sections) {
          if (section.lessons) {
            const lesson = section.lessons.find(l => l.id === parseInt(lessonId));
            if (lesson?.is_completed) {
              foundInCurriculum = true;
              break;
            }
          }
        }
      }
      
      setIsCompleted(isInCompletedList || foundInCurriculum);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('You must enroll in this course first to access lessons.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load lesson. Please try again.');
      }
      console.error('Error fetching lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonId) => {
    navigate(`/courses/${courseId}/learn?lesson=${lessonId}`);
    loadLesson(lessonId);
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleComplete = async () => {
    if (!currentLesson || isCompleted) {
      console.log('Cannot complete lesson:', { currentLesson: !!currentLesson, isCompleted });
      return;
    }
    
    console.log('Starting to complete lesson:', currentLesson.id);
    
    try {
      setLoading(true);
      // Mark lesson as completed via API
      const response = await enrollmentsAPI.completeLesson(currentLesson.id);
      console.log('Lesson completed API response:', response.data);
      
      // Update local state immediately
      setIsCompleted(true);
      const lessonId = parseInt(currentLesson.id);
      const newCompletedIds = completedLessonIds.includes(lessonId) 
        ? completedLessonIds 
        : [...completedLessonIds, lessonId];
      setCompletedLessonIds(newCompletedIds);
      console.log('Updated completedLessonIds:', newCompletedIds);
      
      // Update curriculum locally to reflect completed status immediately
      if (curriculum?.sections) {
        const updatedCurriculum = { ...curriculum };
        updatedCurriculum.sections = curriculum.sections.map(section => ({
          ...section,
          lessons: section.lessons?.map(lesson => 
            (parseInt(lesson.id) === lessonId || lesson.id === lessonId) 
              ? { ...lesson, is_completed: true } 
              : lesson
          )
        }));
        setCurriculum(updatedCurriculum);
        console.log('Updated curriculum locally');
      }
      
      // Refresh enrollment to get updated progress_percent
      await refreshEnrollment();
      
      // Refresh curriculum from server to ensure consistency
      // But keep the local completed state to avoid flickering
      try {
        const curriculumResponse = await coursesAPI.getCurriculum(courseId);
        const serverCurriculum = curriculumResponse.data;
        
        // Merge server data with local completed state
        if (serverCurriculum?.sections && newCompletedIds.length > 0) {
          serverCurriculum.sections = serverCurriculum.sections.map(section => ({
            ...section,
            lessons: section.lessons?.map(lesson => {
              const isCompletedLocally = newCompletedIds.includes(parseInt(lesson.id) || lesson.id);
              return {
                ...lesson,
                is_completed: isCompletedLocally || lesson.is_completed
              };
            })
          }));
        }
        
        setCurriculum(serverCurriculum);
        
        // Update completed lesson IDs from refreshed curriculum
        if (serverCurriculum?.sections) {
          const completed = [];
          for (const section of serverCurriculum.sections) {
            if (section.lessons) {
              for (const lesson of section.lessons) {
                if (lesson.is_completed) {
                  completed.push(lesson.id);
                }
              }
            }
          }
          setCompletedLessonIds(completed);
          console.log('Refreshed completedLessonIds from server:', completed);
        }
      } catch (err) {
        console.error('Error refreshing curriculum:', err);
        // Don't fail the whole operation if curriculum refresh fails
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      alert(err.response?.data?.detail || err.message || 'Failed to mark lesson as completed.');
      setIsCompleted(false); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleNextLesson = () => {
    const next = getNextLesson();
    if (next) {
      handleLessonClick(next.id);
    }
  };

  const getNextLesson = () => {
    if (!curriculum?.sections || !currentLesson) return null;
    
    let found = false;
    for (const section of curriculum.sections) {
      if (!section.lessons) continue;
      for (let i = 0; i < section.lessons.length; i++) {
        if (found) {
          return section.lessons[i];
        }
        if (section.lessons[i].id === currentLesson.id) {
          found = true;
        }
      }
    }
    return null;
  };

  const getPrevLesson = () => {
    if (!curriculum?.sections || !currentLesson) return null;
    
    let prevLesson = null;
    for (const section of curriculum.sections) {
      if (!section.lessons) continue;
      for (let i = 0; i < section.lessons.length; i++) {
        if (section.lessons[i].id === currentLesson.id) {
          return prevLesson;
        }
        prevLesson = section.lessons[i];
      }
    }
    return null;
  };

  if (loading && !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          <p className="mt-4 text-slate-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-700 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();

  // Calculate course progress - use enrollment progress_percent if available, otherwise calculate from lessons
  const allLessons = curriculum?.sections?.flatMap(section => section.lessons || []) || [];
  const totalLessons = allLessons.length;
  const completedLessons = completedLessonIds.length;
  const calculatedProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  // Use enrollment progress_percent if available, otherwise use calculated progress
  const courseProgress = enrollment?.progress_percent ?? calculatedProgress;
  const isEnrolled = !!enrollment;
  const isCourseCompleted = courseProgress >= 100;

  const handleIssueCertificate = async () => {
    if (!courseId) return;
    
    try {
      setIssuingCertificate(true);
      await issueCertificate(courseId);
      // Navigate to certificate page
      navigate(`/courses/${courseId}/certificate`);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to issue certificate. Please try again.';
      alert(errorMsg);
    } finally {
      setIssuingCertificate(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar - Coursera Style */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? (
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <h1 className="text-lg font-bold text-slate-900">{course?.title || 'Course'}</h1>
        </div>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition"
          title="Back to course"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Course Progress Bar */}
      {isEnrolled && totalLessons > 0 && (
        <CourseProgressBar
          progress={courseProgress}
          completedLessons={completedLessons}
          totalLessons={totalLessons}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Curriculum */}
        <div
          className={`${
            sidebarOpen 
              ? 'translate-x-0 lg:w-80' 
              : '-translate-x-full lg:translate-x-0 lg:w-0'
          } fixed lg:static inset-y-0 left-0 z-30 w-80 bg-white border-r border-slate-200 overflow-hidden transition-all duration-300 ${
            !sidebarOpen ? 'lg:overflow-hidden lg:border-r-0' : ''
          }`}
        >
          {sidebarOpen && (
            <CurriculumPanel
              curriculum={curriculum}
              currentLessonId={currentLesson?.id}
              completedLessonIds={completedLessonIds}
              isEnrolled={isEnrolled}
              onLessonClick={handleLessonClick}
              className="h-full"
            />
          )}
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
              {/* Certificate CTA - Coursera Style */}
              {user?.role === 'student' && enrollmentType === 'paid' && isCourseCompleted && (
                <div className="bg-accent-50 border border-accent-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-accent-800">Course completed</p>
                    <p className="text-sm text-accent-700">You can now get your certificate of completion.</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition disabled:opacity-50 font-medium"
                    onClick={handleIssueCertificate}
                    disabled={issuingCertificate}
                  >
                    {issuingCertificate ? 'Issuing...' : 'Get Certificate'}
                  </button>
                </div>
              )}

              {/* Premium Video Player */}
              {(currentLesson.video_url || currentLesson.document_file_url) && (
                <LessonPlayer
                  lesson={currentLesson}
                  videoUrl={currentLesson.video_url}
                  onComplete={handleComplete}
                  onNextLesson={handleNextLesson}
                  isCompleted={isCompleted}
                />
              )}

              {/* Lesson Info - Coursera Style */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3 leading-tight break-words">
                  {currentLesson.title}
                </h1>
                {currentLesson.duration > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-slate-600 font-medium">
                      Duration: {Math.floor(currentLesson.duration / 60)}:
                      {(currentLesson.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}

                {currentLesson.content && (
                  <div className="prose prose-slate max-w-none mb-6">
                    <div className="text-slate-700 leading-relaxed space-y-4 text-justify">
                      {currentLesson.content.split('\n').map((paragraph, index) => {
                        if (paragraph.trim() === '') return null;
                        return (
                          <p key={index} className="text-base leading-7 break-words hyphens-auto">
                            {paragraph.trim()}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions - Coursera Style */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center pt-6 border-t border-slate-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked:', { 
                        isCompleted, 
                        loading, 
                        currentLesson: currentLesson?.id,
                        completedLessonIds 
                      });
                      if (!isCompleted && !loading && currentLesson) {
                        handleComplete();
                      } else {
                        console.log('Button click ignored:', { isCompleted, loading, hasLesson: !!currentLesson });
                      }
                    }}
                    disabled={isCompleted || loading}
                    className={`px-6 py-3 rounded-lg font-medium transition flex-shrink-0 ${
                      isCompleted
                        ? 'bg-accent-500 text-white cursor-not-allowed'
                        : loading
                        ? 'bg-primary-400 text-white cursor-wait'
                        : 'bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? 'Completed ✓' : loading ? 'Marking...' : 'Mark as Completed'}
                  </button>

                  <div className="flex gap-2 sm:ml-auto">
                    {prevLesson && (
                      <button
                        onClick={() => handleLessonClick(prevLesson.id)}
                        className="px-4 py-3 rounded-lg font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 transition flex-1 sm:flex-none"
                      >
                        ← Previous
                      </button>
                    )}
                    {nextLesson && (
                      <button
                        onClick={() => handleLessonClick(nextLesson.id)}
                        className="px-4 py-3 rounded-lg font-medium bg-primary-500 hover:bg-primary-600 text-white transition flex-1 sm:flex-none"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-600">Select a lesson to start learning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLearning;

