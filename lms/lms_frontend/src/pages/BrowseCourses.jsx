import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { coursesAPI } from '../api/client';
import CourseCard from '../components/CourseCard';
import { COURSE_CATEGORIES, getCategoryLabel } from '../config/courseCategories';

const BrowseCourses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, sortBy]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    navigate(`/browse?${params.toString()}`, { replace: true });
  }, [searchQuery, selectedCategory, sortBy, navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        ordering: sortBy === 'newest' ? '-created_at' : sortBy === 'popular' ? '-created_at' : 'title',
      };
      
      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
      
      let allCourses = [];
      let page = 1;
      let hasNext = true;
      
      while (hasNext) {
        const response = await coursesAPI.getAll({ ...params, page });
        const pageData = response.data;
        
        if (pageData.results) {
          allCourses = [...allCourses, ...pageData.results];
          hasNext = !!pageData.next;
          page++;
        } else if (Array.isArray(pageData)) {
          allCourses = pageData;
          hasNext = false;
        } else {
          hasNext = false;
        }
      }
      
      // Client-side search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allCourses = allCourses.filter(course => 
          course.title?.toLowerCase().includes(query) ||
          course.subtitle?.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
        );
      }
      
      // Client-side sort for popular
      if (sortBy === 'popular') {
        allCourses.sort((a, b) => {
          if (b.reviews_count !== a.reviews_count) {
            return b.reviews_count - a.reviews_count;
          }
          return (b.average_rating || 0) - (a.average_rating || 0);
        });
      }
      
      setCourses(allCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Enhanced with Visual */}
      <section className="relative bg-gradient-to-br from-white via-slate-50 to-blue-50 border-b border-slate-200 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-100/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Browse Courses
            </h1>
            <p className="text-xl text-slate-600 mb-6">
              Find the perfect course for your learning journey
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>1000+ Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Expert Instructors</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>Certificates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search - Sticky */}
      <section className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Search Bar - Coursera Style */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="bg-white rounded-full p-2 flex items-center border-2 border-slate-200 hover:border-primary-300 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-100 transition-all duration-200 max-w-3xl">
              <div className="flex-1 flex items-center px-6">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-3 text-slate-900 outline-none text-base placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      fetchCourses();
                    }}
                    className="ml-2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white rounded-full p-3 transition-colors shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Category and Sort Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">Category:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {COURSE_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {searchQuery 
                ? `Search results for "${searchQuery}"` 
                : selectedCategory !== 'all'
                ? `Courses in ${getCategoryLabel(selectedCategory)}`
                : 'All Courses'
              }
            </h2>
            {!loading && (
              <p className="text-sm text-slate-600">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
              </p>
            )}
          </div>
          {(searchQuery || selectedCategory !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium hover:bg-primary-50 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-200 aspect-video"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <div className="text-red-800 font-semibold text-lg mb-2">Error Loading Courses</div>
            <div className="text-red-600 text-sm mb-6">{error}</div>
            <button
              onClick={fetchCourses}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'No courses available at the moment'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors shadow-md"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BrowseCourses;

