import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { coursesAPI, enrollmentsAPI, studentQuizAPI, studentAssignmentAPI, reviewsAPI, getInstructorProfile, purchaseCourse, addToCart } from '../api/client';
import { useAuth } from '../context/AuthContext';
import QuizStatusBadge from '../components/QuizStatusBadge';
import AssignmentStatusBadge from '../components/AssignmentStatusBadge';
import RatingStars from '../components/RatingStars';
import CourseReviewList from '../components/CourseReviewList';
import CourseReviewForm from '../components/CourseReviewForm';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentType, setEnrollmentType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizStatuses, setQuizStatuses] = useState({}); // { quizId: "not_started" | "in_progress" | "completed" }
  const [quizResults, setQuizResults] = useState({}); // { quizId: { score, total_points, percentage } }
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentStatuses, setAssignmentStatuses] = useState({}); // { assignmentId: "not_submitted" | "submitted" | "graded" }
  const [assignmentScores, setAssignmentScores] = useState({}); // { assignmentId: { grade, max_points } }
  // Reviews state
  const [ratingSummary, setRatingSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  // Instructor profile data
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [loadingInstructor, setLoadingInstructor] = useState(false);

  useEffect(() => {
    fetchCourseData();
    if (isAuthenticated) {
      checkEnrollment();
    }
  }, [courseId, isAuthenticated]);

  useEffect(() => {
    // Fetch instructor profile when course data is loaded
    if (course?.teacher_id) {
      fetchInstructorProfile(course.teacher_id);
    }
  }, [course?.teacher_id]);

  useEffect(() => {
    // Fetch quizzes and assignments only if user is authenticated and enrolled
    if (isAuthenticated && isEnrolled) {
      fetchQuizzes();
      fetchAssignments();
    }
  }, [courseId, isAuthenticated, isEnrolled]);

  useEffect(() => {
    // Fetch reviews data
    fetchReviewsData();
  }, [courseId, isAuthenticated, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseResponse, curriculumResponse] = await Promise.all([
        coursesAPI.getById(courseId),
        coursesAPI.getCurriculum(courseId),
      ]);
      const courseData = courseResponse.data;
      setCourse(courseData);
      setCurriculum(curriculumResponse.data);
      // Update enrollment status from API
      setIsEnrolled(courseData.is_enrolled || false);
      setEnrollmentType(courseData.enrollment_type || null);
      setError(null);
    } catch (err) {
      setError('Failed to load course. Please try again.');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await enrollmentsAPI.getMyEnrollments();
      let enrollments = [];
      if (Array.isArray(response.data)) {
        enrollments = response.data;
      } else if (response.data?.results) {
        enrollments = response.data.results;
      } else if (response.data?.data) {
        enrollments = response.data.data;
      }
      
      // Check if current course is in enrollments
      const enrolled = enrollments.some(
        (enrollment) => 
          enrollment.course?.id === parseInt(courseId) || 
          enrollment.course_id === parseInt(courseId)
      );
      setIsEnrolled(enrolled);
    } catch (err) {
      console.error('Error checking enrollment:', err);
      // If error, assume not enrolled
      setIsEnrolled(false);
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
      setQuizzes(quizzesData);

      // Fetch attempt status for each quiz
      const statusMap = {};
      for (const quiz of quizzesData) {
        try {
          const attemptResponse = await studentQuizAPI.getMyQuizAttempt(quiz.id);
          const attempts = Array.isArray(attemptResponse.data) 
            ? attemptResponse.data 
            : attemptResponse.data?.results || [];
          const completedAttempt = attempts.find(a => a.status === 'completed');
          if (completedAttempt) {
            statusMap[quiz.id] = 'completed';
          } else if (attempts.length > 0) {
            statusMap[quiz.id] = 'in_progress';
          } else {
            statusMap[quiz.id] = 'not_started';
          }
        } catch (err) {
          // If no attempt found, default to not_started
          statusMap[quiz.id] = 'not_started';
        }
      }
      setQuizStatuses(statusMap);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      // Don't show error to user, just leave quizzes empty
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
      
      console.log('Fetched assignments:', assignmentsData.length, assignmentsData);
      
      // Backend already filters by is_published=True, but filter again just in case
      const publishedAssignments = assignmentsData.filter(a => a.is_published !== false);
      setAssignments(publishedAssignments);
      
      console.log('Published assignments:', publishedAssignments.length);

      // Fetch submission status for each assignment
      const statusMap = {};
      const scoresMap = {};
      for (const assignment of assignmentsData) {
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
          // No submission found
          statusMap[assignment.id] = 'not_submitted';
        }
      }
      setAssignmentStatuses(statusMap);
      setAssignmentScores(scoresMap);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      // Don't show error to user, just leave assignments empty
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchInstructorProfile = async (instructorId) => {
    try {
      setLoadingInstructor(true);
      const response = await getInstructorProfile(instructorId);
      setInstructorProfile(response.data);
    } catch (err) {
      console.error('Error fetching instructor profile:', err);
      // Don't show error, just leave instructorProfile as null
    } finally {
      setLoadingInstructor(false);
    }
  };

  const fetchReviewsData = async () => {
    try {
      setLoadingReviews(true);
      
      // Fetch rating summary and reviews (public endpoints)
      const [summaryResponse, reviewsResponse] = await Promise.all([
        reviewsAPI.getCourseRatingSummary(courseId),
        reviewsAPI.getCourseReviews(courseId),
      ]);
      
      setRatingSummary(summaryResponse.data || { average_rating: 0, total_reviews: 0 });
      
      // Handle different response structures (array, object with results, etc.)
      let reviewsData = [];
      if (Array.isArray(reviewsResponse.data)) {
        reviewsData = reviewsResponse.data;
      } else if (reviewsResponse.data?.results && Array.isArray(reviewsResponse.data.results)) {
        reviewsData = reviewsResponse.data.results;
      } else if (reviewsResponse.data?.data && Array.isArray(reviewsResponse.data.data)) {
        reviewsData = reviewsResponse.data.data;
      }
      setReviews(reviewsData);

      // Fetch my review if authenticated and student
      if (isAuthenticated && user?.role === 'student') {
        try {
          const myReviewResponse = await reviewsAPI.getMyCourseReview(courseId);
          setMyReview(myReviewResponse.data || null);
        } catch (err) {
          // 404 is expected when no review exists - handled by API helper
          setMyReview(null);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews data:', err);
      // Don't show error to user, just leave reviews empty
      setReviews([]);
      setRatingSummary({ average_rating: 0, total_reviews: 0 });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handlePurchase = (mode = 'paid') => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectCourseId', courseId);
      navigate('/login');
      return;
    }

    if (user?.role !== 'student') {
      alert('Only students can purchase courses.');
      return;
    }

    // Check if user is the teacher
    if (course?.teacher_id === user?.id) {
      alert('You cannot purchase your own course.');
      return;
    }

    // Navigate to payment page
    navigate(`/courses/${courseId}/payment`, { state: { mode } });
  };

  const handleUpgrade = () => {
    handlePurchase('paid');
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
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to add to cart. Please try again.';
      alert(errorMsg);
    } finally {
      setAddingToCart(false);
    }
  };

  // Refresh course data when returning from payment page
  useEffect(() => {
    if (location.state?.fromPayment && location.state?.success) {
      fetchCourseData();
      // Show success message
      const message = location.state.mode === 'paid' 
        ? 'Payment successful! You are now enrolled.' 
        : 'You are now auditing this course.';
      alert(message);
      // Clear location state to prevent showing message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center text-slate-600">Loading course...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center text-red-600">{error || 'Course not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)] gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{course.title}</h1>
                {course.subtitle && <p className="text-lg text-slate-600 mb-4">{course.subtitle}</p>}
                {/* Rating display */}
                <div className="flex items-center gap-2 text-sm text-slate-700 mt-1 mb-4">
                  <RatingStars value={ratingSummary.average_rating || 0} size="sm" />
                  <span className="font-semibold">
                    {ratingSummary.average_rating ? ratingSummary.average_rating.toFixed(1) : "0.0"}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({ratingSummary.total_reviews} {ratingSummary.total_reviews === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              </div>
              {user?.role === 'teacher' && (
                <button
                  onClick={() => navigate(`/teacher/courses/${courseId}/quizzes`)}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition ml-4"
                >
                  Manage Quizzes
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">{course.level}</span>
              {course.category && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">{course.category}</span>
              )}
            </div>
            {course.description && (
              <div className="prose max-w-none text-slate-700 mb-6">
                <p>{course.description}</p>
              </div>
            )}
          </div>

          {/* Instructor Section */}
          {course.teacher_id && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Instructor</h2>
              {loadingInstructor ? (
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-slate-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : instructorProfile ? (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={instructorProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorProfile.full_name || 'Instructor')}&background=6366f1&color=fff&size=128`}
                      alt={instructorProfile.full_name || 'Instructor'}
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorProfile.full_name || 'Instructor')}&background=6366f1&color=fff&size=128`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {instructorProfile.full_name || course.teacher_name || 'Instructor'}
                    </h3>
                    {instructorProfile.headline && (
                      <p className="text-sm text-slate-600 mb-2">
                        {instructorProfile.headline}
                      </p>
                    )}
                    
                    {/* Instructor Stats */}
                    {instructorProfile.stats && (
                      <div className="flex items-center gap-4 mb-3 text-sm">
                        {/* Luôn hiển thị rating, kể cả khi không có review */}
                        <div className="flex items-center gap-1">
                          <RatingStars value={instructorProfile.stats.average_rating || 0} size="sm" />
                          <span className="font-semibold text-slate-700">
                            {(instructorProfile.stats.average_rating || 0).toFixed(1)}
                          </span>
                          <span className="text-slate-500">
                            ({instructorProfile.stats.total_reviews || 0} {instructorProfile.stats.total_reviews === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                        {instructorProfile.stats.total_courses > 0 && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>{instructorProfile.stats.total_courses} {instructorProfile.stats.total_courses === 1 ? 'course' : 'courses'}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => navigate(`/instructor/${course.teacher_id}/profile`)}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm hover:shadow"
                    >
                      View Instructor Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.teacher_name || 'Instructor')}&background=6366f1&color=fff&size=128`}
                      alt={course.teacher_name || 'Instructor'}
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {course.teacher_name || 'Instructor'}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Learn from an experienced instructor
                    </p>
                    <button
                      onClick={() => navigate(`/instructor/${course.teacher_id}/profile`)}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm hover:shadow"
                    >
                      View Instructor Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {curriculum && curriculum.sections && curriculum.sections.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Course Curriculum</h2>
              <div className="space-y-4">
                {curriculum.sections.map((section) => (
                  <div key={section.id} className="bg-slate-50 rounded-xl border border-slate-200">
                    <div className="px-4 py-3 bg-slate-100 rounded-t-xl">
                      <h3 className="font-semibold text-slate-900">{section.title}</h3>
                    </div>
                    {section.lessons && section.lessons.length > 0 && (
                      <ul className="divide-y divide-slate-200">
                        {section.lessons.map((lesson) => (
                          <li 
                            key={lesson.id} 
                            className={`px-4 py-3 flex justify-between items-center ${
                              isAuthenticated && isEnrolled 
                                ? 'hover:bg-slate-50 cursor-pointer' 
                                : 'opacity-60 cursor-not-allowed'
                            }`}
                            onClick={() => {
                              if (!isAuthenticated) {
                                localStorage.setItem('redirectCourseId', courseId);
                                navigate('/login');
                                return;
                              }
                              if (!isEnrolled) {
                                alert('Please enroll in this course first to access lessons.');
                                return;
                              }
                              navigate(`/courses/${course.id}/learn?lesson=${lesson.id}`);
                            }}
                          >
                            <span className="text-slate-700">{lesson.title}</span>
                            {lesson.duration > 0 && (
                              <span className="text-sm text-slate-500">
                                {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Quizzes Section */}
          {isAuthenticated && isEnrolled && (
            <section className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900">Course Quizzes</h2>
              </div>

              {loadingQuizzes && (
                <div className="text-sm text-slate-500">Loading quizzes...</div>
              )}

              {!loadingQuizzes && quizzes.length === 0 && (
                <div className="text-sm text-slate-500">
                  No quizzes available for this course yet.
                </div>
              )}

              {!loadingQuizzes && quizzes.length > 0 && (
                <div className="space-y-3">
                  {quizzes.map(quiz => {
                    const status = quizStatuses[quiz.id] || 'not_started';
                    const result = quizResults[quiz.id];
                    const isCompleted = status === 'completed';
                    
                    return (
                      <div 
                        key={quiz.id} 
                        className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
                            {quiz.description && (
                              <p className="text-sm text-slate-500 line-clamp-2">{quiz.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              {quiz.time_limit && <span>Time limit: {quiz.time_limit} min</span>}
                              <QuizStatusBadge status={status} />
                              {isCompleted && result && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-semibold text-blue-600">
                                    Score: {result.score}/{result.total_points} ({result.percentage.toFixed(1)}%)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                              onClick={() => {
                                if (!isEnrolled) {
                                  alert('Please enroll in this course first to take quizzes.');
                                  return;
                                }
                                navigate(`/courses/${courseId}/quizzes/${quiz.id}/take`);
                              }}
                            >
                              {isCompleted ? 'View Result' : 'Take Quiz'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Course Assignments Section */}
          {isAuthenticated && isEnrolled && (
            <section className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900">Course Assignments</h2>
              </div>

              {loadingAssignments && (
                <div className="text-sm text-slate-500">Loading assignments...</div>
              )}

              {!loadingAssignments && assignments.length === 0 && (
                <div className="text-sm text-slate-500">
                  No assignments available for this course yet.
                </div>
              )}

              {!loadingAssignments && assignments.length > 0 && (
                <div className="space-y-3">
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
                        className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-slate-500 line-clamp-2">{assignment.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              {assignment.due_date && (
                                <span>Due: {formatDate(assignment.due_date)}</span>
                              )}
                              <AssignmentStatusBadge status={status} />
                              {status === 'graded' && score && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-semibold text-blue-600">
                                    Score: {score.grade}/{score.max_points}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                              onClick={() => {
                                if (!isEnrolled) {
                                  alert('Please enroll in this course first to view and submit assignments.');
                                  return;
                                }
                                navigate(`/courses/${courseId}/assignments/${assignment.id}`);
                              }}
                            >
                              View / Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Student Reviews Section */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Student reviews</h2>

            {loadingReviews && (
              <div className="text-sm text-slate-500">Loading reviews...</div>
            )}

            {!loadingReviews && (
              <div className="space-y-4">
                {/* Review form for logged-in students who are enrolled */}
                {user && user.role === "student" && isEnrolled && (
                  <CourseReviewForm
                    initialRating={myReview?.rating || null}
                    initialComment={myReview?.comment || ""}
                    disabled={submittingReview}
                    onSubmit={async ({ rating, comment }) => {
                      if (!isEnrolled) {
                        alert('Please enroll in this course first to write a review.');
                        return;
                      }
                      setSubmittingReview(true);
                      try {
                        await reviewsAPI.upsertCourseReview(courseId, { rating, comment });
                        // Refresh all reviews data
                        await fetchReviewsData();
                      } catch (error) {
                        console.error('Error submitting review:', error);
                        throw error;
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                    onDelete={
                      myReview
                        ? async () => {
                            if (!myReview?.id) return;
                            setSubmittingReview(true);
                            try {
                              await reviewsAPI.deleteCourseReview(myReview.id);
                              // Refresh all reviews data
                              await fetchReviewsData();
                            } catch (error) {
                              console.error('Error deleting review:', error);
                              throw error;
                            } finally {
                              setSubmittingReview(false);
                            }
                          }
                        : undefined
                    }
                  />
                )}

                {/* Reviews list - visible to everyone */}
                <CourseReviewList
                  reviews={reviews}
                  currentUserId={user?.id}
                />
              </div>
            )}
          </section>
        </div>

        <div className="lg:sticky lg:top-4 h-fit">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full rounded-xl mb-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="text-3xl font-bold text-slate-900 mb-4">
              ${parseFloat(course.price || 0).toFixed(2)}
            </div>
            
            {/* Purchase/Enrollment Section */}
            {!isAuthenticated ? (
              // Not logged in
              <button
                onClick={() => {
                  localStorage.setItem('redirectCourseId', courseId);
                  navigate('/login');
                }}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-lg transition"
              >
                Buy this course
              </button>
            ) : user?.role === 'teacher' && course?.teacher_id === user?.id ? (
              // Teacher viewing their own course
              <div className="space-y-3">
                <p className="text-sm text-slate-600 text-center">You are the instructor of this course.</p>
                <button
                  onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
                >
                  Manage Course
                </button>
              </div>
            ) : user?.role === 'student' ? (
              // Student view
              enrollmentType === 'paid' ? (
                // Already purchased
                <button
                  onClick={() => navigate(`/courses/${courseId}/learn`)}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-lg transition"
                >
                  Go to course
                </button>
              ) : enrollmentType === 'audit' ? (
                // Auditing - can upgrade
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 text-center">
                    You are auditing this course. You can upgrade to full purchase to get a certificate.
                  </p>
                  <button
                    onClick={() => navigate(`/courses/${courseId}/learn`)}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 rounded-lg transition"
                  >
                    Go to course
                  </button>
                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-lg transition"
                  >
                    Upgrade to full purchase
                  </button>
                </div>
              ) : (
                // Not enrolled
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
                  >
                    {addingToCart ? 'Adding...' : 'Add to cart'}
                  </button>
                  <button
                    onClick={() => handlePurchase('paid')}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-lg transition"
                  >
                    Buy this course
                  </button>
                  <button
                    onClick={() => handlePurchase('audit')}
                    className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-medium py-3 rounded-lg transition"
                  >
                    Audit for free
                  </button>
                  <Link
                    to="/cart"
                    className="block text-center text-sm text-sky-600 hover:text-sky-700 underline mt-2"
                  >
                    Go to cart
                  </Link>
                </div>
              )
            ) : (
              // Other roles
              <button
                onClick={() => {
                  localStorage.setItem('redirectCourseId', courseId);
                  navigate('/login');
                }}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-lg transition"
              >
                Buy this course
              </button>
            )}
            
            <ul className="text-sm text-slate-600 space-y-2 mt-4">
              <li>✓ Lifetime access</li>
              <li>✓ Certificate of completion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

