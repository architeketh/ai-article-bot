import React, { useState, useEffect } from 'react';
import { Search, Filter, Bookmark, TrendingUp, Clock, ExternalLink, Moon, Sun, Building2, BarChart3, Calendar, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [savedArticles, setSavedArticles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [articlesPerPage, setArticlesPerPage] = useState(9);
  const [showWeeklySummary, setShowWeeklySummary] = useState(true);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RSS Feed sources
  const RSS_FEEDS = [
  {
    url: 'https://www.archdaily.com/feed',
    category: 'Architecture',
    source: 'ArchDaily',
    logo: '🏛️'
  },
  {
    url: 'https://www.dezeen.com/feed/',
    category: 'Design',
    source: 'Dezeen',
    logo: '📐'
  },
  {
    url: 'https://www.architecturaldigest.com/feed/rss',
    category: 'Architecture',
    source: 'Architectural Digest',
    logo: '🏠'
  },
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'AI News',
    source: 'TechCrunch AI',
    logo: '🤖'
  }
];

  // Fetch articles from RSS feeds
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const allArticles = [];
        
        for (const feed of RSS_FEEDS) {
          try {
            // Using RSS2JSON service to convert RSS to JSON
            const response = await fetch(
              `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`
            );
            
            if (!response.ok) throw new Error('Failed to fetch feed');
            
            const data = await response.json();
            
            if (data.status === 'ok' && data.items) {
              const processedArticles = data.items.map((item, index) => ({
                id: `${feed.source}-${index}-${Date.now()}`,
                title: item.title,
                source: feed.source,
                sourceLogo: feed.logo,
                category: feed.category,
                date: new Date(item.pubDate),
                readTime: Math.floor(Math.random() * 10) + 5,
                summary: item.description ? 
                  item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 
                  'No description available.',
                url: item.link,
                trending: Math.random() > 0.7,
                keywords: extractKeywords(item.title + ' ' + (item.description || '')),
                image: item.enclosure?.link || item.thumbnail
              }));
              
              allArticles.push(...processedArticles);
            }
          } catch (feedError) {
            console.error(`Error fetching ${feed.source}:`, feedError);
          }
        }
        
        // Sort by date
        allArticles.sort((a, b) => b.date - a.date);
        setArticles(allArticles);
        
      } catch (err) {
        setError('Failed to load articles. Please try again later.');
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchArticles, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Extract keywords from text
  const extractKeywords = (text) => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const architectureKeywords = ['design', 'architecture', 'building', 'construction', 'ai', 'parametric', 'generative', 'bim', 'sustainable', 'urban'];
    
    const words = text.toLowerCase()
      .replace(/<[^>]*>/g, '')
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    const keywords = words.filter(word => 
      architectureKeywords.some(kw => word.includes(kw))
    ).slice(0, 3);
    
    return keywords.length > 0 ? keywords : ['architecture', 'design'];
  };

  const categories = ['all', ...new Set(articles.map(a => a.category))];
  const sources = ['all', ...new Set(articles.map(a => a.source))];

  const getCategoryData = () => {
    const categoryCount = {};
    articles.forEach(article => {
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
    });
    return Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const chartData = getCategoryData();
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    return 'just now';
  };

  const toggleSave = (articleId) => {
    setSavedArticles(prev => 
      prev.includes(articleId) ? 
        prev.filter(id => id !== articleId) : 
        [...prev, articleId]
    );
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSource = selectedSource === 'all' || article.source === selectedSource;
    return matchesSearch && matchesCategory && matchesSource;
  }).sort((a, b) => sortBy === 'date' ? b.date - a.date : b.trending - a.trending);

  const trendingCount = articles.filter(a => a.trending).length;

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <RefreshCw className={`w-12 h-12 animate-spin mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading articles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <Building2 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI in Architecture</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {articles.length} articles · {trendingCount} trending · {savedArticles.length} saved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.location.reload()} 
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-green-400 hover:bg-gray-700' : 'bg-gray-100 text-green-600 hover:bg-gray-200'}`}
                title="Refresh articles"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button onClick={() => setShowChart(!showChart)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'}`}>
                <BarChart3 className="w-5 h-5" />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input type="text" placeholder="Search articles, keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>

          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" />Filters
            </button>
            {categories.slice(0, 5).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${selectedCategory === cat ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50')}`}>
                {cat === 'all' ? 'All Topics' : cat}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Source</label>
                  <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <option value="date">Latest First</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showWeeklySummary && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Sparkles className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />Latest Updates
              </h2>
              <button onClick={() => setShowWeeklySummary(false)} className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}>Hide</button>
            </div>
            <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}`}>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Displaying {articles.length} latest articles from top architecture and design sources. Articles are automatically updated every 30 minutes.
              </p>
            </div>
          </div>
        )}

        {!showWeeklySummary && (
          <div className="mb-8">
            <button onClick={() => setShowWeeklySummary(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 transition ${darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>
              <Sparkles className="w-4 h-4" />Show Latest Updates
            </button>
          </div>
        )}

        {showChart && chartData.length > 0 ? (
          <div className={`mb-8 p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Articles by Category</h2>
              <button onClick={() => setShowChart(false)} className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}>Hide</button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 13 }} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : !showChart && (
          <div className="mb-8">
            <button onClick={() => setShowChart(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 transition ${darkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-blue-700 hover:bg-gray-50 border border-gray-200'}`}>
              <BarChart3 className="w-4 h-4" />Show Analytics Chart
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.slice(0, articlesPerPage).map(article => (
            <article key={article.id} className={`group rounded-xl p-6 border transition-all hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{article.sourceLogo}</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{article.source}</span>
                </div>
                <button onClick={() => toggleSave(article.id)} className={`relative ${savedArticles.includes(article.id) ? 'text-yellow-500' : (darkMode ? 'text-gray-500 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500')}`}>
                  <Bookmark className="w-5 h-5" fill={savedArticles.includes(article.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <h2 className={`text-base font-bold mb-3 line-clamp-2 group-hover:text-blue-500 transition ${darkMode ? 'text-white' : 'text-gray-900'}`}>{article.title}</h2>
              <p className={`text-sm mb-4 line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{article.summary}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {article.keywords.map((kw, i) => <span key={i} className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{kw}</span>)}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>{article.category}</span>
                {article.trending && <span className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-700'}`}><TrendingUp className="w-3 h-3" />Trending</span>}
              </div>
              <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}><Clock className="w-3.5 h-3.5" />{article.readTime} min</span>
                  <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}><Calendar className="w-3.5 h-3.5" />{getRelativeTime(article.date)}</span>
                </div>
                <a href={article.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                  Read<ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {filteredArticles.length > articlesPerPage && (
          <div className="flex justify-center mt-8">
            <button onClick={() => setArticlesPerPage(prev => prev + 9)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium hover:scale-105 transition ${darkMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              <RefreshCw className="w-4 h-4" />Load More ({filteredArticles.length - articlesPerPage} remaining)
            </button>
          </div>
        )}

        {filteredArticles.length === 0 && (
          <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No articles found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
