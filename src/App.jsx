import React, { useState, useEffect } from 'react';
import { Search, Filter, Bookmark, TrendingUp, Clock, ExternalLink, Moon, Sun, Building2, BarChart3, Calendar, Sparkles, RefreshCw, AlertCircle, Heart } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'saved'

  // AI Architecture-focused keywords for filtering
  const AI_ARCHITECTURE_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'neural network', 'deep learning',
    'generative design', 'generative', 'parametric', 'computational design',
    'bim', 'building information modeling', 'revit', 'archicad',
    'rendering', 'visualization', 'midjourney', 'stable diffusion', 'dall-e',
    'algorithm', 'optimization', 'automation', 'digital fabrication',
    'blockchain', 'smart contract', 'nft',
    'grasshopper', 'rhino', 'dynamo',
    'gpt', 'chatgpt', 'claude', 'llm',
    'nerf', 'gaussian splatting', 'photogrammetry',
    '3d printing', 'robotic construction', 'prefabrication',
    'sustainable', 'energy efficiency', 'climate',
    'digital twin', 'simulation', 'performance analysis',
    'design process', 'design tool', 'workflow', 'collaboration',
    'render', '3d', 'vray', 'unreal', 'unity', 'blender'
  ];

  // Curated RSS feeds for AI in Architecture
  const RSS_FEEDS = [
    {
      url: 'https://www.archdaily.com/feed',
      category: 'Architecture News',
      source: 'ArchDaily',
      logo: '🏛️',
      priority: 1
    },
    {
      url: 'https://www.dezeen.com/feed/',
      category: 'Design Innovation',
      source: 'Dezeen',
      logo: '📐',
      priority: 1
    },
    {
      url: 'https://www.architectmagazine.com/rss',
      category: 'Practice & Technology',
      source: 'Architect Magazine',
      logo: '📰',
      priority: 1
    },
    {
      url: 'https://architizer.com/blog/feed/',
      category: 'Architecture Blog',
      source: 'Architizer',
      logo: '🏗️',
      priority: 1
    },
    {
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      category: 'AI Technology',
      source: 'TechCrunch AI',
      logo: '💻',
      priority: 2
    },
    {
      url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
      category: 'AI Research',
      source: 'MIT Technology Review',
      logo: '🔬',
      priority: 2
    },
    {
      url: 'https://venturebeat.com/category/ai/feed/',
      category: 'AI Industry',
      source: 'VentureBeat AI',
      logo: '💼',
      priority: 2
    },
    {
      url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
      category: 'AI & Design Tech',
      source: 'The Verge AI',
      logo: '⚡',
      priority: 2
    },
    {
      url: 'https://www.fastcompany.com/technology/rss',
      category: 'Innovation & Design',
      source: 'Fast Company Tech',
      logo: '🚀',
      priority: 1
    },
    {
      url: 'https://www.wired.com/feed/tag/ai/latest/rss',
      category: 'AI Culture',
      source: 'Wired AI',
      logo: '🔮',
      priority: 2
    },
    {
      url: 'https://www.grasshopper3d.com/forum/feed/feed:topics:new',
      category: 'Parametric Tools',
      source: 'Grasshopper3D',
      logo: '🦗',
      priority: 1
    },
    {
      url: 'https://www.constructiondive.com/feeds/news/',
      category: 'Construction Tech',
      source: 'Construction Dive',
      logo: '👷',
      priority: 2
    },
    {
      url: 'https://www.autodesk.com/blogs/feed/',
      category: 'Design Software',
      source: 'Autodesk Blog',
      logo: '🛠️',
      priority: 2
    }
  ];

  // Enhanced relevance checking
  const isRelevantArticle = (title, description) => {
    const text = (title + ' ' + description).toLowerCase();
    
    const highPriorityPatterns = [
      /ai.*architect/,
      /architect.*ai/,
      /generative.*design/,
      /design.*process.*ai/,
      /ai.*design.*tool/,
      /midjourney.*architect/,
      /stable diffusion.*design/,
      /ai.*transform.*architect/,
      /architect.*guide.*ai/,
      /firm.*ai/,
      /studio.*ai/,
      /practice.*ai/,
      /render.*ai/,
      /ai.*render/,
      /visualization.*ai/,
      /ai.*visualization/
    ];
    
    if (highPriorityPatterns.some(pattern => pattern.test(text))) {
      return true;
    }
    
    const hasAIKeyword = text.match(/\b(ai|artificial intelligence|machine learning|neural)\b/);
    const hasArchKeyword = text.match(/\b(architect|design|building|construction|bim|parametric|generative|render)\b/);
    
    if (hasAIKeyword && hasArchKeyword) {
      return true;
    }
    
    if (text.match(/midjourney|stable diffusion|dall-e|chatgpt|grasshopper|dynamo|revit.*ai|nerf|gaussian/)) {
      return true;
    }
    
    return false;
  };

  // Enhanced categorization
  const categorizeArticle = (title, description, defaultCategory) => {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.match(/design process|workflow|collaboration|practice|studio|architect.*use|how.*design/)) {
      return 'Design Process';
    }
    
    if (text.match(/tool|software|app|platform|midjourney|dall-e|stable diffusion|chatgpt|plugin|extension/)) {
      return 'AI Tools';
    }
    
    if (text.match(/machine learning|deep learning|neural network|model training|dataset|research|study/)) {
      return 'Machine Learning';
    }
    
    if (text.match(/generative|parametric|computational|algorithm|procedural/)) {
      return 'Generative Design';
    }
    
    if (text.match(/bim|revit|archicad|building information|digital.*tool|dynamo/)) {
      return 'BIM & Digital Tools';
    }
    
    // Make rendering detection more aggressive
    if (text.match(/render|rendering|visualization|visuali[sz]e|3d.*visual|photorealistic|vray|lumion|unreal|unity|blender|corona|octane/)) {
      return 'Rendering & Visualization';
    }
    
    if (text.match(/virtual reality|augmented reality|vr|ar|xr|metaverse|immersive/)) {
      return 'VR/AR/XR';
    }
    
    if (text.match(/construction|fabrication|3d print|robotic|prefab|modular/)) {
      return 'Construction Tech';
    }
    
    if (text.match(/sustainable|sustainability|energy|climate|environmental|performance.*analysis|simulation/)) {
      return 'Sustainability';
    }
    
    if (text.match(/education|teaching|learning|course|workshop|tutorial|student|university/)) {
      return 'Education';
    }
    
    if (text.match(/hardware|device|sensor|iot|mobile|tablet|smartphone|wearable/)) {
      return 'Hardware & Devices';
    }
    
    if (text.match(/award|prize|winner|competition|recognition|honor|fellowship/)) {
      return 'Awards & Recognition';
    }
    
    if (text.match(/blockchain|nft|crypto|web3|smart contract|decentralized/)) {
      return 'Blockchain';
    }
    
    if (text.match(/trend|future|prediction|forecast|survey|report|analysis|market/)) {
      return 'Trends & Analysis';
    }
    
    if (text.match(/project|case study|firm|studio.*use|architect.*explain|example|implementation/)) {
      return 'Case Studies';
    }
    
    return defaultCategory;
  };

  // Enhanced keyword extraction
  const extractKeywords = (text) => {
    const foundKeywords = [];
    const lowerText = text.toLowerCase();
    
    const keywordGroups = {
      'midjourney': ['midjourney'],
      'stable diffusion': ['stable diffusion', 'diffusion model'],
      'chatgpt': ['chatgpt', 'gpt-4', 'gpt'],
      'generative design': ['generative', 'parametric'],
      'ai rendering': ['render', 'visualization', 'ai.*render'],
      'bim': ['bim', 'revit', 'building information'],
      'machine learning': ['machine learning', 'ml', 'neural'],
      'design process': ['design process', 'workflow', 'practice'],
      'computational': ['algorithm', 'computational', 'optimization'],
      'blockchain': ['blockchain', 'nft', 'smart contract'],
      'digital twin': ['digital twin', 'simulation'],
      'vr/ar': ['virtual reality', 'augmented reality', 'vr', 'ar'],
      '3d printing': ['3d print', 'additive manufacturing'],
      'grasshopper': ['grasshopper', 'rhino'],
      'sustainability': ['sustainable', 'energy', 'climate'],
      'education': ['education', 'learning', 'course']
    };
    
    for (const [label, keywords] of Object.entries(keywordGroups)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        foundKeywords.push(label);
      }
    }
    
    if (foundKeywords.length === 0) {
      const words = lowerText.split(/\W+/)
        .filter(word => word.length > 4 && AI_ARCHITECTURE_KEYWORDS.includes(word));
      foundKeywords.push(...words.slice(0, 3));
    }
    
    return foundKeywords.slice(0, 4);
  };

  // Fetch articles from RSS feeds
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const allArticles = [];
        
        for (const feed of RSS_FEEDS) {
          try {
            const response = await fetch(
              'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed.url) + '&api_key=q1ihf2w1uk1uwljssn3dngzhms9ajhqjpzfpqgf4&count=20'
            );
            
            if (!response.ok) {
              console.warn('Failed to fetch ' + feed.source);
              continue;
            }
            
            const data = await response.json();
            
            if (data.status === 'ok' && data.items) {
              const processedArticles = data.items
                .filter(item => {
                  const title = item.title || '';
                  const description = item.description || '';
                  return isRelevantArticle(title, description);
                })
                .map((item, index) => {
                  const title = item.title || 'Untitled';
                  const description = item.description || '';
                  const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 200);
                  
                  return {
                    id: item.link || item.guid || (feed.source + '-' + item.title.substring(0, 30).replace(/\W/g, '')),
                    title: title,
                    source: feed.source,
                    sourceLogo: feed.logo,
                    category: categorizeArticle(title, description, feed.category),
                    originalCategory: feed.category,
                    date: new Date(item.pubDate || Date.now()),
                    readTime: Math.floor(cleanDescription.length / 200) + 5,
                    summary: cleanDescription + '...',
                    url: item.link || item.guid || '#',
                    trending: Math.random() > 0.75,
                    keywords: extractKeywords(title + ' ' + description),
                    image: item.enclosure?.link || item.thumbnail,
                    priority: feed.priority
                  };
                });
              
              allArticles.push(...processedArticles);
            }
          } catch (feedError) {
            console.error('Error fetching ' + feed.source + ':', feedError);
          }
        }
        
        allArticles.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return b.date - a.date;
        });
        
        setArticles(allArticles);
        
        if (allArticles.length === 0) {
          setError('No AI architecture articles found. Please try again later.');
        }
        
      } catch (err) {
        setError('Failed to load articles. Please try again later.');
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
    
    const interval = setInterval(fetchArticles, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved articles from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedArticles');
    if (saved) {
      try {
        setSavedArticles(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved articles:', e);
      }
    }
  }, []);

  // Dynamically generate categories from actual articles
  const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))].sort();

  const sources = ['all', ...new Set(articles.map(a => a.source))].filter(Boolean);

  const getCategoryData = () => {
    const categoryCount = {};
    articles.forEach(article => {
      if (article.category) {
        categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
      }
    });
    return Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const chartData = getCategoryData();
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

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
        return interval + ' ' + unit + (interval === 1 ? '' : 's') + ' ago';
      }
    }
    return 'just now';
  };

  const toggleSave = (articleId) => {
    const newSavedArticles = savedArticles.includes(articleId) 
      ? savedArticles.filter(id => id !== articleId)
      : [...savedArticles, articleId];
    
    setSavedArticles(newSavedArticles);
    localStorage.setItem('savedArticles', JSON.stringify(newSavedArticles));
  };

  // Filter articles based on active tab
  const displayArticles = activeTab === 'saved' 
    ? articles.filter(article => savedArticles.includes(article.id))
    : articles;

  const filteredArticles = displayArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSource = selectedSource === 'all' || article.source === selectedSource;
    return matchesSearch && matchesCategory && matchesSource;
  }).sort((a, b) => sortBy === 'date' ? b.date - a.date : b.trending - a.trending);

  const trendingCount = articles.filter(a => a.trending).length;

  if (loading) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="text-center">
          <RefreshCw className={'w-12 h-12 animate-spin mx-auto mb-4 ' + (darkMode ? 'text-blue-400' : 'text-blue-600')} />
          <p className={'text-lg ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>Searching for AI in Architecture articles...</p>
          <p className={'text-sm mt-2 ' + (darkMode ? 'text-gray-500' : 'text-gray-500')}>
            Looking for: AI Tools, Design Process, Rendering, Case Studies
          </p>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="text-center max-w-md">
          <AlertCircle className={'w-12 h-12 mx-auto mb-4 ' + (darkMode ? 'text-red-400' : 'text-red-600')} />
          <p className={'text-lg mb-4 ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen transition-colors duration-300 ' + (darkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      <header className={'sticky top-0 z-50 backdrop-blur-xl border-b ' + (darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={'p-2 rounded-xl ' + (darkMode ? 'bg-blue-500/10' : 'bg-blue-50')}>
                <Building2 className={'w-6 h-6 ' + (darkMode ? 'text-blue-400' : 'text-blue-600')} />
              </div>
              <div>
                <h1 className={'text-2xl font-bold ' + (darkMode ? 'text-white' : 'text-gray-900')}>AI in Architecture</h1>
                <p className={'text-sm ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
                  {articles.length} articles · {trendingCount} trending · {savedArticles.length} saved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.location.reload()} 
                className={'p-2 rounded-lg transition ' + (darkMode ? 'bg-gray-800 text-green-400 hover:bg-gray-700' : 'bg-gray-100 text-green-600 hover:bg-gray-200')}
                title="Refresh articles"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button onClick={() => setShowChart(!showChart)} className={'p-2 rounded-lg ' + (darkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-gray-100 text-blue-600 hover:bg-gray-200')}>
                <BarChart3 className="w-5 h-5" />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className={'p-2 rounded-lg ' + (darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Tabs for All / Saved */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={'px-4 py-2 rounded-lg font-medium transition ' + (activeTab === 'all' 
                ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50')
              )}
            >
              All Articles ({articles.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ' + (activeTab === 'saved'
                ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50')
              )}
            >
              <Heart className="w-4 h-4" fill={activeTab === 'saved' ? 'currentColor' : 'none'} />
              Saved ({savedArticles.length})
            </button>
          </div>

          <div className="relative">
            <Search className={'absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ' + (darkMode ? 'text-gray-500' : 'text-gray-400')} />
            <input 
              type="text" 
              placeholder="Search: AI Tools, Design Process, Midjourney, Rendering..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className={'w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900')} 
            />
          </div>

          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <button onClick={() => setShowFilters(!showFilters)} className={'flex items-center gap-2 px-4 py-2 rounded-lg ' + (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50')}>
              <Filter className="w-4 h-4" />Filters
            </button>
            {categories.slice(0, 6).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={'px-4 py-2 rounded-lg text-sm whitespace-nowrap ' + (selectedCategory === cat ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50'))}>
                {cat === 'all' ? 'All Topics' : cat}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className={'mt-4 p-4 rounded-xl ' + (darkMode ? 'bg-gray-800' : 'bg-white border')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={'block text-sm font-medium mb-2 ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                    className={'w-full px-3 py-2 rounded-lg border ' + (darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300')}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className={'block text-sm font-medium mb-2 ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>Source</label>
                  <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}
                    className={'w-full px-3 py-2 rounded-lg border ' + (darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300')}>
                    {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'all' && showWeeklySummary && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className={'text-xl font-bold flex items-center gap-2 ' + (darkMode ? 'text-white' : 'text-gray-900')}>
                <Sparkles className={'w-5 h-5 ' + (darkMode ? 'text-blue-400' : 'text-blue-600')} />AI Architecture Insights
              </h2>
              <button onClick={() => setShowWeeklySummary(false)} className={'text-sm ' + (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700')}>Hide</button>
            </div>
            <div className={'p-5 rounded-xl border ' + (darkMode ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200')}>
              <p className={'text-sm leading-relaxed ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>
                Displaying {articles.length} curated articles on AI in Architecture. Categories include: <strong>Design Process, AI Tools, Rendering & Visualization, Case Studies, Generative Design, Machine Learning, BIM, and Construction Tech</strong>. 
                Articles refresh every 30 minutes from top sources.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.slice(1, 7).map((cat, idx) => (
                  <span key={idx} className={'px-2 py-1 rounded text-xs ' + (darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700')}>{cat}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all' && !showWeeklySummary && (
          <div className="mb-8">
            <button onClick={() => setShowWeeklySummary(true)}
              className={'flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 transition ' + (darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200')}>
              <Sparkles className="w-4 h-4" />Show AI Architecture Insights
            </button>
          </div>
        )}

        {activeTab === 'saved' && savedArticles.length === 0 && (
          <div className={'text-center py-16 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No saved articles yet</p>
            <p className="text-sm mt-2">Bookmark articles to read them later</p>
            <button
              onClick={() => setActiveTab('all')}
              className={'mt-4 px-6 py-2 rounded-lg font-medium transition ' + (darkMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700')}
            >
              Browse Articles
            </button>
          </div>
        )}

        {activeTab === 'all' && showChart && chartData.length > 0 ? (
          <div className={'mb-8 p-6 rounded-xl border ' + (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={'text-lg font-bold ' + (darkMode ? 'text-white' : 'text-gray-900')}>Articles by Category</h2>
              <button onClick={() => setShowChart(false)} className={'text-sm ' + (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700')}>Hide</button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 13 }} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb'), borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => <Cell key={'cell-' + index} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : activeTab === 'all' && !showChart && (
          <div className="mb-8">
            <button onClick={() => setShowChart(true)}
              className={'flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 transition ' + (darkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-blue-700 hover:bg-gray-50 border border-gray-200')}>
              <BarChart3 className="w-4 h-4" />Show Analytics Chart
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.slice(0, articlesPerPage).map(article => (
            <article key={article.id} className={'group rounded-xl p-6 border transition-all hover:shadow-xl hover:-translate-y-1 ' + (darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-300')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{article.sourceLogo}</span>
                  <span className={'text-xs font-medium ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>{article.source}</span>
                </div>
                <button onClick={() => toggleSave(article.id)} className={'relative ' + (savedArticles.includes(article.id) ? 'text-yellow-500' : (darkMode ? 'text-gray-500 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'))}>
                  <Bookmark className="w-5 h-5" fill={savedArticles.includes(article.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <h2 className={'text-base font-bold mb-3 line-clamp-2 group-hover:text-blue-500 transition ' + (darkMode ? 'text-white' : 'text-gray-900')}>{article.title}</h2>
              <p className={'text-sm mb-4 line-clamp-3 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>{article.summary}</p>
              {article.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {article.keywords.map((kw, i) => <span key={i} className={'px-2 py-0.5 rounded text-xs ' + (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}>{kw}</span>)}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={'px-2 py-1 rounded-md text-xs font-medium ' + (darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700')}>{article.category}</span>
                {article.trending && <span className={'px-2 py-1 rounded-md text-xs flex items-center gap-1 ' + (darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-700')}><TrendingUp className="w-3 h-3" />Trending</span>}
              </div>
              <div className={'flex items-center justify-between pt-4 border-t ' + (darkMode ? 'border-gray-700' : 'border-gray-200')}>
                <div className="flex items-center gap-3 text-xs">
                  <span className={'flex items-center gap-1 ' + (darkMode ? 'text-gray-500' : 'text-gray-500')}><Clock className="w-3.5 h-3.5" />{article.readTime} min</span>
                  <span className={'flex items-center gap-1 ' + (darkMode ? 'text-gray-500' : 'text-gray-500')}><Calendar className="w-3.5 h-3.5" />{getRelativeTime(article.date)}</span>
                </div>
                <a href={article.url} target="_blank" rel="noopener noreferrer" className={'flex items-center gap-1 text-xs font-medium ' + (darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700')}>
                  Read<ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {filteredArticles.length > articlesPerPage && (
          <div className="flex justify-center mt-8">
            <button onClick={() => setArticlesPerPage(prev => prev + 9)}
              className={'flex items-center gap-2 px-6 py-3 rounded-lg font-medium hover:scale-105 transition ' + (darkMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700')}>
              <RefreshCw className="w-4 h-4" />Load More ({filteredArticles.length - articlesPerPage} remaining)
            </button>
          </div>
        )}

        {filteredArticles.length === 0 && !loading && activeTab === 'all' && (
          <div className={'text-center py-16 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
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
