import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';
import { useTheme } from '../contexts/ThemeContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, User as UserIcon, Users, FileText, FolderGit2, 
  GitFork, Calendar, Award, FileSpreadsheet, Settings, LogOut, 
  Search, Bell, Sun, Moon, Menu, X, Shield, Landmark, AlertCircle, Command, Clock
} from 'lucide-react';
import { ResearcherService } from '../services/researcherService';
import { PublicationService } from '../services/publicationService';
import { ProjectService } from '../services/projectService';
import { ConferenceService } from '../services/conferenceService';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, researcher, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation Drawers/States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    researchers: any[];
    publications: any[];
    projects: any[];
    conferences: any[];
  }>({ researchers: [], publications: [], projects: [], conferences: [] });

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Publication Approved', message: 'Your paper on "Agentic Graph Architectures" is published.', time: '2h ago', unread: true },
    { id: 2, title: 'New Collaboration Connection', message: 'A new link was established with Dr. Rishitha Khandesh.', time: '1d ago', unread: true },
    { id: 3, title: 'Citation Tracked', message: 'Your article was cited by "Scholarly Transformers".', time: '2d ago', unread: false }
  ]);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Perform Global Search Query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ researchers: [], publications: [], projects: [], conferences: [] });
      return;
    }

    const q = searchQuery.toLowerCase();
    
    Promise.all([
      ResearcherService.getAll(),
      PublicationService.getAll(),
      ProjectService.getAll(),
      ConferenceService.getAll()
    ]).then(([res, pub, proj, conf]) => {
      setSearchResults({
        researchers: res.filter(r => r.name.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q)).slice(0, 3),
        publications: pub.filter(p => p.title.toLowerCase().includes(q) || p.abstract?.toLowerCase().includes(q)).slice(0, 3),
        projects: proj.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 3),
        conferences: conf.filter(c => c.name.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q)).slice(0, 3)
      });
    });
  }, [searchQuery]);

  const handleResultClick = (route: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(route);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Nav Items Definitions by Category
  const sidebarGroups = [
    {
      title: 'Overview',
      links: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }]
    },
    {
      title: 'Network',
      links: [
        { name: 'Researchers', path: '/researchers', icon: Users },
        { name: 'Collaborations', path: '/collaborations', icon: GitFork }
      ]
    },
    {
      title: 'Research',
      links: [
        { name: 'Publications', path: '/publications', icon: FileText },
        { name: 'Projects', path: '/projects', icon: FolderGit2 },
        { name: 'Citations', path: '/citations', icon: Award }
      ]
    },
    {
      title: 'Discovery',
      links: [{ name: 'Conferences', path: '/conferences', icon: Calendar }]
    },
    {
      title: 'Analytics',
      links: [{ name: 'Reports', path: '/reports', icon: FileSpreadsheet }]
    },
    {
      title: 'Account',
      links: [
        { name: 'My Profile', path: '/profile', icon: UserIcon },
        { name: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  const adminLinks = [
    { name: 'Admin Stats', path: '/admin', icon: Shield },
    { name: 'Users Directory', path: '/admin/users', icon: Users },
    { name: 'Pending Approvals', path: '/admin/pending-users', icon: Clock },
    { name: 'Institutions', path: '/admin/institutions', icon: Landmark },
    { name: 'Conferences Admin', path: '/admin/conferences', icon: Calendar },
    { name: 'Role Requests', path: '/admin/role-requests', icon: AlertCircle }
  ];

  const isLinkActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 w-full">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 select-none shrink-0">
        
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-navy-600 dark:text-navy-450 text-base">
            <GitFork className="w-4 h-4 text-navy-600" />
            <span className="tracking-tight text-slate-900 dark:text-slate-200">SCN Platform</span>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{group.title}</p>
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      active 
                        ? 'bg-navy-600 text-white shadow-sm shadow-navy-600/10' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Admin Sections */}
          {user?.role === UserRole.SYSTEM_ADMIN && (
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="px-3 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Administration</p>
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      active 
                        ? 'bg-red-600 text-white shadow-sm shadow-red-650/10' 
                        : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar User Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center text-white font-bold shadow-inner">
              {researcher?.name ? researcher.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate leading-4 text-slate-850 dark:text-slate-100">{researcher?.name || 'Academic User'}</h4>
              <p className="text-xs text-slate-450 dark:text-slate-400 truncate capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="w-full mt-2 flex items-center justify-center gap-2 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full animate-slide-in">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-navy-600 dark:text-navy-400 text-lg">
                <GitFork className="w-5 h-5" />
                <span className="text-slate-800 dark:text-slate-200">SCN Network</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {sidebarGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">{group.title}</p>
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const active = isLinkActive(link.path);
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                          active ? 'bg-navy-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              ))}

              {user?.role === UserRole.SYSTEM_ADMIN && (
                <div className="space-y-1 pt-2 border-t border-slate-150">
                  <p className="px-3 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Admin</p>
                  {adminLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isLinkActive(link.path);
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                          active ? 'bg-red-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center text-white font-bold">
                  {researcher?.name ? researcher.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold truncate">{researcher?.name || 'Academic User'}</h4>
                  <p className="text-[10px] text-slate-500 capitalize">{user?.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* TOPBAR */}
        <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
          
          {/* Left search activation trigger / Drawer toggler */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Command-Palette input launcher */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 text-xs w-64 justify-between transition-colors"
            >
              <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-slate-500" /> Global Search...</span>
              <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-mono flex items-center gap-0.5">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>

          {/* Right utility links */}
          <div className="flex items-center gap-3">
            
            {/* Mobile search button */}
            <button 
              onClick={() => setSearchOpen(true)} 
              className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Dark mode toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-navy-500" />}
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
              
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 py-3 divide-y divide-slate-100 dark:divide-slate-850">
                    <div className="px-4 pb-2 flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications Center</span>
                      <button onClick={markAllRead} className="text-[10px] text-navy-500 dark:text-navy-400 hover:underline">Mark all read</button>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto py-1">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 flex gap-2 justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 relative ${n.unread ? 'bg-navy-50/20 dark:bg-navy-950/10' : ''}`}>
                            <div className="flex-1 pr-4">
                              <h5 className="text-xs font-semibold">{n.title}</h5>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{n.message}</p>
                              <span className="text-[9px] text-slate-400 mt-1 block">{n.time}</span>
                            </div>
                            <button onClick={() => clearNotification(n.id)} className="text-slate-400 hover:text-slate-650 self-start p-0.5"><X className="w-3 h-3" /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown Indicator */}
            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800" />
            <Link to="/profile" className="flex items-center gap-2 select-none hover:opacity-85">
              <div className="w-8 h-8 rounded-full bg-navy-600 text-white font-bold flex items-center justify-center text-sm">
                {researcher?.name ? researcher.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-xs font-medium max-w-[100px] truncate">{researcher?.name || 'My Profile'}</span>
            </Link>

          </div>
        </header>

        {/* 3. SCROLLABLE PAGE CONTAINER */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* 4. COMMAND-PALETTE SEARCH OVERLAY (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
          <div className="fixed inset-0" onClick={() => setSearchOpen(false)} />
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[60vh] animate-scale-in">
            
            {/* Search Input bar */}
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-3 bg-slate-50 dark:bg-slate-950">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search across researchers, publications, projects, conferences..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="px-1.5 py-0.5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-[10px] text-slate-500 font-mono"
              >
                ESC
              </button>
            </div>

            {/* Results listing */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* If empty query */}
              {!searchQuery && (
                <div className="text-center py-8">
                  <Command className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Type search query to search the Scientific Database...</p>
                  <p className="text-[10px] text-slate-400 mt-1">Press Ctrl+K to open/close this helper anywhere.</p>
                </div>
              )}

              {/* Match categories */}
              {searchQuery && (
                <>
                  {searchResults.researchers.length === 0 && 
                   searchResults.publications.length === 0 && 
                   searchResults.projects.length === 0 && 
                   searchResults.conferences.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No results found for "{searchQuery}".</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Researchers */}
                      {searchResults.researchers.length > 0 && (
                        <div>
                          <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Researchers</h6>
                          <div className="space-y-1">
                            {searchResults.researchers.map(r => (
                              <button
                                key={r.researcher_id}
                                onClick={() => handleResultClick(`/researchers/${r.researcher_id}`)}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full bg-navy-600 text-white font-bold flex items-center justify-center text-xs">{r.name.charAt(0)}</div>
                                <div>
                                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.name}</div>
                                  <div className="text-[10px] text-slate-400">{r.department || 'Research'}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Publications */}
                      {searchResults.publications.length > 0 && (
                        <div>
                          <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Publications</h6>
                          <div className="space-y-1">
                            {searchResults.publications.map(p => (
                              <button
                                key={p.publication_id}
                                onClick={() => handleResultClick(`/publications/${p.publication_id}`)}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-3 transition-colors text-xs"
                              >
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.title}</div>
                                  <div className="text-[10px] text-slate-400 capitalize">{p.publication_type} • {p.status}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {searchResults.projects.length > 0 && (
                        <div>
                          <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Projects</h6>
                          <div className="space-y-1">
                            {searchResults.projects.map(p => (
                              <button
                                key={p.project_id}
                                onClick={() => handleResultClick(`/projects/${p.project_id}`)}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-3 transition-colors text-xs"
                              >
                                <FolderGit2 className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 capitalize">Status: {p.status}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conferences */}
                      {searchResults.conferences.length > 0 && (
                        <div>
                          <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Conferences</h6>
                          <div className="space-y-1">
                            {searchResults.conferences.map(c => (
                              <button
                                key={c.conference_id}
                                onClick={() => handleResultClick(`/conferences`)}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-3 transition-colors text-xs"
                              >
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{c.name}</div>
                                  <div className="text-[10px] text-slate-400">{c.location || 'Virtual'}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
