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
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
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
        if (data.value) setViewCount(data.value);
      } catch (err) {
        console.error('View counter error:', err);
      }
    };
    fetchViewCount();
  }, []);

  const handleOpenFeedManager = () => setShowFeedManager(true);

  const addFeed = () => {
    const url = prompt('Enter RSS feed URL:');
    if (!url || !url.trim()) return;
    const source = prompt('Enter source name (e.g., "TechCrunch"):');
    if (!source || !source.trim()) return;
    const category = prompt('Enter category (e.g., "Tech News"):');
    const logo = prompt('Enter emoji logo (e.g., 📰):') || '📰';
    const newFeed = { url: url.trim(), source: source.trim(), category: category?.trim() || 'General', logo: logo, priority: 1, requireBoth: false, enabled: true };
    const updatedFeeds = [...(customFeeds.length > 0 ? customFeeds : DEFAULT_RSS_FEEDS), newFeed];
    setCustomFeeds(updatedFeeds);
    localStorage.setItem('customFeeds', JSON.stringify(updatedFeeds));
    if (confirm('✅ Feed added! Refresh now to load articles from this feed?')) window.location.reload();
  };

  const toggleFeed = (index) => {
    const feedsToUpdate = customFeeds.length > 0 ? [...customFeeds] : [...DEFAULT_RSS_FEEDS];
    feedsToUpdate[index].enabled = !feedsToUpdate[index].enabled;
    setCustomFeeds(feedsToUpdate);
    localStorage.setItem('customFeeds', JSON.stringify(feedsToUpdate));
    if (confirm(`Feed ${feedsToUpdate[index].enabled ? 'enabled' : 'disabled'}! Refresh now to see changes?`)) window.location.reload();
  };

  const deleteFeed = (index) => {
    const feedsToUpdate = customFeeds.length > 0 ? [...customFeeds] : [...DEFAULT_RSS_FEEDS];
    if (confirm(`Delete feed "${feedsToUpdate[index].source}"?`)) {
      feedsToUpdate.splice(index, 1);
      setCustomFeeds(feedsToUpdate);
      localStorage.setItem('customFeeds', JSON.stringify(feedsToUpdate));
      if (confirm('Feed deleted! Refresh now to see changes?')) window.location.reload();
    }
  };

  const resetFeeds = () => {
    if (confirm('Reset to default feeds? This will remove all custom feeds.')) {
      setCustomFeeds([]);
      localStorage.removeItem('customFeeds');
      if (confirm('✅ Reset to defaults! Refresh now to reload articles?')) window.location.reload();
    }
  };

  const syncToGist = async () => {
    if (!gistToken) return;
    try {
      setGistStatus('syncing');
      const data = { exportDate: new Date().toISOString(), version: '1.0', articles: articles, savedArticles: savedArticles, archivedArticles: articles.filter(a => a.archived), deletedArticles: JSON.parse(localStorage.getItem('deletedArticles') || '[]') };
      const gistData = { description: 'AI Architecture Articles Backup', public: false, files: { 'ai-architecture-articles.json': { content: JSON.stringify(data, null, 2) } } };
      let response;
      if (gistId) {
        response = await fetch(`https://api.github.com/gists/${gistId}`, { method: 'PATCH', headers: { 'Authorization': `token ${gistToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(gistData) });
      } else {
        response = await fetch('https://api.github.com/gists', { method: 'POST', headers: { 'Authorization': `token ${gistToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(gistData) });
      }
      if (!response.ok) throw new Error('Failed to sync to GitHub');
      const result = await response.json();
      if (!gistId) { setGistId(result.id); localStorage.setItem('githubGistId', result.id); }
      setGistStatus('connected');
      setGistError('');
    } catch (err) {
      console.error('Gist sync error:', err);
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
      const response = await fetch(`https://api.github.com/gists/${gistId}`, { headers: { 'Authorization': `token ${gistToken}` } });
      if (!response.ok) throw new Error('Failed to load from GitHub');
      const gist = await response.json();
      const fileContent = gist.files['ai-architecture-articles.json']?.content;
      if (!fileContent) throw new Error('No data found in Gist');
      const data = JSON.parse(fileContent);
      if (data.savedArticles) { setSavedArticles(data.savedArticles); localStorage.setItem('savedArticles', JSON.stringify(data.savedArticles)); }
      if (data.archivedArticles) localStorage.setItem('archivedArticles', JSON.stringify(data.archivedArticles));
      if (data.deletedArticles) localStorage.setItem('deletedArticles', JSON.stringify(data.deletedArticles));
      const manualArticles = (data.articles || []).filter(a => a.manual);
      if (manualArticles.length > 0) localStorage.setItem('manualArticles', JSON.stringify(manualArticles));
      setGistStatus('connected');
      setGistError('');
      const archivedCount = (data.archivedArticles || []).length;
      alert(`✅ Successfully loaded from GitHub Gist!\n\n📦 Restored: ${archivedCount} archived articles\n🔄 Now fetching fresh articles...`);
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (err) {
      console.error('Gist load error:', err);
      setGistStatus('error');
      setGistError(err.message);
      alert('❌ Error loading from Gist: ' + err.message);
    }
  };

  const saveGistSettings = async () => {
    if (gistToken) {
      localStorage.setItem('githubGistToken', gistToken);
      if (gistId && gistId.trim()) localStorage.setItem('githubGistId', gistId.trim());
      setShowGistSettings(false);
      if (gistId && gistId.trim()) {
        setGistStatus('syncing');
        alert('🔄 Loading your archived articles from GitHub...');
        await loadFromGist();
      } else {
        setGistStatus('connected');
        setTimeout(() => { syncToGist(); }, 500);
        alert('✅ GitHub Gist connected! Your data will be backed up automatically.');
      }
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

  const categorizeArticle = (title, description, defaultCategory) => {
    const text = (title + ' ' + description).toLowerCase();
    if (text.match(/design process|workflow|collaboration|practice|studio|architect.*use|how.*design/)) return 'Design Process';
    if (text.match(/tool|software|app|platform|midjourney|dall-e|stable diffusion|chatgpt|plugin|extension/)) return 'AI Tools';
    if (text.match(/machine learning|deep learning|neural network|model training|dataset|research|study/)) return 'Machine Learning';
    if (text.match(/generative|parametric|computational|algorithm|procedural/)) return 'Generative Design';
    if (text.match(/bim|revit|archicad|building information|digital.*tool|dynamo/)) return 'BIM & Digital Tools';
    if (text.match(/render|rendering|visualization|visuali[sz]e|3d.*visual|photorealistic|vray|lumion|unreal|unity|blender|corona|octane|lookx|ai.*render|render.*ai/)) return 'Rendering & Visualization';
    if (text.match(/virtual reality|augmented reality|vr|ar|xr|metaverse|immersive/)) return 'VR/AR/XR';
    if (text.match(/construction|fabrication|3d print|robotic|prefab|modular/)) return 'Construction Tech';
    if (text.match(/sustainable|sustainability|energy|climate|environmental|performance.*analysis|simulation/)) return 'Sustainability';
    if (text.match(/education|teaching|learning|course|workshop|tutorial|student|university/)) return 'Education';
    if (text.match(/hardware|device|sensor|iot|mobile|tablet|smartphone|wearable/)) return 'Hardware & Devices';
    if (text.match(/award|prize|winner|competition|recognition|honor|fellowship/)) return 'Awards & Recognition';
    if (text.match(/blockchain|nft|crypto|web3|smart contract|decentralized/)) return 'Blockchain';
    if (text.match(/trend|future|prediction|forecast|survey|report|analysis|market/)) return 'Trends & Analysis';
    if (text.match(/project|case study|firm|studio.*use|architect.*explain|example|implementation/)) return 'Case Studies';
    return defaultCategory;
  };

  const extractKeywords = (text) => {
    const foundKeywords = [];
    const lowerText = text.toLowerCase();
    const keywordGroups = {
      'midjourney': ['midjourney'], 'stable diffusion': ['stable diffusion'], 'enscape': ['enscape'], 'lumion': ['lumion'],
      'ai rendering': ['ai.*render', 'render.*ai', 'lookx', 'veras'], 'chatgpt': ['chatgpt', 'gpt'],
      'generative design': ['generative', 'parametric'], 'visualization': ['visualization', 'photorealistic'],
      'bim': ['bim', 'revit'], 'machine learning': ['machine learning', 'neural']
    };
    for (const [label, keywords] of Object.entries(keywordGroups)) {
      if (keywords.some(kw => new RegExp(kw, 'i').test(lowerText))) foundKeywords.push(label);
    }
    return foundKeywords.slice(0, 3);
  };

  const exportData = (type = 'all') => {
    const exportData = { exportDate: new Date().toISOString(), version: '1.0', articles: articles, savedArticles: savedArticles, archivedArticles: articles.filter(a => a.archived) };
    let dataToExport, filename;
    switch(type) {
      case 'archived': dataToExport = { ...exportData, articles: exportData.archivedArticles }; filename = `ai-arch-archived-${new Date().toISOString().split('T')[0]}.json`; break;
      case 'saved': dataToExport = { ...exportData, articles: articles.filter(a => savedArticles.includes(a.id)) }; filename = `ai-arch-saved-${new Date().toISOString().split('T')[0]}.json`; break;
      default: dataToExport = exportData; filename = `ai-arch-backup-${new Date().toISOString().split('T')[0]}.json`;
    }
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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
        if (!importedData.articles || !Array.isArray(importedData.articles)) throw new Error('Invalid file format');
        const confirmed = confirm(`Import ${importedData.articles.length} articles from ${new Date(importedData.exportDate).toLocaleDateString()}?\n\nThis will merge with your existing articles.`);
        if (!confirmed) return;
        const existingIds = new Set(articles.map(a => a.id));
        const newArticles = importedData.articles.filter(a => !existingIds.has(a.id));
        setArticles(prev => [...prev, ...newArticles]);
        if (importedData.savedArticles) {
          const newSaved = [...new Set([...savedArticles, ...importedData.savedArticles])];
          setSavedArticles(newSaved);
          localStorage.setItem('savedArticles', JSON.stringify(newSaved));
        }
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
    const newArticle = { id: url, title: title, source: 'Manual Addition', sourceLogo: '📌', category: categorizeArticle(title, summary, 'Manual Addition'), date: new Date(), readTime: 5, summary: summary, url: url, trending: false, keywords: extractKeywords(title + ' ' + summary), priority: 1, archived: false, manual: true };
    setArticles(prev => [newArticle, ...prev]);
    const manualArticles = JSON.parse(localStorage.getItem('manualArticles') || '[]');
    manualArticles.push(newArticle);
    localStorage.setItem('manualArticles', JSON.stringify(manualArticles));
    alert('Article added successfully!');
  };

  const archiveArticle = (articleId) => {
    setArticles(prev => prev.map(article => article.id === articleId ? { ...article, archived: true } : article));
  };

  const restoreArticle = (articleId) => {
    setArticles(prev => prev.map(article => article.id === articleId ? { ...article, archived: false } : article));
  };

  const deleteArticle = (articleId) => {
    if (!confirm('Are you sure you want to permanently delete this article?')) return;
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
          } catch (e) {}
        }
        const cachedArticles = JSON.parse(localStorage.getItem('cachedArticles') || '[]');
        const deletedArticles = JSON.parse(localStorage.getItem('deletedArticles') || '[]');
        if (cachedArticles.length > 0) {
          setArticles(cachedArticles.filter(a => !deletedArticles.includes(a.id)));
          setLoading(false);
        }
        const allArticles = [];
        const newFeedStatus = {};
        for (const feed of feedsToFetch) {
          try {
            const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed.url) + '&api_key=q1ihf2w1uk1uwljssn3dngzhms9ajhqjpzfpqgf4&count=50');
            if (!response.ok) { newFeedStatus[feed.source] = { status: 'failed', count: 0, error: 'HTTP ' + response.status }; continue; }
            const data = await response.json();
            if (data.status === 'ok' && data.items) {
              const processedArticles = data.items.filter(item => {
                const text = ((item.title || '') + ' ' + (item.description || '')).toLowerCase();
                const hasAI = /\b(ai|artificial intelligence|machine learning|neural|generative|parametric|computational|midjourney|dall-e|stable diffusion|chatgpt|render.*ai|ai.*render|lookx|veras|enscape|lumion|algorithm)\b/i.test(text);
                const hasArch = /\b(architect|design|building|construction|render|rendering|visualization|bim|3d.*model|cad|revit|photorealistic)\b/i.test(text);
                const hasRendering = /\b(midjourney|dall-e|stable diffusion|lookx|veras|enscape|lumion|render|rendering|visualization|photorealistic)\b/i.test(text);
                if (hasRendering) return true;
                if (feed.requireBoth) return hasAI && hasArch;
                return hasAI || hasArch;
              }).map(item => {
                const stableId = item.link || item.guid || (feed.source + '-' + (item.title || '').replace(/\W/g, '').substring(0, 30));
                if (deletedArticles.includes(stableId)) return null;
                return { id: stableId, title: item.title || 'Untitled', source: feed.source, sourceLogo: feed.logo, category: categorizeArticle(item.title || '', item.description || '', feed.category), date: new Date(item.pubDate || Date.now()), readTime: 5, summary: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...', url: item.link || '#', trending: Math.random() > 0.75, keywords: extractKeywords((item.title || '') + ' ' + (item.description || '')), priority: feed.priority, archived: false, manual: false };
              }).filter(item => item !== null);
              allArticles.push(...processedArticles);
              newFeedStatus[feed.source] = { status: 'success', count: processedArticles.length, totalFetched: data.items.length };
            } else {
              newFeedStatus[feed.source] = { status: 'failed', count: 0, error: data.message || 'Invalid response' };
            }
          } catch (feedError) {
            newFeedStatus[feed.source] = { status: 'error', count: 0, error: feedError.message };
          }
        }
        setFeedStatus(newFeedStatus);
        allArticles.sort((a, b) => b.date - a.date);
        setArticles(allArticles);
        localStorage.setItem('cachedArticles', JSON.stringify(allArticles));
      } catch (err) {
        setError('Failed to load articles.');
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('savedArticles');
    if (saved) {
      try { setSavedArticles(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const getCategoryData = () => {
    const categoryCount = {};
    articles.filter(a => !a.archived).forEach(article => {
      if (article.category) categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  };

  const chartData = getCategoryData();
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
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.summary.toLowerCase().includes(searchQuery.toLowerCase()) || article.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSource = selectedSource === 'all' || article.source === selectedSource;
    return matchesSearch && matchesCategory && matchesSource;
  }).sort((a, b) => sortBy === 'date' ? b.date - a.date : b.trending - a.trending);

  const trendingCount = articles.filter(a => a.trending && !a.archived).length;
  const featuredArticle = filteredArticles[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-lg text-gray-300">Discovering AI in Architecture...</p>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg mb-4 text-gray-300">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <input type="file" ref={fileInputRef} onChange={importData} accept=".json" style={{ display: 'none' }} />

      {/* Floating Toolbar */}
      <div className="fixed top-6 right-6 flex gap-3 z-50" style={{ animation: 'fadeInDown 1s ease-out' }}>
        <button onClick={() => setShowGistSettings(true)} className={'w-12 h-12 rounded-xl backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all hover:border-blue-500/50 hover:-translate-y-1 ' + (gistStatus === 'connected' ? 'bg-slate-800/80 text-green-400' : 'bg-slate-800/80 text-gray-400')} title={gistStatus === 'connected' ? 'Cloud sync enabled' : 'Setup cloud sync'}>
          {gistStatus === 'connected' ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
        </button>
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)} className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-purple-400 transition-all hover:border-purple-500/50 hover:-translate-y-1" title="Export/Import">
            <Database className="w-5 h-5" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 backdrop-blur-xl border border-white/10 p-2 shadow-2xl">
              <div className="text-xs font-semibold mb-2 px-2 text-gray-400">EXPORT</div>
              <button onClick={() => exportData('all')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-gray-300 text-sm"><Download className="w-4 h-4" />Complete Backup</button>
              <button onClick={() => exportData('archived')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-gray-300 text-sm"><Download className="w-4 h-4" />Archived Only</button>
              <button onClick={() => exportData('saved')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-gray-300 text-sm"><Download className="w-4 h-4" />Saved Only</button>
              <div className="text-xs font-semibold my-2 px-2 pt-2 border-t border-white/10 text-gray-400">IMPORT</div>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-gray-300 text-sm"><Upload className="w-4 h-4" />Import from File</button>
            </div>
          )}
        </div>
        <button onClick={() => window.location.reload()} className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-green-400 transition-all hover:border-green-500/50 hover:-translate-y-1" title="Refresh">
          <RefreshCw className="w-5 h-5" />
        </button>
        <button onClick={() => setShowChart(!showChart)} className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-blue-400 transition-all hover:border-blue-500/50 hover:-translate-y-1" title="Toggle Chart">
          <BarChart3 className="w-5 h-5" />
        </button>
        <button onClick={() => setShowFeedStatus(!showFeedStatus)} className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-cyan-400 transition-all hover:border-cyan-500/50 hover:-translate-y-1" title="Feed Status">
          <Settings className="w-5 h-5" />
        </button>
        <button onClick={handleOpenFeedManager} className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-purple-400 transition-all hover:border-purple-500/50 hover:-translate-y-1" title="Manage Feeds">
          <Filter className="w-5 h-5" />
        </button>
        <button onClick={() => setDarkMode(!darkMode)} className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-amber-400 transition-all hover:border-amber-500/50 hover:-translate-y-1" title="Toggle Theme">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <a href="mailto:architek.eth@gmail.com?subject=AI%20in%20Architecture%20-%20Feedback&body=Hi%2C%0A%0AI%20have%20a%20suggestion%3A%0A%0A" className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-pink-400 transition-all hover:border-pink-500/50 hover:-translate-y-1" title="Send Feedback" style={{textDecoration: 'none'}}>
          <Mail className="w-5 h-5" />
        </a>
      </div>

      {/* Feed Manager Modal */}
      {showFeedManager && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 overflow-y-auto z-[100]" onClick={() => setShowFeedManager(false)}>
          <div className="max-w-4xl w-full rounded-2xl p-6 my-8 max-h-[90vh] overflow-y-auto bg-slate-800 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><Filter className="w-6 h-6" />RSS Feed Manager</h2>
              <button onClick={() => setShowFeedManager(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4 flex gap-2">
              <button onClick={addFeed} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600">+ Add Custom Feed</button>
              <button onClick={resetFeeds} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">Reset to Defaults</button>
            </div>
            <div className="space-y-2">
              {(customFeeds.length > 0 ? customFeeds : DEFAULT_RSS_FEEDS).map((feed, index) => (
                <div key={index} className="p-4 rounded-lg border border-white/5 bg-slate-750 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{feed.logo}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{feed.source}</h3>
                        {!feed.enabled && <span className="px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-400">Disabled</span>}
                        {feedStatus[feed.source]?.status === 'failed' && feed.enabled && <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Failed</span>}
                      </div>
                      <p className="text-xs text-gray-400">{feed.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFeed(index)} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (feed.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400')}>{feed.enabled ? 'Enabled' : 'Disabled'}</button>
                    <button onClick={() => deleteFeed(index)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gist Settings Modal */}
      {showGistSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full rounded-2xl p-6 bg-slate-800 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Cloud className="w-6 h-6" />GitHub Gist Cloud Sync</h2>
              <button onClick={() => setShowGistSettings(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">GitHub Personal Access Token</label>
              <input type="password" value={gistToken} onChange={(e) => setGistToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxx" className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Gist ID (optional)</label>
              <input type="text" value={gistId} onChange={(e) => setGistId(e.target.value)} placeholder="abc123def456..." className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveGistSettings} disabled={!gistToken} className="flex-1 px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"><Check className="w-4 h-4 inline mr-2" />Save & Enable Auto-Sync</button>
              {gistStatus === 'connected' && <button onClick={disconnectGist} className="px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20">Disconnect</button>}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="min-h-[60vh] flex flex-col justify-center items-center text-center px-4 pt-24 pb-12 relative overflow-hidden" style={{ animation: 'fadeInUp 1s ease-out' }}>
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/15 via-transparent to-transparent" style={{ animation: 'pulse 8s ease-in-out infinite' }}></div>
        <div className="relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent" style={{ letterSpacing: '-0.02em' }}>AI × Architecture</h1>
          <p className="text-xl md:text-2xl text-slate-400 font-light mb-8" style={{ letterSpacing: '0.05em' }}>Where Innovation Meets Design</p>
          <div className="flex flex-wrap gap-6 justify-center text-sm text-slate-500" style={{ animation: 'fadeInUp 1s ease-out 0.3s both' }}>
            <span className="relative">{articles.filter(a => !a.archived).length} CURATED ARTICLES</span>
            <span className="relative">{trendingCount} TRENDING NOW</span>
            <span className="relative">{savedArticles.length} SAVED</span>
            {viewCount && <span className="relative flex items-center gap-2">👁️ {viewCount.toLocaleString()} VIEWS</span>}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="max-w-6xl mx-auto px-4 py-8" style={{ animation: 'fadeInUp 1s ease-out 0.6s both' }}>
          <div className="text-center text-slate-500 text-xs tracking-widest uppercase mb-6">Featured Today</div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:-translate-y-2 transition-all duration-500 cursor-pointer relative group overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
              <span className="text-3xl">{featuredArticle.sourceLogo}</span>
              <span>{featuredArticle.source}</span>
              <span>•</span>
              <span>{featuredArticle.readTime} min read</span>
              <span>•</span>
              <span>{getRelativeTime(featuredArticle.date)}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{featuredArticle.title}</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">{featuredArticle.summary}</p>
            <div className="flex gap-2 flex-wrap">
              {featuredArticle.keywords.map((kw, i) => <span key={i} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400">{kw}</span>)}
            </div>
          </div>
        </section>
      )}

      {/* Chart Section */}
      {showChart && chartData.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8" style={{ animation: 'fadeInUp 1s ease-out 0.9s both' }}>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Articles by Category</h2>
            </div>
            <div className="space-y-3">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-48 text-sm text-slate-400 text-right">{item.name}</div>
                  <div className="flex-1 h-4 bg-slate-900/50 rounded-lg overflow-hidden relative">
                    <div className="h-full rounded-lg flex items-center px-3 text-xs font-semibold text-white transition-all duration-1000" style={{ width: `${(item.count / chartData[0].count) * 100}%`, background: `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[(idx + 1) % colors.length]})`, animation: 'growBar 1.5s ease-out forwards', animationDelay: `${idx * 0.1}s` }}></div>
                  </div>
                  <div className="w-12 text-right text-sm font-semibold">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feed Status */}
      {showFeedStatus && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5" />RSS Feed Status</h2>
              <button onClick={() => setShowFeedStatus(false)} className="text-sm text-slate-400 hover:text-slate-300">Hide</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RSS_FEEDS.map((feed) => {
                const info = feedStatus[feed.source] || { status: 'pending', count: 0 };
                return (
                  <div key={feed.source} className="p-3 rounded-lg border border-white/5 bg-slate-750">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{feed.source}</span>
                      {info.status === 'success' ? <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">✓ Active</span> : info.status === 'pending' ? <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">⏳ Pending</span> : <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">✗ Failed</span>}
                    </div>
                    <p className="text-xs text-slate-400">{info.status === 'success' ? `Fetched: ${info.totalFetched} → Filtered: ${info.count}` : info.status === 'pending' ? 'Waiting... Refresh to load' : `Error: ${info.error}`}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('all')} className={'px-6 py-3 rounded-xl font-medium transition ' + (activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}>Recent ({articles.filter(a => !a.archived).length})</button>
          <button onClick={() => setActiveTab('saved')} className={'px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ' + (activeTab === 'saved' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}><Heart className="w-4 h-4" fill={activeTab === 'saved' ? 'currentColor' : 'none'} />Saved ({savedArticles.length})</button>
          <button onClick={() => setActiveTab('archive')} className={'px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ' + (activeTab === 'archive' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}><Archive className="w-4 h-4" />Archive ({articles.filter(a => a.archived).length})</button>
        </div>

        {/* Search & Add */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-32 py-4 rounded-xl border bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={addArticleByURL} className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600">+ Add Article</button>
        </div>
      </div>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((article, idx) => (
            <article key={article.id} className="rounded-xl p-4 border bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-blue-500/50 transition-all hover:-translate-y-1 hover:shadow-2xl" style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: `${idx * 0.05}s`, opacity: 0 }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{article.sourceLogo}</span>
                  <span className="text-xs text-slate-400">{article.source}</span>
                </div>
                <button onClick={() => toggleSave(article.id)} className={savedArticles.includes(article.id) ? 'text-yellow-500' : 'text-slate-500 hover:text-yellow-400'}><Bookmark className="w-4 h-4" fill={savedArticles.includes(article.id) ? 'currentColor' : 'none'} /></button>
              </div>
              {(article.archived || article.manual) && (
                <div className="flex gap-2 mb-2">
                  {article.archived && <div className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400"><Archive className="w-3 h-3 inline mr-1" />Archived</div>}
                  {article.manual && <div className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">✓ Manual</div>}
                </div>
              )}
              <h2 className="text-sm font-bold mb-2 line-clamp-2 group-hover:text-blue-400 transition">{article.title}</h2>
              <p className="text-xs mb-2 line-clamp-2 text-slate-400">{article.summary}</p>
              {article.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {article.keywords.slice(0, 3).map((kw, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">{kw}</span>)}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400">{article.category}</span>
                {article.trending && <span className="px-2 py-0.5 rounded text-xs flex items-center gap-1 bg-orange-500/10 text-orange-400"><TrendingUp className="w-3 h-3" />Trending</span>}
              </div>
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-700">
                {!article.archived ? (
                  <button onClick={() => archiveArticle(article.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"><Archive className="w-3 h-3" />Archive</button>
                ) : (
                  <button onClick={() => restoreArticle(article.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20"><ArchiveRestore className="w-3 h-3" />Restore</button>
                )}
                <button onClick={() => deleteArticle(article.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-3 h-3" />Delete</button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} min</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{getRelativeTime(article.date)}</span>
                </div>
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">Read<ExternalLink className="w-3 h-3" /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes growBar { from { width: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
};

export default App;
