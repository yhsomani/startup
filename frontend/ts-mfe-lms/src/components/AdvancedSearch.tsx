import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

interface SearchFilters {
  query: string;
  category: string;
  difficulty: string;
  duration: string;
  price: string;
  language: string;
  rating: string;
  hasCertificate: boolean;
  isFree: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'lesson' | 'quiz' | 'discussion';
  category: string;
  difficulty: string;
  duration: number;
  price: number;
  rating: number;
  enrollmentCount: number;
  instructor: string;
  instructorAvatar: string;
  thumbnail: string;
  tags: string[];
  highlights: string[];
  url: string;
  score: number;
}

const AdvancedSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: searchParams.get('category') || 'all',
    difficulty: searchParams.get('difficulty') || 'all',
    duration: searchParams.get('duration') || 'all',
    price: searchParams.get('price') || 'all',
    language: searchParams.get('language') || 'all',
    rating: searchParams.get('rating') || 'all',
    hasCertificate: searchParams.get('certificate') === 'true',
    isFree: searchParams.get('free') === 'true'
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setTotalResults(0);
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);

        const searchRequest = {
          q: searchQuery.trim(),
          category: filters.category !== 'all' ? filters.category : undefined,
          difficulty: filters.difficulty !== 'all' ? filters.difficulty : undefined,
          duration: filters.duration !== 'all' ? filters.duration : undefined,
          price: filters.price !== 'all' ? filters.price : undefined,
          language: filters.language !== 'all' ? filters.language : undefined,
          rating: filters.rating !== 'all' ? filters.rating : undefined,
          hasCertificate: filters.hasCertificate || undefined,
          isFree: filters.isFree || undefined,
          page: currentPage,
          pageSize: 20
        };

        const response = await api.get('/search', { params: searchRequest });

        setResults(response.data.results || []);
        setTotalResults(response.data.total || 0);

        // Add to search history
        if (searchQuery.trim()) {
          setSearchHistory(prev => {
            const filtered = prev.filter(item => item !== searchQuery.trim());
            return [searchQuery.trim(), ...filtered].slice(0, 10);
          });
        }

      } catch (err: any) {
        console.error('Search failed:', err);
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters, currentPage]
  );

  const debouncedSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get('/search/suggestions', {
          params: { q: searchQuery.trim(), limit: 8 }
        });
        setSuggestions(response.data.suggestions || []);
      } catch (err) {
        console.error('Suggestions failed:', err);
        setSuggestions([]);
      }
    }, 200),
    []
  );

  useEffect(() => {
    const delayedQuery = setTimeout(() => {
      if (query.trim().length > 1) {
        debouncedSearch(query);
      } else {
        setResults([]);
        setTotalResults(0);
        setSuggestions([]);
      }
    }, 500);

    if (query.trim().length > 1) {
      debouncedSuggestions(query);
    }

    return () => clearTimeout(delayedQuery);
  }, [query, filters, currentPage, debouncedSearch, debouncedSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    debouncedSearch(query);
    setShowSuggestions(false);

    // Update URL
    const params = new URLSearchParams();
    params.set('q', query);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value.toString());
      }
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFilterChange = (filterName: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);

    // Update URL
    const params = new URLSearchParams();
    params.set('q', query);
    Object.entries(newFilters).forEach(([key, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        params.set(key, filterValue.toString());
      }
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    const params = new URLSearchParams();
    params.set('q', query);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value.toString());
      }
    });
    params.set('page', page.toString());
    setSearchParams(params);
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };



  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return '📚';
      case 'lesson': return '📹';
      case 'quiz': return '📝';
      case 'discussion': return '💬';
      default: return '📄';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const totalPages = Math.ceil(totalResults / 20);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
        🔍 Advanced Search
      </h1>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid #e5e7eb'
      }}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search courses, lessons, quizzes, and discussions..."
              style={{
                width: '100%',
                padding: '1rem 3rem 1rem 3rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 {suggestion}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.5rem 1rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Search
            </button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>
                Recent Searches
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(term);
                      inputRef.current?.focus();
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    🕐 {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Filters */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            Filters
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="all">All Categories</option>
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="marketing">Marketing</option>
                <option value="data-science">Data Science</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Price
              </label>
              <select
                value={filters.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="all">All Prices</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="under50">Under $50</option>
                <option value="50to100">$50 - $100</option>
                <option value="over100">Over $100</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Duration
              </label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="all">All Durations</option>
                <option value="short">Under 2 hours</option>
                <option value="medium">2-5 hours</option>
                <option value="long">Over 5 hours</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.hasCertificate}
                  onChange={(e) => handleFilterChange('hasCertificate', e.target.checked)}
                />
                <span>Has Certificate</span>
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.isFree}
                  onChange={(e) => handleFilterChange('isFree', e.target.checked)}
                />
                <span>Free Only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
              Search Results
            </h2>
            {query && (
              <span style={{ color: '#6b7280', fontSize: '1rem' }}>
                "{query}" - {totalResults} results found
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="all">Sort by Relevance</option>
              <option value="highest">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>

            <select
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔍</div>
            <h3>Searching...</h3>
          </div>
        )}

        {!loading && results.length === 0 && query.length > 1 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer'
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: '120px',
                  height: '80px',
                  borderRadius: '8px',
                  backgroundColor: '#f3f4f6',
                  backgroundImage: result.thumbnail ? `url(${result.thumbnail})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {!result.thumbnail && (
                    <div style={{ fontSize: '2rem', color: '#9ca3af' }}>
                      {getTypeIcon(result.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: getDifficultyColor(result.difficulty) + '20',
                      color: getDifficultyColor(result.difficulty)
                    }}>
                      {result.difficulty}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {result.category}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4f46e5' }}>
                      {result.type}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1f2937'
                  }}>
                    {result.title}
                  </h3>
                </div>

                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  lineHeight: '1.4',
                  margin: 0,
                  marginBottom: '0.5rem'
                }}>
                  {result.description}
                </p>

                {result.highlights.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {result.highlights.map((highlight, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '12px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>👥 {result.enrollmentCount} enrolled</span>
                  {result.duration && <span>• ⏱️ {formatDuration(result.duration)}</span>}
                  <span>• ⭐ {result.rating.toFixed(1)}/5</span>
                  {result.price > 0 && <span>• 💰 ${result.price}</span>}
                  <span>• 👨 {result.instructor}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {
        totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>

            <span style={{ padding: '0.5rem 1rem' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        )
      }
    </div >
  );
};

// Simple debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  }) as unknown as T;
}

export default AdvancedSearch;