import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesAPI, reviewsAPI, getInstructorProfile, purchaseCourse, addToCart, studentQuizAPI, studentAssignmentAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import RatingStars from '../../components/RatingStars';
import CourseReviewList from '../../components/CourseReviewList';
import QuizStatusBadge from '../../components/QuizStatusBadge';
import AssignmentStatusBadge from '../../components/AssignmentStatusBadge';

const CourseLandingPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [ratingSummary, setRatingSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizStatuses, setQuizStatuses] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [assignmentScores, setAssignmentScores] = useState({});

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (course?.teacher_id) {
      fetchInstructorProfile(course.teacher_id);
    }
  }, [course?.teacher_id]);

  useEffect(() => {
    const isEnrolled = course?.is_enrolled || false;
    if (isEnrolled && isAuthenticated && user?.role === 'student') {
      fetchQuizzes();
      fetchAssignments();
    }
  }, [course?.is_enrolled, isAuthenticated, user?.role, courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [courseResponse, curriculumResponse, summaryResponse, reviewsResponse] = await Promise.all([
        coursesAPI.getById(courseId),
        coursesAPI.getCurriculum(courseId),
        reviewsAPI.getCourseRatingSummary(courseId).catch(() => ({ data: { average_rating: 0, total_reviews: 0 } })),
        reviewsAPI.getCourseReviews(courseId).catch(() => ({ data: [] })),
      ]);

      setCourse(courseResponse.data);
      setCurriculum(curriculumResponse.data);
      
      setRatingSummary(summaryResponse.data || { average_rating: 0, total_reviews: 0 });
      
      let reviewsData = [];
      if (Array.isArray(reviewsResponse.data)) {
        reviewsData = reviewsResponse.data;
      } else if (reviewsResponse.data?.results) {
        reviewsData = reviewsResponse.data.results;
      }
      setReviews(reviewsData.slice(0, 10)); // Show first 10 reviews
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load course. Please try again.');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorProfile = async (instructorId) => {
    try {
      const response = await getInstructorProfile(instructorId);
      setInstructor(response.data);
    } catch (err) {
      console.error('Error fetching instructor profile:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const response = await studentQuizAPI.getCourseQuizzes(courseId);
      let quizzesData = [];
      if (Array.isArray(response.data)) {
        quizzesData = response.data;
      } else if (response.data?.results) {
        quizzesData = response.data.results;
      }
      
      const publishedQuizzes = quizzesData.filter(q => q.is_published !== false);
      setQuizzes(publishedQuizzes);

      // Fetch quiz statuses and results
      const statusMap = {};
      const resultsMap = {};
      for (const quiz of publishedQuizzes) {
        try {
          const attemptResponse = await studentQuizAPI.getMyQuizAttempt(quiz.id);
          const attempt = attemptResponse.data;
          
          if (attempt && attempt.status) {
            if (attempt.status === 'completed') {
              statusMap[quiz.id] = 'completed';
              resultsMap[quiz.id] = {
                score: attempt.score || 0,
                total_points: attempt.total_points || quiz.total_points || 0,
                percentage: attempt.percentage || 0
              };
            } else {
              statusMap[quiz.id] = 'in_progress';
            }
          } else {
            statusMap[quiz.id] = 'not_started';
          }
        } catch (err) {
          // No attempt found or error
          statusMap[quiz.id] = 'not_started';
        }
      }
      setQuizStatuses(statusMap);
      setQuizResults(resultsMap);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const response = await studentAssignmentAPI.getCourseAssignments(courseId);
      let assignmentsData = [];
      if (Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response.data?.results) {
        assignmentsData = response.data.results;
      }
      
      const publishedAssignments = assignmentsData.filter(a => a.is_published !== false);
      setAssignments(publishedAssignments);

      // Fetch submission statuses
      const statusMap = {};
      const scoresMap = {};
      for (const assignment of publishedAssignments) {
        try {
          const submissionResponse = await studentAssignmentAPI.getMySubmission(assignment.id);
          const submission = submissionResponse.data;
          
          if (submission) {
            if (submission.grade !== null && submission.grade !== undefined) {
              statusMap[assignment.id] = 'graded';
              scoresMap[assignment.id] = {
                grade: submission.grade,
                max_points: assignment.max_points || 0,
                feedback: submission.feedback
              };
            } else {
              statusMap[assignment.id] = 'submitted';
            }
          } else {
            statusMap[assignment.id] = 'not_submitted';
          }
        } catch (err) {
          statusMap[assignment.id] = 'not_submitted';
        }
      }
      setAssignmentStatuses(statusMap);
      setAssignmentScores(scoresMap);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handlePurchase = async (mode = 'paid') => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectCourseId', courseId);
      navigate('/login');
      return;
    }

    if (user?.role !== 'student') {
      alert('Only students can purchase courses.');
      return;
    }

    if (course?.teacher_id === user?.id) {
      alert('You cannot purchase your own course.');
      return;
    }

    // For paid purchases, navigate to payment page
    if (mode === 'paid') {
      navigate(`/courses/${courseId}/payment`, { state: { mode: 'paid' } });
      return;
    }

    // For audit mode, purchase directly
    try {
      setPurchasing(true);
      await purchaseCourse(courseId, mode);
      alert('You are now auditing this course.');
      fetchCourseData(); // Refresh to update enrollment status
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to enroll. Please try again.';
      alert(errorMsg);
    } finally {
      setPurchasing(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectCourseId', courseId);
      navigate('/login');
      return;
    }

    if (user?.role !== 'student') {
      alert('Only students can add courses to cart.');
      return;
    }

    try {
      setAddingToCart(true);
      const response = await addToCart(courseId);
      if (response.data.already_in_cart) {
        alert('This course is already in your cart.');
      } else {
        alert('Course added to cart!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to add to cart. Please try again.';
      alert(errorMsg);
    } finally {
      setAddingToCart(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate total course duration
  const totalDuration = curriculum?.sections?.reduce((total, section) => {
    return total + (section.lessons?.reduce((sectionTotal, lesson) => {
      return sectionTotal + (lesson.duration || 0);
    }, 0) || 0);
  }, 0) || 0;

  // Count total lessons
  const totalLessons = curriculum?.sections?.reduce((total, section) => {
    return total + (section.lessons?.length || 0);
  }, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-16">
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-4">
                <div className="h-64 bg-slate-200 rounded"></div>
                <div className="h-32 bg-slate-200 rounded"></div>
              </div>
              <div className="h-96 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Course not found</h1>
          <p className="text-slate-600 mb-4">{error || 'The course you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const isEnrolled = course.is_enrolled || false;
  const enrollmentType = course.enrollment_type || null;
  const isTeacher = user?.role === 'teacher' && course.teacher_id === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white pb-16">
      <div className="max-w-7xl mx-auto px-6 pt-8 grid gap-8 lg:grid-cols-[2fr,1fr]">
        {/* LEFT COLUMN - Course Content */}
        <div className="space-y-10">
          {/* HERO SECTION - Coursera Style */}
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 leading-tight">{course.title}</h1>
            {course.subtitle && (
              <p className="text-xl text-slate-600 mb-6 font-medium">{course.subtitle}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-2">
                <RatingStars value={ratingSummary.average_rating || 0} size="sm" />
                <span className="font-bold text-slate-900 text-lg">
                  {ratingSummary.average_rating ? ratingSummary.average_rating.toFixed(1) : '0.0'}
                </span>
                <span className="text-sm text-slate-600">
                  ({ratingSummary.total_reviews || 0} {ratingSummary.total_reviews === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
              
              {course.level && (
                <span className="px-4 py-2 bg-primary-50 text-primary-700 text-sm font-semibold rounded-full border border-primary-200">
                  {course.level}
                </span>
              )}
              
              {course.category && (
                <span className="px-4 py-2 bg-secondary-50 text-secondary-700 text-sm font-semibold rounded-full border border-secondary-200">
                  {course.category}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 pt-4 border-t border-slate-200">
              {course.updated_at && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium">Last updated: {formatDate(course.updated_at)}</span>
                </div>
              )}
              {totalLessons > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-medium">{totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}</span>
                </div>
              )}
              {totalDuration > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Total duration: {formatDuration(totalDuration)}</span>
                </div>
              )}
            </div>
          </div>

          {/* WHAT YOU'LL LEARN - Coursera Style */}
          {course.description && (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">What you'll learn</h2>
              <div className="prose max-w-none">
                <p className="text-lg text-slate-700 whitespace-pre-line leading-relaxed">{course.description}</p>
              </div>
            </div>
          )}

          {/* COURSE DESCRIPTION */}
          {course.description && (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Course Description</h2>
              <div className="prose max-w-none text-slate-700">
                <p className="text-lg whitespace-pre-line leading-relaxed">{course.description}</p>
              </div>
            </div>
          )}

          {/* INSTRUCTOR SECTION - Coursera Style */}
          {course.teacher_id && (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Instructor</h2>
              {instructor ? (
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img
                      src={instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.full_name || 'Instructor')}&background=0056D2&color=fff&size=128`}
                      alt={instructor.full_name || 'Instructor'}
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.full_name || 'Instructor')}&background=0056D2&color=fff&size=128`;
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent-500 rounded-full border-4 border-white flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {instructor.full_name || course.teacher_name || 'Instructor'}
                    </h3>
                    {instructor.headline && (
                      <p className="text-base text-slate-600 mb-4">{instructor.headline}</p>
                    )}
                    {instructor.stats && (
                      <div className="flex flex-wrap items-center gap-6 text-sm mb-4">
                        {instructor.stats.average_rating > 0 && (
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <RatingStars value={instructor.stats.average_rating} size="sm" />
                            <span className="font-bold text-slate-900">
                              {instructor.stats.average_rating.toFixed(1)}
                            </span>
                            <span className="text-slate-600">({instructor.stats.total_reviews || 0} {instructor.stats.total_reviews === 1 ? 'review' : 'reviews'})</span>
                          </div>
                        )}
                        {instructor.stats.total_courses > 0 && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="font-semibold text-slate-700">{instructor.stats.total_courses} {instructor.stats.total_courses === 1 ? 'course' : 'courses'}</span>
                          </div>
                        )}
                        {instructor.stats.total_students > 0 && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-semibold text-slate-700">{instructor.stats.total_students} {instructor.stats.total_students === 1 ? 'student' : 'students'}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/instructor/${course.teacher_id}/profile`)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      View instructor profile
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {course.teacher_name || 'Instructor'}
                    </h3>
                    <p className="text-base text-slate-600">Learn from an experienced instructor</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CURRICULUM - Coursera Style */}
          {curriculum?.sections && curriculum.sections.length > 0 && (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Course Curriculum</h2>
              <div className="space-y-3">
                {curriculum.sections.map((section, sectionIndex) => (
                  <details
                    key={section.id}
                    className="bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden hover:border-primary-200 transition"
                    open={sectionIndex === 0}
                  >
                    <summary className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition font-bold text-slate-900 flex items-center justify-between">
                      <span className="text-lg">{section.title}</span>
                      <span className="text-sm font-normal text-slate-600 bg-white px-3 py-1 rounded-full">
                        {section.lessons?.length || 0} {section.lessons?.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </summary>
                    <div className="bg-white divide-y divide-slate-100">
                      {section.lessons?.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="px-6 py-4 flex items-center justify-between hover:bg-primary-50 transition"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                              {lessonIndex + 1}
                            </div>
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-slate-900 font-medium">{lesson.title}</span>
                            </div>
                          </div>
                          {lesson.duration > 0 && (
                            <span className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full">
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* QUIZZES SECTION - Coursera Style */}
          {isEnrolled && isAuthenticated && user?.role === 'student' && (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Course Quizzes</h2>
              
              {loadingQuizzes && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <p className="mt-2 text-sm text-slate-600">Loading quizzes...</p>
                </div>
              )}

              {!loadingQuizzes && quizzes.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-slate-600">No quizzes available for this course yet.</p>
                </div>
              )}

              {!loadingQuizzes && quizzes.length > 0 && (
                <div className="space-y-4">
                  {quizzes.map(quiz => {
                    const status = quizStatuses[quiz.id] || 'not_started';
                    const result = quizResults[quiz.id];
                    const isCompleted = status === 'completed';
                    
                    return (
                      <div
                        key={quiz.id}
                        className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 hover:border-primary-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold text-slate-900">{quiz.title}</h3>
                              <QuizStatusBadge status={status} />
                            </div>
                            {quiz.description && (
                              <p className="text-sm text-slate-600 mb-3 leading-relaxed">{quiz.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                              {quiz.total_points > 0 && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                  </svg>
                                  <span className="font-medium">{quiz.total_points} {quiz.total_points === 1 ? 'point' : 'points'}</span>
                                </div>
                              )}
                              {quiz.time_limit > 0 && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">Time limit: {Math.floor(quiz.time_limit / 60)} minutes</span>
                                </div>
                              )}
                              {isCompleted && result && (
                                <div className="flex items-center gap-2 bg-accent-50 px-3 py-1 rounded-full border border-accent-200">
                                  <span className="font-bold text-accent-700">
                                    Score: {result.score}/{result.total_points} ({result.percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/courses/${courseId}/quizzes/${quiz.id}/take`)}
                            className="flex-shrink-0 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            {isCompleted ? 'Review' : status === 'in_progress' ? 'Continue' : 'Start Quiz'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ASSIGNMENTS SECTION - Coursera Style */}
          {isEnrolled && isAuthenticated && user?.role === 'student' && (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Course Assignments</h2>
              
              {loadingAssignments && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <p className="mt-2 text-sm text-slate-600">Loading assignments...</p>
                </div>
              )}

              {!loadingAssignments && assignments.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-slate-600">No assignments available for this course yet.</p>
                </div>
              )}

              {!loadingAssignments && assignments.length > 0 && (
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const status = assignmentStatuses[assignment.id] || 'not_submitted';
                    const score = assignmentScores[assignment.id];
                    const formatDate = (dateString) => {
                      if (!dateString) return null;
                      const date = new Date(dateString);
                      return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                    };
                    
                    return (
                      <div
                        key={assignment.id}
                        className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 hover:border-primary-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                              <AssignmentStatusBadge status={status} />
                            </div>
                            {assignment.description && (
                              <p className="text-sm text-slate-600 mb-3 leading-relaxed">{assignment.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                              {assignment.max_points > 0 && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                  </svg>
                                  <span className="font-medium">{assignment.max_points} {assignment.max_points === 1 ? 'point' : 'points'}</span>
                                </div>
                              )}
                              {assignment.due_date && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">Due: {formatDate(assignment.due_date)}</span>
                                </div>
                              )}
                              {status === 'graded' && score && (
                                <div className="flex items-center gap-2 bg-accent-50 px-3 py-1 rounded-full border border-accent-200">
                                  <span className="font-bold text-accent-700">
                                    Grade: {score.grade}/{score.max_points}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/courses/${courseId}/assignments/${assignment.id}`)}
                            className="flex-shrink-0 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            {status === 'not_submitted' ? 'Start Assignment' : 'View Assignment'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS - Coursera Style */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Student reviews
              </h2>
              <div className="mb-8 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border-2 border-primary-100">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold text-slate-900">
                    {ratingSummary.average_rating ? ratingSummary.average_rating.toFixed(1) : '0.0'}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2">
                      <RatingStars value={ratingSummary.average_rating || 0} size="lg" />
                    </div>
                    <p className="text-base font-semibold text-slate-700">
                      Course average rating
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Based on {ratingSummary.total_reviews || 0} {ratingSummary.total_reviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              </div>
              <CourseReviewList reviews={reviews} currentUserId={user?.id} />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - Purchase CTA - Coursera Style */}
        <div className="lg:sticky lg:top-4 h-fit">
          <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Course Preview */}
            {course.thumbnail_url && (
              <div className="relative w-full aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 overflow-hidden">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {!course.thumbnail_url && (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-20 h-20 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* Price - Coursera Style */}
              <div className="text-4xl font-bold text-slate-900">
                ${parseFloat(course.price || 0).toFixed(2)}
              </div>

              {/* Purchase/Enrollment Buttons - Coursera Style */}
              {!isAuthenticated ? (
                <button
                  onClick={() => {
                    localStorage.setItem('redirectCourseId', courseId);
                    navigate('/login');
                  }}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Buy this course
                </button>
              ) : isTeacher ? (
                <div className="space-y-3">
                  <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-semibold text-primary-700">
                      You are the instructor of this course.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Manage Course
                  </button>
                </div>
              ) : user?.role === 'student' ? (
                enrollmentType === 'paid' ? (
                  <button
                    onClick={() => navigate(`/courses/${courseId}/learn`)}
                    className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Go to course
                  </button>
                ) : enrollmentType === 'audit' ? (
                  <div className="space-y-3">
                    <div className="bg-secondary-50 border-2 border-secondary-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-semibold text-secondary-700">
                        You are auditing this course.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/courses/${courseId}/learn`)}
                      className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-lg transition"
                    >
                      Go to course
                    </button>
                    <button
                      onClick={() => handlePurchase('paid')}
                      disabled={purchasing}
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none transform hover:-translate-y-0.5"
                    >
                      {purchasing ? 'Processing...' : 'Upgrade to full purchase'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => handlePurchase('paid')}
                      disabled={purchasing}
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                    >
                      {purchasing ? 'Processing...' : 'Buy this course'}
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {addingToCart ? 'Adding...' : 'Add to cart'}
                    </button>
                    <button
                      onClick={() => handlePurchase('audit')}
                      disabled={purchasing}
                      className="w-full border-2 border-primary-300 hover:border-primary-400 text-primary-600 hover:bg-primary-50 font-bold py-4 rounded-lg transition disabled:opacity-50"
                    >
                      {purchasing ? 'Processing...' : 'Audit for free'}
                    </button>
                    <Link
                      to="/cart"
                      className="block text-center text-sm text-primary-600 hover:text-primary-700 font-semibold mt-2"
                    >
                      Go to cart →
                    </Link>
                  </div>
                )
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem('redirectCourseId', courseId);
                    navigate('/login');
                  }}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Buy this course
                </button>
              )}

              {/* Course Features - Coursera Style */}
              <div className="pt-5 border-t-2 border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">This course includes:</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">Lifetime access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">Certificate of completion</span>
                  </li>
                  {totalLessons > 0 && (
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium">{totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}</span>
                    </li>
                  )}
                  {totalDuration > 0 && (
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium">{formatDuration(totalDuration)} of content</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLandingPage;

