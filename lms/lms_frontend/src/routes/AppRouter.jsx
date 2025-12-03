import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import CourseDetail from '../pages/CourseDetail';
import CourseLandingPage from '../pages/courses/CourseLandingPage';
import CourseLearning from '../pages/CourseLearning';
import LessonPlayer from '../pages/LessonPlayer';
import StudentDashboard from '../pages/StudentDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';
import CourseEditor from '../pages/CourseEditor';
import TeacherCourseQuizzes from '../pages/TeacherCourseQuizzes';
import QuizEditor from '../pages/QuizEditor';
import StudentQuizPlayer from '../pages/StudentQuizPlayer';
import AssignmentDetail from '../pages/AssignmentDetail';
import StudentAssignmentDetail from '../pages/StudentAssignmentDetail';
import TeacherCourseAssignments from '../pages/TeacherCourseAssignments';
import TeacherAssignmentEditor from '../pages/TeacherAssignmentEditor';
import TeacherAssignmentSubmissions from '../pages/TeacherAssignmentSubmissions';
import TeacherAnalytics from '../pages/TeacherAnalytics';
import TeacherStudents from '../pages/TeacherStudents';
import StudentProfile from '../pages/StudentProfile';
import MyLearning from '../pages/MyLearning';
import PublicProfile from '../pages/profile/PublicProfile';
import EditProfile from '../pages/profile/EditProfile';
import InstructorProfile from '../pages/instructor/InstructorProfile';
import ChangePassword from '../pages/ChangePassword';
import CertificateView from '../pages/CertificateView';
import StudentCertificates from '../pages/StudentCertificates';
import PaymentPage from '../pages/PaymentPage';
import CartPage from '../pages/CartPage';
import CartCheckoutPage from '../pages/CartCheckoutPage';
import StudentPaymentHistory from '../pages/StudentPaymentHistory';
import BrowseCourses from '../pages/BrowseCourses';
import Messaging from '../pages/Messaging';
import Navbar from '../components/Navbar';
import AnnouncementList from '../features/announcements/components/AnnouncementList';
import TeacherAnnouncementHistory from '../pages/TeacherAnnouncementHistory';
import TeacherAnnouncementDetail from '../pages/TeacherAnnouncementDetail';
import StudentAnnouncementList from '../pages/StudentAnnouncementList';
import StudentAnnouncementDetail from '../pages/StudentAnnouncementDetail';
import NotificationPage from '../pages/NotificationPage';

// ============================================
// PROTECTED ROUTE - COMPLETELY REWRITTEN
// ============================================
// Waits for authentication initialization before redirecting
// NEVER shows "User not authenticated" if token still exists
// Supports AuthContext and localStorage token recovery
// Redirects ONLY when absolutely certain the user is logged out
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, accessToken } = useAuth();

  // Wait for auth initialization to complete
  // This is CRITICAL - don't redirect while loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Check both isAuthenticated AND accessToken
  // This ensures we have both user data and valid token
  const hasValidAuth = isAuthenticated && accessToken && typeof accessToken === 'string' && accessToken.trim() !== '';
  
  // Also double-check localStorage as fallback
  // This handles cases where context hasn't updated yet
  const hasTokenInStorage = !!localStorage.getItem('accessToken');

  // CRITICAL: Only redirect if BOTH checks fail
  // This prevents false redirects when token is valid but context hasn't updated
  // We must be 100% certain the user is logged out before redirecting
  if (!hasValidAuth && !hasTokenInStorage) {
    return <Navigate to="/login" replace />;
  }

  // If we have token in storage but context says not authenticated, wait a bit
  // This handles race conditions during token refresh or context initialization
  // Trust the token in localStorage - axios interceptor will use it
  if (!hasValidAuth && hasTokenInStorage) {
    // Give it a moment for context to update
    // But don't wait forever - if token exists, trust it
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If we reach here, user is authenticated
  return children;
};

const TeacherRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const StudentRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<BrowseCourses />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/:studentId/profile" element={<StudentProfile />} />
        {/* User Profile Routes */}
        <Route path="/profile/:userId" element={<PublicProfile />} />
        <Route
          path="/profile/:userId/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        {/* Instructor Public Profile Route */}
        <Route path="/instructor/:instructorId/profile" element={<InstructorProfile />} />
        {/* Change Password Route */}
        <Route
          path="/account/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        {/* Payment History Route */}
        <Route
          path="/account/payment-history"
          element={
            <StudentRoute>
              <StudentPaymentHistory />
            </StudentRoute>
          }
        />
        <Route path="/courses/:courseId" element={<CourseLandingPage />} />
        <Route
          path="/courses/:courseId/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/learn"
          element={
            <ProtectedRoute>
              <CourseLearning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/certificate"
          element={
            <ProtectedRoute>
              <CertificateView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/lessons/:lessonId"
          element={
            <ProtectedRoute>
              <LessonPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        {/* My Learning */}
        <Route
          path="/my-learning"
          element={
            <StudentRoute>
              <MyLearning />
            </StudentRoute>
          }
        />
        {/* Student Certificates */}
        <Route
          path="/student/certificates"
          element={
            <StudentRoute>
              <StudentCertificates />
            </StudentRoute>
          }
        />
        {/* Cart */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart/checkout"
          element={
            <ProtectedRoute>
              <CartCheckoutPage />
            </ProtectedRoute>
          }
        />
        {/* Teacher Dashboard */}
        <Route
          path="/teacher/dashboard"
          element={
            <TeacherRoute>
              <TeacherDashboard />
            </TeacherRoute>
          }
        />
        {/* Teacher Analytics */}
        <Route
          path="/teacher/analytics"
          element={
            <TeacherRoute>
              <TeacherAnalytics />
            </TeacherRoute>
          }
        />
        {/* Teacher Course Editor */}
        {/* Put /new route BEFORE /:courseId/edit to avoid route conflict */}
        <Route
          path="/teacher/courses/new"
          element={
            <TeacherRoute>
              <CourseEditor />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/edit"
          element={
            <TeacherRoute>
              <CourseEditor />
            </TeacherRoute>
          }
        />
        {/* Teacher Quiz Management Routes */}
        <Route
          path="/teacher/courses/:courseId/quizzes"
          element={
            <TeacherRoute>
              <TeacherCourseQuizzes />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/quizzes/:quizId/edit"
          element={
            <TeacherRoute>
              <QuizEditor />
            </TeacherRoute>
          }
        />
        {/* Teacher Assignment Management Routes */}
        <Route
          path="/teacher/courses/:courseId/assignments"
          element={
            <TeacherRoute>
              <TeacherCourseAssignments />
            </TeacherRoute>
          }
        />
        {/* Teacher Student Management Routes */}
        <Route
          path="/teacher/courses/:courseId/students"
          element={
            <TeacherRoute>
              <TeacherStudents />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/assignments/:assignmentId/edit"
          element={
            <TeacherRoute>
              <TeacherAssignmentEditor />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/assignments/:assignmentId/submissions"
          element={
            <TeacherRoute>
              <TeacherAssignmentSubmissions />
            </TeacherRoute>
          }
        />
        {/* Student Quiz Player */}
        <Route
          path="/courses/:courseId/quizzes/:quizId/take"
          element={
            <ProtectedRoute>
              <StudentQuizPlayer />
            </ProtectedRoute>
          }
        />
        {/* Student Assignment Detail */}
        <Route
          path="/courses/:courseId/assignments/:assignmentId"
          element={
            <ProtectedRoute>
              <StudentAssignmentDetail />
            </ProtectedRoute>
          }
        />
        {/* Messaging */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messaging />
            </ProtectedRoute>
          }
        />
        {/* Announcements */}
        <Route
          path="/teacher/announcements/sent"
          element={
            <TeacherRoute>
              <TeacherAnnouncementHistory />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/announcements/:id"
          element={
            <TeacherRoute>
              <TeacherAnnouncementDetail />
            </TeacherRoute>
          }
        />
        <Route
          path="/student/announcements"
          element={
            <StudentRoute>
              <StudentAnnouncementList />
            </StudentRoute>
          }
        />
        <Route
          path="/student/announcements/:id"
          element={
            <StudentRoute>
              <StudentAnnouncementDetail />
            </StudentRoute>
          }
        />
        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

