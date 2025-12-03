import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonsAPI, enrollmentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Helper function to convert YouTube URLs to embed format
const getEmbedUrl = (url) => {
  if (!url) return null;
  
  // If already an embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Convert youtube.com/watch?v=VIDEO_ID to embed format
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Convert youtu.be/VIDEO_ID to embed format
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // For other URLs (Vimeo, direct video, etc.), return as is
  return url;
};

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchLesson();
  }, [lessonId, isAuthenticated, navigate]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await lessonsAPI.getById(lessonId);
      setLesson(response.data);
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

  const handleComplete = async () => {
    if (!lesson) return;

    try {
      setCompleting(true);
      await enrollmentsAPI.completeLesson(lessonId);
      setIsCompleted(true);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to mark lesson as completed.';
      alert(errorMsg);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center text-slate-600">Loading lesson...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'Lesson not found'}</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mt-4 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-600">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="hover:text-sky-600"
        >
          Course
        </button>
        <span className="mx-2">/</span>
        <span>{lesson.section?.title || 'Section'}</span>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">{lesson.title}</span>
      </div>

      {/* Video Player */}
      {lesson.video_url && (
        <div className="rounded-2xl overflow-hidden shadow-lg bg-black aspect-video">
          <iframe
            src={getEmbedUrl(lesson.video_url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={lesson.title}
          />
        </div>
      )}

      {/* Lesson Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{lesson.title}</h1>
        {lesson.duration > 0 && (
          <p className="text-slate-600 mb-4">
            Duration: {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
          </p>
        )}
        
        {lesson.content && (
          <div className="prose max-w-none text-slate-700 mb-6">
            <p>{lesson.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleComplete}
            disabled={isCompleted || completing}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              isCompleted
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50'
            }`}
          >
            {completing
              ? 'Marking...'
              : isCompleted
              ? 'Completed ✓'
              : 'Mark as Completed'}
          </button>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-6 py-3 rounded-lg font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Back to Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;

