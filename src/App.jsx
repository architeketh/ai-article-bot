import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Bookmark, TrendingUp, Clock, ExternalLink, Moon, Sun, Building2, BarChart3, Calendar, Sparkles, RefreshCw, AlertCircle, Heart, Archive, ArchiveRestore, Trash2, Download, Upload, Database, Cloud, CloudOff, Settings, Check, X, Mail } from 'lucide-react';
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
  const [showArchiveChart, setShowArchiveChart] = useState(true);
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
  const [feedStatus, setFeedStatus] = useState({});
  const [showFeedStatus, setShowFeedStatus] = useState(false);
  const [showFeedManager, setShowFeedManager] = useState(false);
  const [customFeeds, setCustomFeeds] = useState([]);
  const [viewCount, setViewCount] = useState(null);

  const DEFAULT_RSS_FEEDS = [
    { url: 'https://www.archdaily.com/feed', category: 'Architecture News', source: 'ArchDaily', logo: '🏛️', priority: 1, requireBoth: true, enabled: true },
    { url: 'https://www.dezeen.com/feed/', category: 'Design Innovation', source: 'Dezeen', logo: '📐', priority: 1, requireBoth: true, enabled: true },
    { url: 'https://www.architectmagazine.com/rss', category: 'Practice & Technology', source: 'Architect Magazine', logo: '📰', priority: 1, requireBoth: true, enabled: true },
    { url: 'https://architizer.com/blog/feed/', category: 'Architecture Blog', source: 'Architizer', logo: '🏗️', priority: 1, requireBoth: true, enabled: true },
    { url: 'https://www.constructiondive.com/feeds/news/', category: 'Construction Tech', source: 'Construction Dive', logo: '👷', priority: 2, requireBoth: true, enabled: true },
    { url: 'https://www.architecturaldigest.com/feed/rss', category: 'Design & Architecture', source: 'Architectural Digest', logo: '🏠', priority: 1, requireBoth: false, enabled: true }
  ];

  const RSS_FEEDS = customFeeds.length > 0 ? customFeeds.filter(f => f.enabled) : DEFAULT_RSS_FEEDS.filter(f => f.enabled);

  const sendFeedback = () => {
    const subject = encodeURIComponent('AI Architecture Bot Feedback');
    const body = encodeURIComponent(`Total Articles: ${articles.length}\nActive: ${articles.filter(a => !a.archived).length}\nArchived: ${articles.filter(a => a.archived).length}\nSaved: ${savedArticles.length}\n\nFeedback:\n`);
    window.location.href = `mailto:architek.eth@gmail.com?subject=${subject}&body=${body}`;
  };

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
    
    const savedFeeds = localStorage.getItem('customFeeds');
    if (savedFeeds) {
      try {
        const parsedFeeds = JSON.parse(savedFeeds);
        setCustomFeeds(parsedFeeds);
      } catch (e) {
        console.error('Error loading custom feeds:', e);
      }
    }

    const fetchViewCount = async () => {
      try {
        const response = await fetch('https://api.countapi.xyz/hit/ai-architecture-news/visits');
        const data = await response.json();
        if (data.value) {
          setViewCount(data.value);
        }
      } catch (err) {
        const sessionViews = parseInt(localStorage.getItem('sessionViews') || '0') + 1;
        localStorage.setItem('sessionViews', sessionViews.toString());
        setViewCount(sessionViews);
      }
    };
    
    fetchViewCount();
  }, []);

  const handleOpenFeedManager = () => {
    setShowFeedManager(true);
  };

  const addFeed = () => {
    const url = prompt('Enter RSS feed URL:');
    if (!url || !url.trim()) return;
    
    const source = prompt('Enter source name:');
    if (!source || !source.trim()) return;
    
    const category = prompt('Enter category:');
    const logo = prompt('Enter emoji logo:') || '📰';
    
    const newFeed = {
      url: url.trim(),
      source: source.trim(),
      category: category?.trim() || 'General',
      logo: logo,
      priority: 1,
      requireBoth: false,
      enabled: true
    };
    
    const updatedFeeds = [...(customFeeds.length > 0 ? customFeeds : DEFAULT_RSS_FEEDS), newFeed];
    setCustomFeeds(updatedFeeds);
    localStorage.setItem('customFeeds', JSON.stringify(updatedFeeds));
    
    if (confirm('✅ Feed added! Refresh now?')) {
      window.location.reload();
    }
  };

  const toggleFeed = (index) => {
    const feedsToUpdate = customFeeds.length > 0 ? [...customFeeds] : [...DEFAULT_RSS_FEEDS];
    feedsToUpdate[index].enabled = !feedsToUpdate[index].enabled;
    setCustomFeeds(feedsToUpdate);
    localStorage.setItem('customFeeds', JSON.stringify(feedsToUpdate));
    
    if (confirm(`Feed ${feedsToUpdate[index].enabled ? 'enabled' : 'disabled'}! Refresh now?`)) {
      window.location.reload();
    }
  };

  const deleteFeed = (index) => {
    const feedsToUpdate = customFeeds.length > 0 ? [...customFeeds] : [...DEFAULT_RSS_FEEDS];
    if (confirm(`Delete feed "${feedsToUpdate[index].source}"?`)) {
      feedsToUpdate.splice(index, 1);
      setCustomFeeds(feedsToUpdate);
      localStorage.setItem('customFeeds', JSON.stringify(feedsToUpdate));
      
      if (confirm('Feed deleted! Refresh now?')) {
        window.location.reload();
      }
    }
  };

  const resetFeeds = () => {
    if (confirm('Reset to default feeds?')) {
      setCustomFeeds([]);
      localStorage.removeItem('customFeeds');
      
      if (confirm('✅ Reset! Refresh now?')) {
        window.location.reload();
      }
    }
  };

  const syncToGist = async () => {
    if (!gistToken) return;
    try {
      setGistStatus('syncing');
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        articles: articles,
        savedArticles: savedArticles,
        archivedArticles: articles.filter(a => a.archived),
        deletedArticles: JSON.parse(localStorage.getItem('deletedArticles') || '[]')
      };
      const gistData = {
        description: 'AI Architecture Articles Backup',
        public: false,
        files: { 'ai-architecture-articles.json': { content: JSON.stringify(data, null, 2) } }
      };
      let response;
      if (gistId) {
        response = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `token ${gistToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(gistData)
        });
      } else {
        response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: { 'Authorization': `token ${gistToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(gistData)
        });
      }
      if (!response.ok) throw new Error('Failed to sync');
      const result = await response.json();
      if (!gistId) {
        setGistId(result.id);
        localStorage.setItem('githubGistId', result.id);
      }
      setGistStatus('connected');
      setGistError('');
    } catch (err) {
      setGistStatus('error');
      setGistError(err.message);
    }
  };

  useEffect(() => {
    if (gistToken && articles.length > 0 && !loading) {
      const timer = setTimeout(() => { syncToGist(); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [articles, savedArticles, gistToken]);

  const loadFromGist = async () => {
    if (!gistToken || !gistId) return;
    try {
      setGistStatus('syncing');
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { 'Authorization': `token ${gistToken}` }
      });
      if (!response.ok) throw new Error('Failed to load');
      const gist = await response.json();
      const fileContent = gist.files['ai-architecture-articles.json']?.content;
      if (!fileContent) throw new Error('No data found');
      const data = JSON.parse(fileContent);
      if (data.savedArticles) {
        setSavedArticles(data.savedArticles);
        localStorage.setItem('savedArticles', JSON.stringify(data.savedArticles));
      }
      if (data.archivedArticles) localStorage.setItem('archivedArticles', JSON.stringify(data.archivedArticles));
      if (data.deletedArticles) localStorage.setItem('deletedArticles', JSON.stringify(data.deletedArticles));
      const manualArticles = (data.articles || []).filter(a => a.manual);
      if (manualArticles.length > 0) localStorage.setItem('manualArticles', JSON.stringify(manualArticles));
      setGistStatus('connected');
      setGistError('');
      alert('✅ Loaded from GitHub!');
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (err) {
      setGistStatus('error');
      setGistError(err.message);
      alert('❌ Error: ' + err.message);
    }
  };

  const saveGistSettings = async () => {
    if (gistToken) {
      localStorage.setItem('githubGistToken', gistToken);
      if (gistId && gistId.trim()) localStorage.setItem('githubGistId', gistId.trim());
      setShowGistSettings(false);
      if (gistId && gistId.trim()) {
        setGistStatus('syncing');
        alert('🔄 Loading...');
        await loadFromGist();
      } else {
        setGistStatus('connected');
        setTimeout(() => { syncToGist(); }, 500);
        alert('✅ Connected!');
      }
    }
  };

  const disconnectGist = () => {
    if (confirm('Disconnect GitHub Gist?')) {
      localStorage.removeItem('githubGistToken');
      localStorage.removeItem('githubGistId');
      setGistToken('');
      setGistId('');
      setGistStatus('disconnected');
      setShowGistSettings(false);
    }
  };

  const categorizeArticle = (title, description, defaultCategory) => {
    const text = (title + ' ' + description).toLowerCase();
    if (text.match(/design process|workflow|collaboration|practice/)) return 'Design Process';
    if (text.match(/tool|software|app|platform|midjourney|dall-e|chatgpt/)) return 'AI Tools';
    if (text.match(/machine learning|deep learning|neural network/)) return 'Machine Learning';
    if (text.match(/generative|parametric|computational|algorithm/)) return 'Generative Design';
    if (text.match(/bim|revit|archicad|building information/)) return 'BIM & Digital Tools';
    if (text.match(/render|rendering|visualization|3d.*visual|photorealistic|vray|lumion|unreal|lookx|ai.*render/)) return 'Rendering & Visualization';
    if (text.match(/virtual reality|augmented reality|vr|ar|xr/)) return 'VR/AR/XR';
    if (text.match(/construction|fabrication|3d print|robotic/)) return 'Construction Tech';
    if (text.match(/sustainable|sustainability|energy|climate/)) return 'Sustainability';
    if (text.match(/education|teaching|learning|course/)) return 'Education';
    if (text.match(/award|prize|winner|competition/)) return 'Awards & Recognition';
    if (text.match(/trend|future|prediction|forecast/)) return 'Trends & Analysis';
    if (text.match(/project|case study|firm/)) return 'Case Studies';
    return defaultCategory;
  };

  const extractKeywords = (text) => {
    const foundKeywords = [];
    const lowerText = text.toLowerCase();
    const keywordGroups = {
      'midjourney': ['midjourney'], 
      'stable diffusion': ['stable diffusion'], 
      'enscape': ['enscape'],
      'lumion': ['lumion'], 
      'ai rendering': ['ai.*render', 'render.*ai', 'lookx', 'veras'],
      'chatgpt': ['chatgpt', 'gpt'], 
      'generative design': ['generative', 'parametric'],
      'visualization': ['visualization', 'photorealistic'],
      'bim': ['bim', 'revit'], 
      'machine learning': ['machine learning', 'ml', 'neural'],
      'computational': ['algorithm', 'computational'],
      'vr/ar': ['virtual reality', 'augmented reality', 'vr', 'ar'],
      'sustainability': ['sustainable', 'energy', 'climate']
    };
    for (const [label, keywords] of Object.entries(keywordGroups)) {
      if (keywords.some(kw => new RegExp(kw, 'i').test(lowerText))) foundKeywords.push(label);
    }
    return foundKeywords.slice(0, 4);
  };

  const exportData = (type = 'all') => {
    const exportData = {
      exportDate: new Date().toISOString(), 
      version: '1.0', 
      articles: articles, 
      savedArticles: savedArticles,
      archivedArticles: articles.filter(a => a.archived)
    };
    let dataToExport, filename;
    switch(type) {
      case 'archived':
        dataToExport = { ...exportData, articles: exportData.archivedArticles };
        filename = `archived-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'saved':
        dataToExport = { ...exportData, articles: articles.filter(a => savedArticles.includes(a.id)) };
        filename = `saved-${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        dataToExport = exportData;
        filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
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
    alert(`✅ Exported!`);
    setShowExportMenu(false);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.articles) throw new Error('Invalid file');
        const confirmed = confirm(`Import ${importedData.articles.length} articles?`);
        if (!confirmed) return;
        const existingIds = new Set(articles.map(a => a.id));
        const newArticles = importedData.articles.filter(a => !existingIds.has(a.id));
        setArticles(prev => [...prev, ...newArticles]);
        if (importedData.savedArticles) {
          const newSaved = [...new Set([...savedArticles, ...importedData.savedArticles])];
          setSavedArticles(newSaved);
          localStorage.setItem('savedArticles', JSON.stringify(newSaved));
        }
        alert(`✅ Imported ${newArticles.length} articles!`);
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addArticleByURL = () => {
    const url = prompt('Enter article URL:');
    if (!url || !url.trim()) return;
    const title = prompt('Enter title:');
    if (!title || !title.trim()) return;
    const summary = prompt('Enter summary (optional):') || 'No description';
    const newArticle = {
      id: url, 
      title: title, 
      source: 'Manual Addition', 
      sourceLogo: '📌',
      category: categorizeArticle(title, summary, 'Manual'), 
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
    alert('✅ Article added!');
  };

  const archiveArticle = (articleId) => {
    setArticles(prev => prev.map(article => article.id === articleId ? { ...article, archived: true } : article));
    const archivedArticles = JSON.parse(localStorage.getItem('archivedArticles') || '[]');
    const articleToArchive = articles.find(a => a.id === articleId);
    if (articleToArchive && !archivedArticles.find(a => a.id === articleId)) {
      archivedArticles.push({ ...articleToArchive, archived: true });
      localStorage.setItem('archivedArticles', JSON.stringify(archivedArticles));
    }
  };

  const restoreArticle = (articleId) => {
    setArticles(prev => prev.map(article => article.id === articleId ? { ...article, archived: false } : article));
    const archivedArticles = JSON.parse(localStorage.getItem('archivedArticles') || '[]');
    const updatedArchived = archivedArticles.filter(a => a.id !== articleId);
    localStorage.setItem('archivedArticles', JSON.stringify(updatedArchived));
  };

  const deleteArticle = (articleId) => {
    if (!confirm('Delete this article permanently?')) return;
    setArticles(prev => prev.filter(article => article.id !== articleId));
    if (savedArticles.includes(articleId)) {
      const newSaved = savedArticles.filter(id => id !== articleId);
      setSavedArticles(newSaved);
      localStorage.setItem('savedArticles', JSON.stringify(newSaved));
    }
    const deletedArticles = JSON.parse(localStorage.getItem('deletedArticles') || '[]');
    if (!deletedArticles.includes(articleId)) {
      deletedArticles.push(articleId);
      localStorage.setItem('deletedArticles', JSON.stringify(deletedArticles));
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const savedFeeds = localStorage.getItem('customFeeds');
        let feedsToFetch = DEFAULT_RSS_FEEDS;
        if (savedFeeds) {
          try {
            const parsedFeeds = JSON.parse(savedFeeds);
            feedsToFetch = parsedFeeds.filter(f => f.enabled);
            setCustomFeeds(parsedFeeds);
          } catch (e) {
            console.error('Error loading custom feeds:', e);
          }
        }
        
        const cachedArticles = JSON.parse(localStorage.getItem('cachedArticles') || '[]');
        const deletedArticles = JSON.parse(localStorage.getItem('deletedArticles') || '[]');
        if (cachedArticles.length > 0) {
          const validCached = cachedArticles.filter(a => !deletedArticles.includes(a.id));
          setArticles(validCached);
          setLoading(false);
        }
        const archivedArticles = JSON.parse(localStorage.getItem('archivedArticles') || '[]');
        const manualArticles = JSON.parse(localStorage.getItem('manualArticles') || '[]');
        const allArticles = [];
        const newFeedStatus = {};
        
        for (const feed of feedsToFetch) {
          try {
            const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed.url) + '&api_key=q1ihf2w1uk1uwljssn3dngzhms9ajhqjpzfpqgf4&count=50');
            if (!response.ok) {
              newFeedStatus[feed.source] = { status: 'failed', count: 0 };
              continue;
            }
            const data = await response.json();
            if (data.status === 'ok' && data.items) {
              const processedArticles = data.items.filter(item => {
                const title = item.title || '';
                const description = item.description || '';
                const text = (title + ' ' + description).toLowerCase();
                const hasAI = /\b(ai|artificial intelligence|machine learning|generative|parametric|computational|midjourney|chatgpt|render.*ai|ai.*render|algorithm|neural)\b/i.test(text);
                const hasArch = /\b(architect|design|building|construction|render|rendering|visualization|bim|3d.*model|structure|spatial)\b/i.test(text);
                const hasRendering = /\b(midjourney|dall-e|lookx|veras|enscape|lumion|twinmotion|render|rendering|visualization|photorealistic)\b/i.test(text);
                if (hasRendering) return true;
                if (feed.requireBoth) return hasAI && hasArch;
                return hasAI || hasArch;
              }).map((item) => {
                const title = item.title || 'Untitled';
                const description = item.description || '';
                const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 200);
                const stableId = item.link || item.guid || (feed.source + '-' + title.replace(/\W/g, '').substring(0, 30));
                if (deletedArticles.includes(stableId)) return null;
                return {
                  id: stableId, 
                  title: title, 
                  source: feed.source, 
                  sourceLogo: feed.logo,
                  category: categorizeArticle(title, description, feed.category),
                  date: new Date(item.pubDate || Date.now()), 
                  readTime: 5,
                  summary: cleanDescription + '...', 
                  url: item.link || '#', 
                  trending: Math.random() > 0.75,
                  keywords: extractKeywords(title + ' ' + description),
                  priority: feed.priority, 
                  archived: false, 
                  manual: false
                };
              }).filter(item => item !== null);
              allArticles.push(...processedArticles);
              newFeedStatus[feed.source] = { status: 'success', count: processedArticles.length, totalFetched: data.items.length };
            }
          } catch (feedError) {
            console.error('Feed error:', feedError);
            newFeedStatus[feed.source] = { status: 'error', count: 0 };
          }
        }
        
        setFeedStatus(newFeedStatus);
        allArticles.push(...manualArticles.filter(a => !deletedArticles.includes(a.id)));
        const combinedArticles = [...allArticles];
        const newArticleIds = new Set(allArticles.map(a => a.id));
        archivedArticles.forEach(archived => {
          if (!newArticleIds.has(archived.id) && !deletedArticles.includes(archived.id)) {
            combinedArticles.push({ ...archived, archived: true });
          }
        });
        combinedArticles.sort((a, b) => {
          if (a.archived !== b.archived) return a.archived ? 1 : -1;
          if (a.priority !== b.priority) return a.priority - b.priority;
          return b.date - a.date;
        });
        setArticles(combinedArticles);
        localStorage.setItem('cachedArticles', JSON.stringify(combinedArticles));
        if (combinedArticles.length === 0) setError('No articles found. Try refreshing.');
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load articles');
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
  const getActiveCategoriesForTab = () => {
    let relevantArticles = [];
    if (activeTab === 'saved') {
      relevantArticles = articles.filter(a => savedArticles.includes(a.id));
    } else if (activeTab === 'archive') {
      relevantArticles = articles.filter(a => a.archived);
    } else {
      relevantArticles = articles.filter(a => !a.archived);
    }
    const cats = new Set(relevantArticles.map(a => a.category).filter(Boolean));
    return ['all', ...Array.from(cats)].sort();
  };
  const activeCategories = getActiveCategoriesForTab();
  const allSources = [...new Set(articles.map(a => a.source))].filter(Boolean);
  const sources = ['all', ...allSources.sort()];

  const getCategoryData = () => {
    const categoryCount = {};
    articles.filter(a => !a.archived).forEach(article => {
      if (article.category) categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  };

  const chartData = getCategoryData();
  const archivedArticles = articles.filter(a => a.archived);
  const archiveCategoryCount = {};
  archivedArticles.forEach(article => {
    if (article.category) archiveCategoryCount[article.category] = (archiveCategoryCount[article.category] || 0) + 1;
  });
  const archiveChartData = Object.entries(archiveCategoryCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) return interval + ' ' + unit + (interval === 1 ? '' : 's') + ' ago';
    }
    return 'just now';
  };

  const toggleSave = (articleId) => {
    const newSavedArticles = savedArticles.includes(articleId) ? savedArticles.filter(id => id !== articleId) : [...savedArticles, articleId];
    setSavedArticles(newSavedArticles);
    localStorage.setItem('savedArticles', JSON.stringify(newSavedArticles));
  };

  const displayArticles = activeTab === 'saved' ? articles.filter(article => savedArticles.includes(article.id)) : activeTab === 'archive' ? articles.filter(article => article.archived) : articles.filter(article => !article.archived);

  const filteredArticles = displayArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSource = selectedSource === 'all' || article.source === selectedSource;
    return matchesSearch && matchesCategory && matchesSource;
  }).sort((a, b) => {
    if (activeTab === 'archive') return b.date - a.date;
    return sortBy === 'date' ? b.date - a.date : b.trending - a.trending;
  });

  const trendingCount = articles.filter(a => a.trending && !a.archived).length;

  if (loading) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-black' : 'bg-white')}>
        <div className="text-center">
          <div className="relative">
            <RefreshCw className={'w-16 h-16 animate-spin mx-auto mb-6 ' + (darkMode ? 'text-blue-500' : 'text-blue-600')} />
            <div className={'absolute inset-0 w-16 h-16 mx-auto rounded-full animate-ping opacity-20 ' + (darkMode ? 'bg-blue-500' : 'bg-blue-600')}></div>
          </div>
          <p className={'text-xl font-light animate-pulse ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>Discovering AI in Architecture</p>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-black' : 'bg-white')}>
        <div className="text-center">
          <AlertCircle className={'w-16 h-16 mx-auto mb-6 ' + (darkMode ? 'text-red-400' : 'text-red-600')} />
          <p className={'text-xl mb-6 ' + (darkMode ? 'text-gray-300' : 'text-gray-700')}>{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all hover:scale-105">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen transition-all duration-500 ' + (darkMode ? 'bg-black' : 'bg-white')}>
      <input type="file" ref={fileInputRef} onChange={importData} accept=".json" style={{ display: 'none' }} />

      {/* Feed Manager Modal */}
      {showFeedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowFeedManager(false)}>
          <div className={'max-w-4xl w-full rounded-3xl p-8 shadow-2xl animate-slideUp ' + (darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' : 'bg-white')} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={'text-2xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'}>
                <Filter className="w-7 h-7 text-blue-500" />
                RSS Feeds
              </h2>
              <button onClick={() => setShowFeedManager(false)} className="p-2 rounded-full hover:bg-gray-800 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6 flex gap-3">
              <button onClick={addFeed} className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 shadow-lg">+ Add Feed</button>
              <button onClick={resetFeeds} className={'px-6 py-3 rounded-full transition-all hover:scale-105 ' + (darkMode ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : 'bg-orange-50 text-orange-700')}>Reset</button>
            </div>

            <div className="space-y-3">
              {(customFeeds.length > 0 ? customFeeds : DEFAULT_RSS_FEEDS).map((feed, index) => (
                <div key={index} className={'p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] ' + (darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-gray-50')}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{feed.logo}</span>
                    <div>
                      <h3 className={'font-semibold ' + (darkMode ? 'text-white' : 'text-gray-900')}>{feed.source}</h3>
                      <p className={'text-xs ' + (darkMode ? 'text-gray-500' : 'text-gray-600')}>{feed.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleFeed(index)} className={'px-4 py-2 rounded-full text-xs transition-all hover:scale-105 ' + (feed.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400')}>
                      {feed.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button onClick={() => deleteFeed(index)} className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gist Modal */}
      {showGistSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={'max-w-2xl w-full rounded-3xl p-8 shadow-2xl animate-slideUp ' + (darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' : 'bg-white')}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={'text-2xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'}>
                <Cloud className="w-7 h-7 text-blue-500" />
                GitHub Sync
              </h2>
              <button onClick={() => setShowGistSettings(false)} className="p-2 rounded-full hover:bg-gray-800 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-5">
              <label className={'block text-sm mb-2 ' + (darkMode ? 'text-gray-400' : 'text-gray-700')}>GitHub Token</label>
              <input type="password" value={gistToken} onChange={(e) => setGistToken(e.target.value)} placeholder="ghp_..." className={'w-full px-4 py-3 rounded-2xl transition-all focus:ring-2 focus:ring-blue-500 ' + (darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-100')} />
            </div>

            <div className="mb-6">
              <label className={'block text-sm mb-2 ' + (darkMode ? 'text-gray-400' : 'text-gray-700')}>Gist ID (optional)</label>
              <input type="text" value={gistId} onChange={(e) => setGistId(e.target.value)} placeholder="Leave blank for new" className={'w-full px-4 py-3 rounded-2xl transition-all focus:ring-2 focus:ring-blue-500 ' + (darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-100')} />
            </div>

            <div className="flex gap-3">
              <button onClick={saveGistSettings} disabled={!gistToken} className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all hover:scale-105 shadow-lg">
                Save
              </button>
              {gistStatus === 'connected' && (
                <button onClick={disconnectGist} className="px-6 py-3 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">Disconnect</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={'sticky top-0 z-40 backdrop-blur-2xl border-b transition-all ' + (darkMode ? 'bg-black/80 border-gray-900' : 'bg-white/80 border-gray-100')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-4">
            <button onClick={() => setDarkMode(!darkMode)} className={'p-2.5 rounded-full transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200')}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2">
              <button onClick={sendFeedback} className={'p-2.5 rounded-full transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800 text-purple-400' : 'bg-gray-100 hover:bg-gray-200 text-purple-600')} title="Email Feedback">
                <Mail className="w-5 h-5" />
              </button>
              
              <button onClick={() => setShowGistSettings(true)} className={'p-2.5 rounded-full relative transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200') + ' ' + (gistStatus === 'connected' ? 'text-green-400' : 'text-gray-400')}>
                {gistStatus === 'connected' ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                {gistStatus === 'syncing' && <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>}
              </button>
              
              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className={'p-2.5 rounded-full transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800 text-purple-400' : 'bg-gray-100 hover:bg-gray-200 text-purple-600')}>
                  <Database className="w-5 h-5" />
                </button>
                {showExportMenu && (
                  <div className={'absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl p-2 z-50 animate-slideUp ' + (darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white')}>
                    <div className={'text-xs font-semibold mb-2 px-3 pt-2 ' + (darkMode ? 'text-gray-500' : 'text-gray-500')}>EXPORT</div>
                    <button onClick={() => exportData('all')} className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] ' + (darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100')}>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Complete Backup</span>
                    </button>
                    <button onClick={() => exportData('archived')} className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] ' + (darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100')}>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Archived Only</span>
                    </button>
                    <button onClick={() => exportData('saved')} className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] ' + (darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100')}>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Saved Only</span>
                    </button>
                    <div className={'text-xs font-semibold my-2 px-3 pt-2 border-t ' + (darkMode ? 'text-gray-500 border-gray-800' : 'text-gray-500 border-gray-200')}>IMPORT</div>
                    <button onClick={() => fileInputRef.current?.click()} className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] ' + (darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100')}>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Import from File</span>
                    </button>
                    {gistId && (
                      <button onClick={() => { loadFromGist(); setShowExportMenu(false); }} className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] ' + (darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100')}>
                        <Cloud className="w-4 h-4" />
                        <span className="text-sm">Load from GitHub</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <button onClick={() => window.location.reload()} className={'p-2.5 rounded-full transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800 text-green-400' : 'bg-gray-100 hover:bg-gray-200 text-green-600')}>
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button onClick={() => setShowChart(!showChart)} className={'p-2.5 rounded-full transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800 text-blue-400' : 'bg-gray-100 hover:bg-gray-200 text-blue-600')}>
                <BarChart3 className="w-5 h-5" />
              </button>
              
              <button onClick={() => setShowFeedStatus(!showFeedStatus)} className={'p-2.5 rounded-full transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800 text-cyan-400' : 'bg-gray-100 hover:bg-gray-200 text-cyan-600')}>
                <Settings className="w-5 h-5" />
              </button>
              
              <button onClick={handleOpenFeedManager} className={'p-2.5 rounded-full transition-all hover:scale-110 ' + (darkMode ? 'bg-gray-900 hover:bg-gray-800 text-purple-400' : 'bg-gray-100 hover:bg-gray-200 text-purple-600')}>
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hero Section with Gradient */}
          <div className="text-center py-12">
            <div className="relative inline-block">
              <h1 className={'text-5xl md:text-7xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient'}>
                AI in Architecture
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl -z-10"></div>
            </div>
            <p className={'text-lg md:text-xl font-light mb-2 ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
              Discover the latest innovations shaping design
            </p>
            <div className={'flex items-center justify-center gap-4 text-sm flex-wrap ' + (darkMode ? 'text-gray-500' : 'text-gray-500')}>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-blue-500" />
                {articles.filter(a => !a.archived).length} articles
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                {trendingCount} trending
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-pink-500" />
                {savedArticles.length} saved
              </span>
              {viewCount && (
                <>
                  <span>•</span>
                  <span>👁️ {viewCount.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>

          {/* Tabs with Gradient Active State */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('all')} className={'px-6 py-2.5 rounded-full font-medium transition-all hover:scale-105 ' + (activeTab === 'all' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : (darkMode ? 'bg-gray-900 text-gray-400 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'))}>
              Recent ({articles.filter(a => !a.archived).length})
            </button>
            <button onClick={() => setActiveTab('saved')} className={'px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap ' + (activeTab === 'saved' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : (darkMode ? 'bg-gray-900 text-gray-400 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'))}>
              <Heart className="w-4 h-4" fill={activeTab === 'saved' ? 'currentColor' : 'none'} />
              Saved ({savedArticles.length})
            </button>
            <button onClick={() => setActiveTab('archive')} className={'px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap ' + (activeTab === 'archive' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg' : (darkMode ? 'bg-gray-900 text-gray-400 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'))}>
              <Archive className="w-4 h-4" />
              Archive ({archivedArticles.length})
            </button>
          </div>

          {/* Search with Gradient Border */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-sm"></div>
            <div className="relative">
              <Search className={'absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ' + (darkMode ? 'text-gray-600' : 'text-gray-400')} />
              <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={'w-full pl-14 pr-40 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ' + (darkMode ? 'bg-gray-900 text-white border border-gray-800' : 'bg-gray-50 border border-gray-200')} />
              <button onClick={addArticleByURL} className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all hover:scale-105 shadow-lg">
                + Add
              </button>
            </div>
          </div>

          {/* Category Pills with Hover Effects */}
          <div className="flex items-center gap-2 overflow-x-auto pb-6">
            <button onClick={() => setShowFilters(!showFilters)} className={'flex items-center gap-2 px-5 py-2.5 rounded-full transition-all hover:scale-105 ' + (darkMode ? 'bg-gray-900 text-gray-400 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200')}>
              <Filter className="w-4 h-4" />Filters
            </button>
            {activeCategories.slice(0, 8).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={'px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:scale-105 ' + (selectedCategory === cat ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : (darkMode ? 'bg-gray-900 text-gray-400 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'))}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className={'mb-6 p-6 rounded-3xl backdrop-blur-sm ' + (darkMode ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200')}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={'w-full px-4 py-3 rounded-2xl transition-all focus:ring-2 focus:ring-purple-500 ' + (darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border border-gray-200')}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All' : cat}</option>)}
                </select>
                <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className={'w-full px-4 py-3 rounded-2xl transition-all focus:ring-2 focus:ring-purple-500 ' + (darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border border-gray-200')}>
                  {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={'w-full px-4 py-3 rounded-2xl transition-all focus:ring-2 focus:ring-purple-500 ' + (darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white border border-gray-200')}>
                  <option value="date">Latest</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showFeedStatus && (
          <div className={'mb-8 p-6 rounded-3xl border backdrop-blur-sm ' + (darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={'text-xl font-bold flex items-center gap-3 ' + (darkMode ? 'text-white' : 'text-gray-900')}>
                <Settings className="w-6 h-6 text-cyan-500" />
                Feed Status
              </h2>
              <button onClick={() => setShowFeedStatus(false)} className={'text-sm ' + (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-600 hover:text-gray-700')}>Hide</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RSS_FEEDS.map((feed) => {
                const info = feedStatus[feed.source] || { status: 'pending', count: 0 };
                return (
                  <div key={feed.source} className={'p-4 rounded-2xl transition-all hover:scale-[1.02] ' + (darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={'font-semibold text-sm ' + (darkMode ? 'text-white' : 'text-gray-900')}>{feed.source}</span>
                      {info.status === 'success' ? (
                        <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">✓</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400">✗</span>
                      )}
                    </div>
                    <p className={'text-xs ' + (darkMode ? 'text-gray-400' : 'text-gray-600')}>
                      {info.status === 'success' ? `Fetched: ${info.totalFetched} → Filtered: ${info.count}` : 'Failed'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'saved' && savedArticles.length === 0 && (
          <div className={'text-center py-24 ' + (darkMode ? 'text-gray-500' : 'text-gray-400')}>
            <Heart className="w-20 h-20 mx-auto mb-6 opacity-30" />
            <p className="text-2xl font-light">No saved articles</p>
          </div>
        )}

        {activeTab === 'archive' && archivedArticles.length === 0 && (
          <div className={'text-center py-24 ' + (darkMode ? 'text-gray-500' : 'text-gray-400')}>
            <Archive className="w-20 h-20 mx-auto mb-6 opacity-30" />
            <p className="text-2xl font-light">No archived articles</p>
          </div>
        )}

        {activeTab === 'all' && showChart && chartData.length > 0 && (
          <div className={'mb-8 p-6 rounded-3xl border backdrop-blur-sm ' + (darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={'text-xl font-bold ' + (darkMode ? 'text-white' : 'text-gray-900')}>Categories</h2>
              <button onClick={() => setShowChart(false)} className={'text-sm ' + (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-600 hover:text-gray-700')}>Hide</button>
            </div>
            <ResponsiveContainer width="100%" height={chartData.length * 30 + 50}>
              <BarChart data={chartData} layout="vertical" barCategoryGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#f3f4f6'} />
                <XAxis type="number" tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#111827' : '#ffffff', borderRadius: '12px', fontSize: '13px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={8}>
                  {chartData.map((entry, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'archive' && showArchiveChart && archiveChartData.length > 0 && (
          <div className={'mb-8 p-6 rounded-3xl border backdrop-blur-sm ' + (darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={'text-xl font-bold flex items-center gap-3 ' + (darkMode ? 'text-white' : 'text-gray-900')}>
                <Archive className="w-6 h-6 text-orange-500" />
                Archived
              </h2>
              <button onClick={() => setShowArchiveChart(false)} className={'text-sm ' + (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-600 hover:text-gray-700')}>Hide</button>
            </div>
            <ResponsiveContainer width="100%" height={archiveChartData.length * 30 + 50}>
              <BarChart data={archiveChartData} layout="vertical" barCategoryGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#f3f4f6'} />
                <XAxis type="number" tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#111827' : '#ffffff', borderRadius: '12px', fontSize: '13px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={8}>
                  {archiveChartData.map((entry, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Articles - 3 columns with hover effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map(article => (
            <article key={article.id} className={'group rounded-3xl p-5 border transition-all hover:shadow-2xl hover:-translate-y-2 ' + (darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{article.sourceLogo}</span>
                  <span className={'text-xs ' + (darkMode ? 'text-gray-500' : 'text-gray-600')}>{article.source}</span>
                </div>
                <button onClick={() => toggleSave(article.id)} className={'relative transition-all hover:scale-110 ' + (savedArticles.includes(article.id) ? 'text-yellow-500' : (darkMode ? 'text-gray-600' : 'text-gray-400'))}>
                  <Bookmark className="w-4 h-4" fill={savedArticles.includes(article.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              
              {(article.archived || article.manual) && (
                <div className="flex gap-2 mb-3">
                  {article.archived && (
                    <div className={'px-2 py-1 rounded-full text-xs ' + (darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100')}>
                      <Archive className="w-3 h-3 inline mr-1" />
                      Archived
                    </div>
                  )}
                  {article.manual && (
                    <div className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                      ✓ Manual
                    </div>
                  )}
                </div>
              )}
              
              <h2 className={'text-base font-bold mb-3 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent transition-all ' + (darkMode ? 'text-white' : 'text-gray-900')}>{article.title}</h2>
              <p className={'text-xs mb-3 line-clamp-2 ' + (darkMode ? 'text-gray-500' : 'text-gray-600')}>{article.summary}</p>
              
              {article.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {article.keywords.slice(0, 3).map((kw, i) => <span key={i} className={'px-2 py-1 rounded-full text-xs transition-all hover:scale-105 ' + (darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')}>{kw}</span>)}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={'px-2.5 py-1 rounded-full text-xs transition-all ' + (darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700')}>{article.category}</span>
                {article.trending && <span className={'px-2.5 py-1 rounded-full text-xs flex items-center gap-1 animate-pulse ' + (darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-700')}><TrendingUp className="w-3 h-3" />Hot</span>}
              </div>
              
              <div className={'flex items-center justify-between gap-2 mb-4 pb-4 border-b ' + (darkMode ? 'border-gray-800' : 'border-gray-200')}>
                {!article.archived ? (
                  <button onClick={() => archiveArticle(article.id)} className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 ' + (darkMode ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100')}>
                    <Archive className="w-3 h-3" />
                    Archive
                  </button>
                ) : (
                  <button onClick={() => restoreArticle(article.id)} className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 ' + (darkMode ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-700 hover:bg-green-100')}>
                    <ArchiveRestore className="w-3 h-3" />
                    Restore
                  </button>
                )}
                <button onClick={() => deleteArticle(article.id)} className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 ' + (darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-700 hover:bg-red-100')}>
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className={'flex items-center gap-1 ' + (darkMode ? 'text-gray-600' : 'text-gray-500')}><Clock className="w-3 h-3" />{article.readTime}m</span>
                  <span className={'flex items-center gap-1 ' + (darkMode ? 'text-gray-600' : 'text-gray-500')}>
                    <Calendar className="w-3 h-3" />
                    {activeTab === 'archive' ? new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : getRelativeTime(article.date)}
                  </span>
                </div>
                <a href={article.url} target="_blank" rel="noopener noreferrer" className={'flex items-center gap-1 text-xs transition-all hover:scale-105 ' + (darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700')}>
                  Read<ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className={'text-center py-24 ' + (darkMode ? 'text-gray-500' : 'text-gray-400')}>
            <Building2 className="w-20 h-20 mx-auto mb-6 opacity-30" />
            <p className="text-2xl font-light">No articles found</p>
          </div>
        )}
      </main>

      {/* Add CSS for animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
