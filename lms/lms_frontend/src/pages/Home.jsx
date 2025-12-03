import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI, getTopInstructors } from '../api/client';
import CourseCard from '../components/CourseCard';
import InstructorCard from '../components/InstructorCard';

const Home = () => {
  const navigate = useNavigate();
  const [popularCourses, setPopularCourses] = useState([]);
  const [newCourses, setNewCourses] = useState([]);
  const [topInstructors, setTopInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPopularCourses(),
        fetchNewCourses(),
        fetchTopInstructors(),
      ]);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopInstructors = async () => {
    try {
      const response = await getTopInstructors('students');
      setTopInstructors(response.data.instructors || []);
    } catch (err) {
      console.error('Error fetching top instructors:', err);
    }
  };

  const fetchPopularCourses = async () => {
    try {
      // Get courses sorted by rating (popular courses)
      // We'll get courses and sort them by reviews_count and average_rating
      const response = await coursesAPI.getAll({ ordering: '-created_at' });
      const courses = response.data.results || response.data || [];
      
      // Sort by reviews count and rating (popular = high reviews + high rating)
      const sorted = [...courses]
        .filter(c => c.reviews_count > 0 || c.average_rating > 0)
        .sort((a, b) => {
          // First by reviews count, then by rating
          if (b.reviews_count !== a.reviews_count) {
            return b.reviews_count - a.reviews_count;
          }
          return (b.average_rating || 0) - (a.average_rating || 0);
        })
        .slice(0, 8); // Top 8 popular courses
      
      setPopularCourses(sorted);
    } catch (err) {
      console.error('Error fetching popular courses:', err);
    }
  };

  const fetchNewCourses = async () => {
    try {
      // Get newest courses
      const response = await coursesAPI.getAll({ ordering: '-created_at' });
      const courses = response.data.results || response.data || [];
      setNewCourses(courses.slice(0, 8)); // Latest 8 courses
    } catch (err) {
      console.error('Error fetching new courses:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchInput = e.target.querySelector('input[type="text"]');
    const query = searchInput?.value?.trim();
    if (query) {
      navigate(`/browse?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/browse');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Enhanced with Visual Elements */}
      <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20 md:py-32 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-100/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-50/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-slate-900">
                Learn without{' '}
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  limits
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-slate-600 max-w-2xl leading-relaxed">
                Start, switch, or advance your career with thousands of courses, Professional Certificates, and degrees from world-class universities and companies.
              </p>
              
              {/* Coursera-style Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl">
                <div className="bg-white rounded-full p-2 flex items-center shadow-xl border-2 border-slate-200 hover:border-primary-300 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-100 transition-all duration-200">
                  <div className="flex-1 flex items-center px-6">
                    <input
                      type="text"
                      placeholder="What do you want to learn?"
                      className="flex-1 py-4 text-slate-900 outline-none text-lg placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 transition-colors shadow-md hover:shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Quick Stats */}
              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">1000+</div>
                    <div className="text-sm text-slate-600">Courses</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">50K+</div>
                    <div className="text-sm text-slate-600">Students</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">4.8</div>
                    <div className="text-sm text-slate-600">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className="hidden lg:block relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-3xl transform rotate-6 opacity-20"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="w-32 h-32 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="flex gap-2 mt-4">
                      <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">Beginner</div>
                      <div className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">Programming</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Instructors Section - Enhanced */}
      {topInstructors.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-3">Learn from the Best</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Our top-rated instructors bring years of industry experience to help you succeed
              </p>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
              {topInstructors.map(instructor => (
                <InstructorCard key={instructor.id} instructor={instructor} />
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/browse?sort=instructors')}
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm inline-flex items-center gap-2"
              >
                View all instructors
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Popular Courses Section - Enhanced */}
      {popularCourses.length > 0 && (
        <section className="bg-gradient-to-b from-white to-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900">Popular Courses</h2>
                </div>
                <p className="text-lg text-slate-600">Most reviewed and highly rated courses by our community</p>
              </div>
              <button
                onClick={() => navigate('/browse?sort=popular')}
                className="hidden lg:flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                View all
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <div className="text-center mt-10 lg:hidden">
              <button
                onClick={() => navigate('/browse?sort=popular')}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow-md"
              >
                View all popular courses
              </button>
            </div>
          </div>
        </section>
      )}

      {/* New Courses Section - Enhanced */}
      {newCourses.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900">New Courses</h2>
                </div>
                <p className="text-lg text-slate-600">Latest courses added to our platform - fresh content every week</p>
              </div>
              <button
                onClick={() => navigate('/browse?sort=newest')}
                className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold rounded-lg transition-colors"
              >
                View all
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <div className="text-center mt-10 lg:hidden">
              <button
                onClick={() => navigate('/browse?sort=newest')}
                className="px-6 py-3 bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold rounded-lg transition-colors"
              >
                View all new courses
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Browse All Courses CTA - Enhanced */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Explore All Courses
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Browse through hundreds of courses, filter by category, and find the perfect course for your learning journey
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-white text-primary-600 hover:bg-slate-100 px-10 py-4 rounded-full font-bold text-lg transition-all shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              Browse All Courses
            </button>
          </div>
          
          {/* Additional Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Certificates</h3>
              <p className="text-white/80 text-sm">Earn certificates upon completion</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Flexible Learning</h3>
              <p className="text-white/80 text-sm">Learn at your own pace, anytime</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Expert Instructors</h3>
              <p className="text-white/80 text-sm">Learn from industry professionals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-800 font-semibold mb-2">Error Loading Data</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
