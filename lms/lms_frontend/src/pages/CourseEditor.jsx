/**
 * CourseEditor Page
 * 
 * Udemy-style course editor for teachers to manage course content.
 * Route: /teacher/courses/:courseId/edit
 * 
 * Features:
 * - Edit course information (title, subtitle, description, price, etc.)
 * - Manage sections (add, edit, delete, reorder)
 * - Manage lessons within sections (add, edit, delete, reorder)
 * - Navigation to quiz management
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesAPI } from '../api/client';
import { COURSE_CATEGORIES, getCategoryLabel, isValidCategory } from '../config/courseCategories';

const CourseEditor = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    thumbnail_url: '',
    price: '',
    level: 'beginner',
    category: '',
    is_published: false,
  });
  
  // UI state
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [editingSection, setEditingSection] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddLesson, setShowAddLesson] = useState(null); // sectionId
  const [isEditingCurriculum, setIsEditingCurriculum] = useState(false);
  const [editingSectionTitles, setEditingSectionTitles] = useState({}); // {sectionId: title}

  // Check if this is a new course route
  const isNewCourse = location.pathname === '/teacher/courses/new' || courseId === 'new';

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || user?.role !== 'teacher') {
      navigate('/');
      return;
    }
    
    // If courseId is undefined or 'new', don't fetch
    if (!courseId || isNewCourse) {
      // New course mode - no need to fetch
      setLoading(false);
      return;
    }
    
    // Only fetch if courseId is a valid number
    const courseIdNum = parseInt(courseId);
    if (isNaN(courseIdNum)) {
      setLoading(false);
      setError('Invalid course ID');
      return;
    }
    
    fetchCourseData();
  }, [courseId, isAuthenticated, user, authLoading, navigate, isNewCourse, location.pathname]);

  const fetchCourseData = async () => {
    // Safety check: don't fetch if courseId is invalid
    if (!courseId || courseId === 'new' || isNaN(parseInt(courseId))) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch course detail
      const courseResponse = await coursesAPI.getTeacherCourseDetail(courseId);
      const courseData = courseResponse.data;
      setCourse(courseData);
      setCourseForm({
        title: courseData.title || '',
        subtitle: courseData.subtitle || '',
        description: courseData.description || '',
        thumbnail_url: courseData.thumbnail_url || '',
        price: courseData.price || '',
        level: courseData.level || 'beginner',
        category: courseData.category || '',
        is_published: courseData.is_published || false,
      });
      
      // Ensure courseId is parsed correctly and matches course data
      const currentCourseId = parseInt(courseId);
      if (!currentCourseId || courseData.id !== currentCourseId) {
        setError('Course ID mismatch. Please refresh the page.');
        return;
      }
      
      // Fetch sections for this course ONLY
      const sectionsResponse = await coursesAPI.getTeacherSections({ course: currentCourseId });
      let sectionsData = Array.isArray(sectionsResponse.data) 
        ? sectionsResponse.data 
        : sectionsResponse.data?.results || [];
      // Double-check: filter by course ID to ensure we only get sections for this course
      sectionsData = sectionsData
        .filter(s => s.course === currentCourseId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setSections(sectionsData);
      
      // Fetch lessons for all sections in this course ONLY
      const lessonsResponse = await coursesAPI.getTeacherLessons({ section__course: currentCourseId });
      let lessonsData = Array.isArray(lessonsResponse.data)
        ? lessonsResponse.data
        : lessonsResponse.data?.results || [];
      // Double-check: filter by course ID through section
      const sectionIds = new Set(sectionsData.map(s => s.id));
      lessonsData = lessonsData
        .filter(l => sectionIds.has(l.section))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setLessons(lessonsData);
      
      // Expand all sections by default
      setExpandedSections(new Set(sectionsData.map(s => s.id)));
      
      // Initialize editing titles
      const titlesMap = {};
      sectionsData.forEach(s => {
        titlesMap[s.id] = s.title;
      });
      setEditingSectionTitles(titlesMap);
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError(err.response?.data?.detail || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) {
      setError('Course title is required');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Build payload with proper formatting
      const payload = {
        title: courseForm.title.trim(),
        subtitle: courseForm.subtitle?.trim() || '',
        description: courseForm.description?.trim() || '',
        thumbnail_url: courseForm.thumbnail_url?.trim() || null,
        price: courseForm.price ? parseFloat(courseForm.price) : 0.00,
        level: courseForm.level || 'beginner',
        category: courseForm.category?.trim() || '',
        is_published: Boolean(courseForm.is_published),
      };
      
      // Ensure price is a valid number
      if (isNaN(payload.price) || payload.price < 0) {
        payload.price = 0.00;
      }
      
      console.log('Saving course with payload:', payload);
      console.log('is_published value:', payload.is_published, 'type:', typeof payload.is_published);
      
      let response;
      if (isNewCourse) {
        // Create new course
        response = await coursesAPI.createTeacherCourse(payload);
        console.log('Create response:', response.data);
        // Redirect to teacher dashboard after creating
        alert('Course created successfully!');
        navigate('/teacher/dashboard', { replace: true });
        return;
      } else {
        // Update existing course
        response = await coursesAPI.updateTeacherCourse(courseId, payload);
        console.log('Save response:', response.data);
        
        await fetchCourseData();
        
        // Show success message
        alert('Course saved successfully!');
      }
    } catch (err) {
      console.error('Error saving course:', err);
      console.error('Error response:', err.response?.data);
      
      // Show more detailed error message
      const errorDetail = err.response?.data?.detail || err.response?.data?.message || 'Failed to save course';
      const errorFields = err.response?.data;
      
      // If there are field-specific errors, show them
      let errorMessage = errorDetail;
      if (typeof errorFields === 'object' && errorFields !== null) {
        const fieldErrors = Object.entries(errorFields)
          .filter(([key, value]) => key !== 'detail' && key !== 'message' && Array.isArray(value))
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join('\n');
        if (fieldErrors) {
          errorMessage = `${errorDetail}\n\n${fieldErrors}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    
    const confirmMessage = `Are you sure you want to delete "${course.title}"?\n\nThis action cannot be undone. All sections, lessons, quizzes, and assignments in this course will also be deleted.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    // Double confirmation for safety
    if (!window.confirm('This is your last chance. Are you absolutely sure you want to delete this course?')) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      await coursesAPI.deleteTeacherCourse(courseId);
      
      alert('Course deleted successfully!');
      navigate('/teacher/dashboard', { replace: true });
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.detail || 'Failed to delete course');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async (title) => {
    if (!title.trim()) return;
    
    if (isNewCourse) {
      setError('Please save the course first before adding sections.');
      return;
    }
    
    try {
      // Ensure courseId is valid and belongs to current course
      const currentCourseId = parseInt(courseId);
      if (!currentCourseId || !course || currentCourseId !== course.id) {
        setError('Invalid course. Please refresh the page.');
        return;
      }
      
      const maxOrder = sections.length > 0 
        ? Math.max(...sections.map(s => s.sort_order || 0))
        : 0;
      
      await coursesAPI.createTeacherSection({
        course: currentCourseId,
        title: title.trim(),
        sort_order: maxOrder + 1,
      });
      await fetchCourseData();
      setShowAddSection(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create section');
    }
  };

  const handleUpdateSection = async (sectionId, title) => {
    if (!title.trim()) return;
    
    try {
      await coursesAPI.updateTeacherSection(sectionId, { title: title.trim() });
      await fetchCourseData();
      setEditingSection(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure? This will delete all lessons in this section.')) {
      return;
    }
    
    try {
      await coursesAPI.deleteTeacherSection(sectionId);
      await fetchCourseData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete section');
    }
  };

  const handleMoveSection = async (e, sectionId, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    // Save current scroll position
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    
    // Create new array with swapped sections
    const newSections = [...sections];
    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
    
    try {
      // Use a large temporary offset to avoid unique constraint conflicts
      const tempOffset = 10000;
      
      // Step 1: Set all sections to temporary sort_order values
      const tempUpdates = sections.map((section, idx) => 
        coursesAPI.updateTeacherSection(section.id, {
          sort_order: tempOffset + idx,
        })
      );
      await Promise.all(tempUpdates);
      
      // Step 2: Update all sections with new sort_order based on new order
      const finalUpdates = newSections.map((section, idx) =>
        coursesAPI.updateTeacherSection(section.id, {
          sort_order: idx + 1,
        })
      );
      await Promise.all(finalUpdates);
      
      await fetchCourseData();
      
      // Restore scroll position after data is fetched and rendered
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant'
        });
      });
    } catch (err) {
      console.error('Reorder error:', err);
      setError(err.response?.data?.detail || 'Failed to reorder section. Please try again.');
      await fetchCourseData();
      
      // Restore scroll position even on error
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant'
        });
      });
    }
  };

  const handleUpdateSectionWithReorder = async (sectionId, newTitle, newIndex) => {
    if (!newTitle.trim()) return;
    
    try {
      // Update title first
      await coursesAPI.updateTeacherSection(sectionId, { title: newTitle.trim() });
      
      // If position changed, reorder
      const currentIndex = sections.findIndex(s => s.id === sectionId);
      if (currentIndex !== newIndex && newIndex >= 0 && newIndex < sections.length) {
        // Create new array with section moved to new position
        const newSections = [...sections];
        const [movedSection] = newSections.splice(currentIndex, 1);
        newSections.splice(newIndex, 0, movedSection);
        
        // Use temporary offset
        const tempOffset = 10000;
        
        // Step 1: Set all to temp values
        const tempUpdates = sections.map((section, idx) => 
          coursesAPI.updateTeacherSection(section.id, {
            sort_order: tempOffset + idx,
          })
        );
        await Promise.all(tempUpdates);
        
        // Step 2: Update all with new order
        const finalUpdates = newSections.map((section, idx) =>
          coursesAPI.updateTeacherSection(section.id, {
            sort_order: idx + 1,
          })
        );
        await Promise.all(finalUpdates);
      }
      
      await fetchCourseData();
      setEditingSection(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update section');
    }
  };

  const handleAddLesson = async (sectionId, lessonData, contentType) => {
    try {
      // Validate that section belongs to current course
      const section = sections.find(s => s.id === sectionId);
      if (!section || section.course !== parseInt(courseId)) {
        setError('Invalid section. Please refresh the page.');
        return;
      }
      
      const sectionLessons = lessons.filter(l => l.section === sectionId);
      const maxOrder = sectionLessons.length > 0
        ? Math.max(...sectionLessons.map(l => l.sort_order || 0))
        : 0;
      
      // If document file is uploaded, use FormData
      if (contentType === 'document' && lessonData.document_file) {
        const formData = new FormData();
        formData.append('section', sectionId);
        formData.append('title', lessonData.title);
        formData.append('document_file', lessonData.document_file);
        formData.append('content', lessonData.content || '');
        formData.append('duration', lessonData.duration || 0);
        formData.append('sort_order', maxOrder + 1);
        await coursesAPI.createTeacherLesson(formData);
      } else {
        // Use regular JSON for video URL
        await coursesAPI.createTeacherLesson({
          ...lessonData,
          section: sectionId,
          sort_order: maxOrder + 1,
          document_file: null, // Clear document_file if using video
        });
      }
      await fetchCourseData();
      setShowAddLesson(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create lesson');
    }
  };

  const handleUpdateLesson = async (lessonId, lessonData, contentType) => {
    try {
      // If document file is uploaded, use FormData
      if (contentType === 'document' && lessonData.document_file) {
        const formData = new FormData();
        formData.append('title', lessonData.title);
        formData.append('document_file', lessonData.document_file);
        formData.append('content', lessonData.content || '');
        formData.append('duration', lessonData.duration || 0);
        formData.append('video_url', ''); // Clear video_url when using document
        await coursesAPI.updateTeacherLesson(lessonId, formData);
      } else {
        // Use regular JSON for video URL
        await coursesAPI.updateTeacherLesson(lessonId, {
          ...lessonData,
          document_file: null, // Clear document_file if using video
        });
      }
      await fetchCourseData();
      setEditingLesson(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    
    try {
      await coursesAPI.deleteTeacherLesson(lessonId);
      await fetchCourseData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete lesson');
    }
  };

  const handleMoveLesson = async (e, lessonId, sectionId, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get lessons for this section only
    const sectionLessons = lessons
      .filter(l => l.section === sectionId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    const currentIndex = sectionLessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sectionLessons.length) return;
    
    // Save current scroll position
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    
    // Create new array with swapped lessons
    const newLessons = [...sectionLessons];
    [newLessons[currentIndex], newLessons[newIndex]] = [newLessons[newIndex], newLessons[currentIndex]];
    
    try {
      // Use a large temporary offset to avoid unique constraint conflicts
      const tempOffset = 10000;
      
      // Step 1: Set all lessons in this section to temporary sort_order values
      const tempUpdates = sectionLessons.map((lesson, idx) => 
        coursesAPI.updateTeacherLesson(lesson.id, {
          sort_order: tempOffset + idx,
        })
      );
      await Promise.all(tempUpdates);
      
      // Step 2: Update all lessons with new sort_order based on new order
      const finalUpdates = newLessons.map((lesson, idx) =>
        coursesAPI.updateTeacherLesson(lesson.id, {
          sort_order: idx + 1,
        })
      );
      await Promise.all(finalUpdates);
      
      await fetchCourseData();
      
      // Restore scroll position after data is fetched and rendered
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant'
        });
      });
    } catch (err) {
      console.error('Reorder lesson error:', err);
      setError(err.response?.data?.detail || 'Failed to reorder lesson. Please try again.');
      await fetchCourseData();
      
      // Restore scroll position even on error
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant'
        });
      });
    }
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600">Loading course editor...</p>
        </div>
      </div>
    );
  }

  // Only check for course if not creating a new one
  if (!isNewCourse && !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-red-600">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Header Section - Coursera Style */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                {isNewCourse ? 'Create New Course' : 'Edit Course'}
              </h1>
              {!isNewCourse && course && (
                <p className="text-base text-slate-600">{course.title}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/teacher/dashboard`)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm hover:shadow-md"
              >
                Back to Dashboard
              </button>
              {!isNewCourse && (
                <>
                  <button
                    onClick={() => navigate(`/teacher/courses/${courseId}/quizzes`)}
                    className="px-4 py-2 text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition shadow-sm hover:shadow-md"
                  >
                    Manage Quizzes
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/courses/${courseId}/assignments`)}
                    className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition shadow-sm hover:shadow-md"
                  >
                    Manage Assignments
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/courses/${courseId}/students`)}
                    className="px-4 py-2 text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition shadow-sm hover:shadow-md"
                  >
                    Manage Students
                  </button>
                  <button
                    onClick={handleDeleteCourse}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Course
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="ml-4 text-sm font-semibold text-red-600 hover:text-red-800 transition">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Course Information Form - Coursera Style */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
          <div className="mb-6 pb-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Course Information</h2>
            <p className="text-sm text-slate-500 mt-1">Fill in the details about your course</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400"
                  placeholder="Course title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={courseForm.subtitle}
                  onChange={(e) => setCourseForm({ ...courseForm, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400"
                  placeholder="Course subtitle"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400 resize-y"
                placeholder="Course description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Level</label>
                <select
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 bg-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 bg-white"
                >
                  <option value="">Select a category</option>
                  {COURSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                  {/* Show current category if it's not in the list (legacy support) */}
                  {courseForm.category && !isValidCategory(courseForm.category) && (
                    <option value={courseForm.category}>
                      {getCategoryLabel(courseForm.category)} (Legacy)
                    </option>
                  )}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">Choose a category related to Computer Science</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Thumbnail URL</label>
              <input
                type="url"
                value={courseForm.thumbnail_url}
                onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="is_published"
                checked={courseForm.is_published}
                onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="is_published" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Publish course
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={handleSaveCourse}
                disabled={saving || !courseForm.title.trim()}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Course'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Curriculum Section - Only show if course exists (not new) */}
        {!isNewCourse && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
          <div className="mb-6 pb-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Curriculum</h2>
                <p className="text-sm text-slate-500 mt-1">Organize your course content into sections and lessons</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isEditingCurriculum ? (
                  <>
                    <button
                      onClick={async () => {
                        // Save all section titles
                        try {
                          const updates = Object.entries(editingSectionTitles).map(([sectionId, title]) => {
                            if (title.trim() && title !== sections.find(s => s.id === parseInt(sectionId))?.title) {
                              return coursesAPI.updateTeacherSection(parseInt(sectionId), { title: title.trim() });
                            }
                            return Promise.resolve();
                          });
                          await Promise.all(updates);
                          await fetchCourseData();
                          setIsEditingCurriculum(false);
                        } catch (err) {
                          setError(err.response?.data?.detail || 'Failed to save changes');
                        }
                      }}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingCurriculum(false);
                        // Reset titles to original
                        const titlesMap = {};
                        sections.forEach(s => {
                          titlesMap[s.id] = s.title;
                        });
                        setEditingSectionTitles(titlesMap);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditingCurriculum(true)}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Curriculum
                    </button>
                    <button
                      onClick={() => setShowAddSection(true)}
                      className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Section
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Add Section Form */}
          {showAddSection && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Section Title</label>
              <input
                type="text"
                placeholder="Enter section title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg mb-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newSectionTitle.trim()) {
                    handleAddSection(newSectionTitle);
                    setNewSectionTitle('');
                    setShowAddSection(false);
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newSectionTitle.trim()) {
                      handleAddSection(newSectionTitle);
                      setNewSectionTitle('');
                      setShowAddSection(false);
                    }
                  }}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
                  disabled={!newSectionTitle.trim()}
                >
                  Add Section
                </button>
                <button
                  onClick={() => {
                    setShowAddSection(false);
                    setNewSectionTitle('');
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sections List */}
          {sections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No sections yet</p>
              <p className="text-sm text-slate-500 mt-1">Click "Add Section" to create your first section</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => {
                const sectionLessons = lessons.filter(l => l.section === section.id);
                const isExpanded = expandedSections.has(section.id);
                const isEditing = editingSection === section.id;

                return (
                  <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Section Header */}
                    <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Reorder Buttons - Only show when editing curriculum */}
                        {isEditingCurriculum && (
                          <div className="flex flex-col gap-1 mr-2">
                            <button
                              type="button"
                              onClick={(e) => handleMoveSection(e, section.id, 'up')}
                              disabled={index === 0}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Move up"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleMoveSection(e, section.id, 'down')}
                              disabled={index === sections.length - 1}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Move down"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="text-slate-500 hover:text-primary-500 transition-colors"
                        >
                          <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-3 flex-1">
                          {isEditingCurriculum ? (
                            <input
                              type="text"
                              value={editingSectionTitles[section.id] || section.title}
                              onChange={(e) => {
                                setEditingSectionTitles({
                                  ...editingSectionTitles,
                                  [section.id]: e.target.value,
                                });
                              }}
                              className="flex-1 px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white transition"
                            />
                          ) : (
                            <h3 className="font-semibold text-slate-900 flex-1">{section.title}</h3>
                          )}
                          <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-100">
                            {sectionLessons.length} lesson{sectionLessons.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isEditingCurriculum && (
                          <>
                            <button
                              onClick={() => handleDeleteSection(section.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm hover:shadow-md"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setShowAddLesson(showAddLesson === section.id ? null : section.id)}
                              className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-xs font-semibold transition shadow-sm hover:shadow-md flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Lesson
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section Lessons */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50">
                        {/* Add Lesson Form */}
                        {showAddLesson === section.id && (
                          <div className="mb-4">
                            <LessonForm
                              onSubmit={(data, contentType) => handleAddLesson(section.id, data, contentType)}
                              onCancel={() => setShowAddLesson(null)}
                            />
                          </div>
                        )}

                        {/* Lessons List */}
                        <div className="space-y-2">
                          {sectionLessons.length === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-sm text-slate-500">No lessons yet. Click "+ Lesson" to add one.</p>
                            </div>
                          ) : (
                            sectionLessons.map((lesson, lessonIndex) => (
                              <LessonItem
                                key={lesson.id}
                                lesson={lesson}
                                lessonIndex={lessonIndex}
                                totalLessons={sectionLessons.length}
                                sectionId={section.id}
                                isEditing={editingLesson === lesson.id}
                                isEditingCurriculum={isEditingCurriculum}
                                onEdit={() => setEditingLesson(lesson.id)}
                                onCancel={() => setEditingLesson(null)}
                                onUpdate={(data, contentType) => handleUpdateLesson(lesson.id, data, contentType)}
                                onDelete={() => handleDeleteLesson(lesson.id)}
                                onMove={(e, direction) => handleMoveLesson(e, lesson.id, section.id, direction)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

// Lesson Form Component
const LessonForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [contentType, setContentType] = useState(
    initialData?.video_url ? 'video' : initialData?.document_file ? 'document' : 'video'
  );
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    video_url: initialData?.video_url || '',
    document_file: null,
    content: initialData?.content || '',
    duration: initialData?.duration || 0,
  });
  const [filePreview, setFilePreview] = useState(
    initialData?.document_file_url ? initialData.document_file_url : null
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, document_file: file, video_url: '' });
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, contentType);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-5 bg-white rounded-lg border border-slate-200 shadow-sm space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Lesson Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter lesson title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400"
          required
        />
        <p className="text-xs text-slate-500 mt-1.5">The title of this lesson</p>
      </div>
              
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Content Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contentType"
              value="video"
              checked={contentType === 'video'}
              onChange={(e) => {
                setContentType('video');
                setFormData({ ...formData, document_file: null, video_url: '' });
                setFilePreview(null);
              }}
              className="w-4 h-4 text-primary-500 border-slate-300 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700">Video URL</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contentType"
              value="document"
              checked={contentType === 'document'}
              onChange={(e) => {
                setContentType('document');
                setFormData({ ...formData, video_url: '' });
              }}
              className="w-4 h-4 text-primary-500 border-slate-300 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700">File Upload (Document)</span>
          </label>
        </div>
                
        {contentType === 'video' ? (
          <div>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400"
            />
            <p className="text-xs text-slate-500 mt-1.5">YouTube, Vimeo, or other video platform URL</p>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition"
            />
            {filePreview && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                <span className="font-semibold">Selected:</span> {formData.document_file?.name || 'Current file'}
                {initialData?.document_file_url && !formData.document_file && (
                  <a
                    href={initialData.document_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary-500 hover:underline font-medium"
                  >
                    (View current file)
                  </a>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1.5">Upload PDF, DOC, DOCX, TXT, or MD file for students to read</p>
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Lesson Description
        </label>
        <textarea
          placeholder="Describe what students will learn in this lesson..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400 resize-y"
        />
        <p className="text-xs text-slate-500 mt-1.5">Detailed description or instructions for this lesson</p>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Duration (seconds)
        </label>
        <input
          type="number"
          placeholder="480"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
          min="0"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-slate-900 placeholder-slate-400"
        />
        <p className="text-xs text-slate-500 mt-1.5">Lesson duration in seconds (e.g., 480 = 8 minutes)</p>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
        >
          {initialData ? 'Update' : 'Add'} Lesson
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// Lesson Item Component
const LessonItem = ({ 
  lesson, 
  lessonIndex, 
  totalLessons, 
  sectionId,
  isEditing, 
  isEditingCurriculum,
  onEdit, 
  onCancel, 
  onUpdate, 
  onDelete,
  onMove 
}) => {
  const [contentType, setContentType] = useState(
    lesson.video_url ? 'video' : lesson.document_file ? 'document' : 'video'
  );
  const [formData, setFormData] = useState({
    title: lesson.title || '',
    video_url: lesson.video_url || '',
    document_file: null,
    content: lesson.content || '',
    duration: lesson.duration || 0,
  });
  const [filePreview, setFilePreview] = useState(
    lesson.document_file_url ? lesson.document_file_url : null
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, document_file: file, video_url: '' });
      setFilePreview(URL.createObjectURL(file));
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-slate-50 rounded border border-slate-200">
        <LessonForm
          initialData={{
            ...formData,
            document_file_url: filePreview || lesson.document_file_url,
          }}
          onSubmit={(data, contentType) => {
            onUpdate(data, contentType);
            onCancel();
          }}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        {/* Reorder Buttons - Only show in edit curriculum mode */}
        {isEditingCurriculum && (
          <div className="flex flex-col gap-1 mr-2">
            <button
              type="button"
              onClick={(e) => onMove(e, 'up')}
              disabled={lessonIndex === 0}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Move up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => onMove(e, 'down')}
              disabled={lessonIndex === totalLessons - 1}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Move down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 truncate">{lesson.title}</h4>
            {lesson.duration > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
        </div>
      </div>
      {!isEditingCurriculum && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition shadow-sm hover:shadow-md"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm hover:shadow-md"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseEditor;

