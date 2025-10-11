import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Bookmark, TrendingUp, Clock, ExternalLink, Moon, Sun, Building2, BarChart3, Calendar, Sparkles, RefreshCw, AlertCircle, Heart, Archive, ArchiveRestore, Trash2, Download, Upload, Database, Cloud, CloudOff, Settings, Check, X } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGistSettings, setShowGistSettings] = useState(false);
  const [gistToken, setGistToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [gistStatus, setGistStatus] = useState('disconnected');
  const [gistError, setGistError] = useState('');
  const fileInputRef = useRef(null);

  // Load Gist settings on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('githubGistToken');
    const savedGistId = localStorage.getItem('githubGistId');
    if (savedToken) {
      setGistToken(savedToken);
      if (savedGistId) {
        setGistId(savedGistId);
        setGistStatus('connected');
      }
    }
  }, []);

  // Auto-sync to Gist when articles change (debounced)
  useEffect(() => {
    if (gistToken && articles.length > 0 && !loading) {
      const timer = setTimeout(() => {
        syncToGist();
      }, 3000); // Wait 3 seconds after last change
      return () => clearTimeout(timer);
    }
  }, [articles, savedArticles, gistToken]);

  const syncToGist = async () => {
    if (!gistToken) return;

    try {
      setGistStatus('syncing');
      
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        articles: articles,
        savedArticles: savedArticles
      };

      const gistData = {
        description: 'AI Architecture Articles Backup',
        public: false,
        files: {
          'ai-architecture-articles.json': {
            content: JSON.stringify(data, null, 2)
          }
        }
      };

      let response;
      if (gistId) {
        // Update existing Gist
        response = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${gistToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gistData)
        });
      } else {
        // Create new Gist
        response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            'Authorization': `token ${gistToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gistData)
        });
      }

      if (!response.ok) {
        throw new Error('Failed to sync to GitHub');
      }

      const result = await response.json();
      
      if (!gistId) {
        setGistId(result.id);
        localStorage.setItem('githubGistId', result.id);
      }

      setGistStatus('connected');
      setGistError('');
    } catch (err) {
      console.error('Gist sync error:', err);
      setGistStatus('error');
      setGistError(err.message);
    }
  };

  const loadFromGist = async () => {
    if (!gistToken || !gistId) return;

    try {
      setGistStatus('syncing');
      
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `token ${gistToken}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load from GitHub');
      }

      const gist = await response.json();
      const fileContent = gist.files['ai-architecture-articles.json']?.content;
      
      if (!fileContent) {
        throw new Error('No data found in Gist');
      }

      const data = JSON.parse(fileContent);
      
      // Merge with existing articles
      const existingIds = new Set(articles.map(a => a.id));
      const newArticles = data.articles.filter(a => !existingIds.has(a.id));
      
      setArticles(prev => [...prev, ...newArticles]);
      
      if (data.savedArticles) {
        const newSaved = [...new Set([...savedArticles, ...data.savedArticles])];
        setSavedArticles(newSaved);
        localStorage.setItem('savedArticles', JSON.stringify(newSaved));
      }

      setGistStatus('connected');
      setGistError('');
      alert('✅ Successfully loaded from GitHub Gist!');
    } catch (err) {
      console.error('Gist load error:', err);
      setGistStatus('error');
      setGistError(err.message);
      alert('❌ Error loading from Gist: ' + err.message);
    }
  };

  const saveGistSettings = () => {
    if (gistToken) {
      localStorage.setItem('githubGistToken', gistToken);
      setGistStatus('connected');
      setShowGistSettings(false);
      syncToGist(); // Initial sync
      alert('✅ GitHub Gist connected! Auto-sync enabled.');
    }
  };

  const disconnectGist = () => {
    if (confirm('Disconnect GitHub Gist? Your data will remain in the Gist but auto-sync will stop.')) {
      localStorage.removeItem('githubGistToken');
      localStorage.removeItem('githubGistId');
      setGistToken('');
      setGistId('');
      setGistStatus('disconnected');
      setShowGistSettings(false);
    }
  };

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
    
    if (text.match(/render|rendering|visualization|visuali[sz]e|3d.*visual|photorealistic|vray|lumion|unreal|unity|blender|corona|octane|lookx|ai.*render|render.*ai/)) {
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

  const extractKeywords = (text) => {
    const foundKeywords = [];
    const lowerText = text.toLowerCase();
    
    const keywordGroups = {
      'midjourney': ['midjourney'],
      'stable diffusion': ['stable diffusion', 'diffusion model'],
      'chatgpt': ['chatgpt', 'gpt-4', 'gpt'],
      'generative design': ['generative', 'parametric'],
      'ai rendering': ['render', 'visualization', 'ai.*render', 'lookx'],
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
      const words = lowerText.split(/\W+/).filter(word => word.length > 4);
      foundKeywords.push(...words.slice(0, 3));
    }
    
    return foundKeywords.slice(0, 4);
  };

  const exportData = (type = 'all') => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      articles: articles,
      savedArticles: savedArticles,
      archivedArticles: articles.filter(a => a.archived),
      activeArticles: articles.filter(a => !a.archived),
      manualArticles: articles.filter(a => a.manual)
    };

    let dataToExport;
    let filename;

    switch(type) {
      case 'archived':
        dataToExport = {
          exportDate: exportData.exportDate,
          version: exportData.version,
          articles: exportData.archivedArticles
        };
        filename = `ai-arch-archived-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'saved':
        dataToExport = {
          exportDate: exportData.exportDate,
          version: exportData.version,
          articles: articles.filter(a => savedArticles.includes(a.id)),
          savedArticles: savedArticles
        };
        filename = `ai-arch-saved-${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        dataToExport = exportData;
        filename = `ai-arch-backup-${new Date().toISOString().split('T')[0]}.json`;
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ Exported ${type === 'all' ? 'complete backup' : type + ' articles'} successfully!`);
    setShowExportMenu(false);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.articles || !Array.isArray(importedData.articles)) {
          throw new Error('Invalid file format');
        }

        const confirmed = confirm(
          `Import ${importedData.articles.length} articles from ${new Date(importedData.exportDate).toLocaleDateString()}?\n\n` +
          `This will merge with your existing articles.`
        );

        if (!confirmed) return;

        const existingIds = new Set(articles.map(a => a.id));
        const newArticles = importedData.articles.filter(a => !existingIds.has(a.id));
        
        setArticles(prev => [...prev, ...newArticles]);

        if (importedData.savedArticles) {
          const newSaved = [...new Set([...savedArticles, ...importedData.savedArticles])];
          setSavedArticles(newSaved);
          localStorage.setItem('savedArticles', JSON.stringify(newSaved));
        }

        const archivedArticles = [...newArticles.filter(a => a.archived)];
        const manualArticles = [...newArticles.filter(a => a.manual)];
        
        localStorage.setItem('archivedArticles', JSON.stringify(archivedArticles));
        localStorage.setItem('manualArticles', JSON.stringify(manualArticles));

        alert(`✅ Successfully imported ${newArticles.length} new articles!`);
      } catch (error) {
        alert('❌ Error importing file: ' + error.message);
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const addArticleByURL = () => {
    const url = prompt('Enter the article URL:');
    if (!url || !url.trim()) return;
    
    const title = prompt('Enter article title:');
    if (!title || !title.trim()) return;
    
    const summary = prompt('Enter a brief summary (optional):') || 'No description provided';
    
    const newArticle = {
      id: url,
      title: title,
      source: 'Manual Addition',
      sourceLogo: '📌',
      category: categorizeArticle(title, summary, 'Manual Addition'),
      date: new Date(),
      readTime: 5,
      summary: summary,
      url: url,
      trending: false,
      keywords: extractKeywords(title + ' ' + summary),
      priority: 1,
      archived: false,
      manual: true
    };
    
    setArticles(prev => [newArticle, ...prev]);
    
    const manualArticles = JSON.parse(localStorage.getItem('manualArticles') || '[]');
    manualArticles.push(newArticle);
    localStorage.setItem('manualArticles', JSON.stringify(manualArticles));
    
    alert('Article added successfully!');
  };

  const archiveArticle = (articleId) => {
    setArticles(prev => prev.map(article => 
      article.id === articleId ? { ...article, archived: true } : article
    ));
    
    const archivedArticles = JSON.parse(localStorage.getItem('archivedArticles') || '[]');
    const articleToArchive = articles.find(a => a.id === articleId);
    if (articleToArchive && !archivedArticles.find(a => a.id === articleId)) {
      archivedArticles.push({ ...articleToArchive, archived: true });
      localStorage.setItem('archivedArticles', JSON.stringify(archivedArticles));
    }
  };

  const restoreArticle = (articleId) => {
    setArticles(prev => prev.map(article => 
      article.id === articleId ? { ...article, archived: false } : article
    ));
    
    const archivedArticles = JSON.parse(localStorage.getItem('archivedArticles') || '[]');
    const updatedArchived = archivedArticles.filter(a => a.id !== articleId);
    localStorage.setItem('archivedArticles', JSON.stringify(updatedArchived));
  };

  const deleteArticle = (articleId) => {
    if (!confirm('Are you sure you want to permanently delete this article? This cannot be undone.')) {
      return;
    }
    
    setArticles(prev => prev.filter(article => article.id !== articleId));
    
    if (savedArticles.includes(articleId)) {
      const newSaved = savedArticles.filter(id => id !== articleId);
      setSavedArticles(newSaved);
      localStorage.setItem('savedArticles', JSON.stringify(newSaved));
    }
    
    const archivedArticles = JSON.parse(localStorage.getItem('archivedArticles') || '[]');
    const updatedArchived = archivedArticles.filter(a => a.id !== articleId);
    localStorage.setItem('archivedArticles', JSON.stringify(updatedArchived));
    
    const manualArticles = JSON.parse(localStorage.getItem('manualArticles') || '[]');
    const updatedManual = manualArticles.filter(a => a.id !== articleId);
    localStorage.setItem('manualArticles', JSON.stringify(updatedManual));
  };

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const archivedArticles = JSON.parse(localStorage.getItem('archivedArticles') || '[]');
        const manualArticles = JSON.parse(localStorage.getItem('manualArticles') || '[]');
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
                  const text = (title + ' ' + description).toLowerCase();
                  
                  const hasAIKeyword = /\b(ai|artificial intelligence|machine learning|neural|generative|parametric|computational)\b/i.test(text);
                  const hasArchKeyword = /\b(architect|design|building|construction|render|bim|visualization)\b/i.test(text);
                  
                  return hasAIKeyword || hasArchKeyword;
                })
                .map((item, index) => {
                  const title = item.title || 'Untitled';
                  const description = item.description || '';
                  const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 200);
                  
                  const stableId = item.link || item.guid || (feed.source + '-' + title.replace(/\W/g, '').substring(0, 30));
                  
                  return {
                    id: stableId,
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
                    priority: feed.priority,
                    archived: false,
                    manual: false
                  };
                });
              
              allArticles.push(...processedArticles);
            }
          } catch (feedError) {
            console.error('Error fetching ' + feed.source + ':', feedError);
          }
        }
        
        allArticles.push(...manualArticles);
        
        const combinedArticles = [...allArticles];
        const newArticleIds = new Set(allArticles.map(a => a.id));
        
        archivedArticles.forEach(archived => {
          if (!newArticleIds.has(archived.id)) {
            combinedArticles.push({ ...archived, archived: true });
          }
        });
        
        combinedArticles.sort((a, b) => {
          if (a.archived !== b.archived) return a.archived ? 1 : -1;
          if (a.priority !== b.priority) return a.priority - b.priority;
          return b.date - a.date;
        });
        
        setArticles(combinedArticles);
        
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const articlesToArchive = combinedArticles
          .filter(a => new Date(a.date) > sevenDaysAgo)
          .slice(0, 200);
        
        localStorage.setItem('archivedArticles', JSON.stringify(articlesToArchive));
        
        if (combinedArticles.length === 0) {
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

  const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))].sort();
  const sources = ['all', ...new Set(articles.map(a => a.source))].filter(Boolean);

  const getCategoryData = () => {
    const categoryCount = {};
    articles.filter(a => !a.archived).forEach(article => {
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
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };

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

  const displayArticles = activeTab === 'saved' 
    ? articles.filter(article => savedArticles.includes(article.id))
    : activeTab === 'archive'
    ? articles.filter(article => article.archived)
    : articles.filter(article => !article.archived);

  const filteredArticles = displayArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSource = selectedSource === 'all' || article.source === selectedSource;
    return matchesSearch && matchesCategory && matchesSource;
  }).sort((a, b) => sortBy === 'date' ? b.date - a.date : b.trending - a.trending);

  const trendingCount = articles.filter(a => a.trending && !a.archived).length;

  if (loading) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="text-center">
          <RefreshCw className={'w-12 h-12 animate-spin mx-auto mb-4 ' + (darkMode ? 'text-blue-400' : 'text-blue-600')} />
          <p className={'text-lg ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>Searching for AI in Architecture articles...</p>
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={importData}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* GitHub Gist Settings Modal */}
      {showGistSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={'max-w-2xl w-full rounded-xl p-6 ' + (darkMode ? 'bg-gray-800' : 'bg-white')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={'text-xl font-bold flex items-center gap-2 ' + (darkMode ? 'text-white' : 'text-gray-900')}>
                <Cloud className="w-6 h-6" />
                GitHub Gist Cloud Sync
              </h2>
              <button onClick={() => setShowGistSettings(false)} className={'p-2 rounded-lg hover:bg-opacity-10 ' + (darkMode ? 'hover:bg-white' : 'hover:bg-black')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={'mb-6 p-4 rounded-lg ' + (darkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200')}>
              <h3 className={'font-semibold mb-2 ' + (darkMode ? 'text-blue-400' : 'text-blue-900')}>How to Setup (2 minutes):</h3>
              <ol className={'text-sm space-y-1 ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>
                <li>1. Go to <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)</a></li>
                <li>2. Click "Generate new token (classic)"</li>
                <li>3. Give it a name like "AI Architecture Sync"</li>
                <li>4. Check the <strong>"gist"</strong> scope only</li>
                <li>5. Click "Generate token" and copy it</li>
                <li>6. Paste it below and click Save</li>
              </ol>
            </div>

            <div className="mb-4">
              <label className={'block text-sm font-medium mb-2 ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={gistToken}
                onChange={(e) => setGistToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className={'w-full px-4 py-2 rounded-lg border font-mono text-sm ' + (darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300')}
              />
            </div>

            {gistError && (
              <div className={'mb-4 p-3 rounded-lg text-sm ' + (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700')}>
                {gistError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={saveGistSettings}
                disabled={!gistToken}
                className={'flex-1 px-4 py-2 rounded-lg font-medium transition ' + (darkMode ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50')}
              >
                <Check className="w-4 h-4 inline mr-2" />
                Save & Enable Auto-Sync
              </button>
              {gistStatus === 'connected' && (
                <button
                  onClick={disconnectGist}
                  className={'px-4 py-2 rounded-lg font-medium transition ' + (darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-700 hover:bg-red-100')}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                  {articles.filter(a => !a.archived).length} articles · {trendingCount} trending · {savedArticles.length} saved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGistSettings(true)}
                className={'p-2 rounded-lg transition relative ' + (darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200') + ' ' + (gistStatus === 'connected' ? 'text-green-400' : gistStatus === 'syncing' ? 'text-blue-400' : gistStatus === 'error' ? 'text-red-400' : 'text-gray-400')}
                title={gistStatus === 'connected' ? 'Cloud sync enabled' : 'Setup cloud sync'}
              >
                {gistStatus === 'connected' ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                {gistStatus === 'syncing' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className={'p-2 rounded-lg transition ' + (darkMode ? 'bg-gray-800 text-purple-400 hover:bg-gray-700' : 'bg-gray-100 text-purple-600 hover:bg-gray-200')}
                  title="Export/Import data"
                >
                  <Database className="w-5 h-5" />
                </button>
                {showExportMenu && (
                  <div className={'absolute right-0 mt-2 w-64 rounded-lg shadow-xl border p-2 z-50 ' + (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
                    <div className={'text-xs font-semibold mb-2 px-2 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>EXPORT</div>
                    <button onClick={() => exportData('all')} className={'w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-opacity-10 text-left ' + (darkMode ? 'hover:bg-blue-500 text-gray-300' : 'hover:bg-blue-100 text-gray-700')}>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Complete Backup</span>
                    </button>
                    <button onClick={() => exportData('archived')} className={'w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-opacity-10 text-left ' + (darkMode ? 'hover:bg-blue-500 text-gray-300' : 'hover:bg-blue-100 text-gray-700')}>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Archived Only</span>
                    </button>
                    <button onClick={() => exportData('saved')} className={'w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-opacity-10 text-left ' + (darkMode ? 'hover:bg-blue-500 text-gray-300' : 'hover:bg-blue-100 text-gray-700')}>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Saved Only</span>
                    </button>
                    <div className={'text-xs font-semibold my-2 px-2 pt-2 border-t ' + (darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-200')}>IMPORT</div>
                    <button onClick={() => fileInputRef.current?.click()} className={'w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-opacity-10 text-left ' + (darkMode ? 'hover:bg-green-500 text-gray-300' : 'hover:bg-green-100 text-gray-700')}>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Import from File</span>
                    </button>
                    {gistId && (
                      <button onClick={() => { loadFromGist(); setShowExportMenu(false); }} className={'w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-opacity-10 text-left ' + (darkMode ? 'hover:bg-green-500 text-gray-300' : 'hover:bg-green-100 text-gray-700')}>
                        <Cloud className="w-4 h-4" />
                        <span className="text-sm">Load from GitHub</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
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

          <div className="flex gap-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ' + (activeTab === 'all' 
                ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50')
              )}
            >
              Recent ({articles.filter(a => !a.archived).length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap ' + (activeTab === 'saved'
                ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50')
              )}
            >
              <Heart className="w-4 h-4" fill={activeTab === 'saved' ? 'currentColor' : 'none'} />
              Saved ({savedArticles.length})
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap ' + (activeTab === 'archive'
                ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border text-gray-700 hover:bg-gray-50')
              )}
            >
              <Archive className="w-4 h-4" />
              Archive ({articles.filter(a => a.archived).length})
            </button>
          </div>

          <div className="relative">
            <Search className={'absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ' + (darkMode ? 'text-gray-500' : 'text-gray-400')} />
            <input 
              type="text" 
              placeholder="Filter current articles..."
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className={'w-full pl-10 pr-32 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900')} 
            />
            <button
              onClick={addArticleByURL}
              className={'absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-medium transition ' + (darkMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700')}
            >
              + Add Article
            </button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className={'block text-sm font-medium mb-2 ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className={'w-full px-3 py-2 rounded-lg border ' + (darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300')}>
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
                {gistStatus === 'connected' ? (
                  <>✅ <strong>Cloud Sync Active!</strong> Your articles automatically backup to GitHub Gist every 3 seconds. Access from any device!</>
                ) : (
                  <>Click the <strong>Cloud icon</strong> to enable automatic GitHub backup - setup takes 2 minutes!</>
                )} {articles.filter(a => !a.archived).length} articles loaded, {articles.filter(a => a.archived).length} archived.
              </p>
            </div>
          </div>
        )}

        {/* Rest of the component remains the same - articles display */}
        {activeTab === 'saved' && savedArticles.length === 0 && (
          <div className={'text-center py-16 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No saved articles yet</p>
            <p className="text-sm mt-2">Bookmark articles to read them later</p>
          </div>
        )}

        {activeTab === 'archive' && articles.filter(a => a.archived).length === 0 && (
          <div className={'text-center py-16 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
            <Archive className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No archived articles yet</p>
          </div>
        )}

        {activeTab === 'all' && showChart && chartData.length > 0 && (
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
              {(article.archived || article.manual) && (
                <div className="flex gap-2 mb-2">
                  {article.archived && (
                    <div className={'px-2 py-1 rounded text-xs inline-block ' + (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')}>
                      <Archive className="w-3 h-3 inline mr-1" />
                      Archived
                    </div>
                  )}
                  {article.manual && (
                    <div className={'px-2 py-1 rounded text-xs inline-block ' + (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')}>
                      ✓ Manual
                    </div>
                  )}
                </div>
              )}
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
              
              <div className={'flex items-center justify-between gap-2 mb-4 pb-4 border-b ' + (darkMode ? 'border-gray-700' : 'border-gray-200')}>
                {!article.archived ? (
                  <button
                    onClick={() => archiveArticle(article.id)}
                    className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ' + (darkMode ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100')}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => restoreArticle(article.id)}
                    className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ' + (darkMode ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-700 hover:bg-green-100')}
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    Restore
                  </button>
                )}
                <button
                  onClick={() => deleteArticle(article.id)}
                  className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ' + (darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-700 hover:bg-red-100')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>

              <div className={'flex items-center justify-between pt-2'}>
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

        {filteredArticles.length === 0 && !loading && (
          <div className={'text-center py-16 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No articles found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
