import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { apiGet, apiPatch } from '@/lib/api';
import AuthModal from './AuthModal';
import { 
  Heart, Menu, X, User, LogOut, Settings, Calendar, 
  FileText, Stethoscope, Video, Search, Bell, ChevronDown,
  Home, Activity, Pill, Clock, MessageCircle, Users, CreditCard,
  LogIn, UserPlus
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const { currentUser, userRole, isAuthenticated, logout } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadMessageCount = notifications.filter(n => !n.is_read && n.type === 'message').length;
  const unreadPlanCount = notifications.filter(n => !n.is_read && n.type === 'treatment_plan').length;

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        const data = await apiGet(`/notifications?userId=${currentUser.id}`);
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser?.id]);

  const markAllRead = async () => {
    if (!currentUser?.id) return;
    try {
      await apiPatch('/notifications/read-all', { userId: currentUser.id });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const patientNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'find-provider', label: 'Find Provider', icon: Search },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'telehealth', label: 'Telehealth', icon: Video },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'scan', label: 'Heart Scan', icon: Heart },
    { id: 'labs', label: 'Lab Results', icon: FileText },
    { id: 'clinical', label: 'Clinical Tools', icon: Stethoscope },
  ];

  const providerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'appointments', label: 'Schedule', icon: Calendar },
    { id: 'schedule-manager', label: 'Availability', icon: Clock },
    { id: 'telehealth', label: 'Telehealth', icon: Video },
    { id: 'my-patients', label: 'My Patients', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'clinical', label: 'Clinical', icon: Stethoscope },
    { id: 'scribe', label: 'AI Scribe', icon: FileText },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  const navItems = userRole === 'provider' ? providerNavItems : patientNavItems;


  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setActiveTab('dashboard');
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-1 ring-white/10">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="sr-only">
                  <h1>PEHD</h1>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-900/60 px-2 py-1 shadow-[0_10px_30px_-22px_rgba(14,165,233,0.5)]">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`group relative flex items- center gap-2 px-3 py-2 rounded-full transition-all ${
                    activeTab === item.id
                      ? 'bg-cyan-500/15 text-white ring-1 ring-cyan-500/30 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                      : 'text-slate-300/80 hover:text-white hover:bg-slate-900/70'
                  }`}
                >
                  <item.icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
                  <span className="text-[11px] font-medium tracking-wide text-slate-300/90 group-hover:text-white">
                    {item.label}
                  </span>
                  <span className="sr-only">{item.label}</span>
                  {activeTab === item.id && (
                    <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                  )}
                  {item.id === 'messages' && unreadMessageCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                    </span>
                  )}
                  {item.id === 'clinical' && unreadPlanCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        const next = !showNotifications;
                        setShowNotifications(next);
                        if (next && unreadCount > 0) {
                          markAllRead();
                        }
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors relative"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full" />
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50">
                        <div className="px-4 py-2 border-b border-slate-700">
                          <p className="text-sm text-white font-medium">Notifications</p>
                          <p className="text-xs text-slate-500">{unreadCount} unread</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-slate-400 text-sm">
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map(notification => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 border-b border-slate-700/50 ${
                                  notification.is_read ? 'text-slate-400' : 'text-white'
                                }`}
                              >
                                <p className="text-sm font-medium">{notification.title}</p>
                                {notification.body && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {notification.body}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800/70 bg-slate-900/60 hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 animate-in slide-in-from-top-2">
                        <div className="px-4 py-2 border-b border-slate-700">
                          <p className="text-sm text-white font-medium">
                            {userRole === 'provider' ? 'Dr. ' : ''}{currentUser?.firstName} {currentUser?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{currentUser?.email}</p>
                        </div>
                        <button
                          onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-3"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </button>
                        <button
                          onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-3"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <div className="border-t border-slate-700 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-slate-700 flex items-center gap-3"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogin}
                    title="Sign In"
                    aria-label="Sign In"
                    className="h-10 w-10 rounded-xl border border-slate-800/70 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center"
                  >
                    <LogIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRegister}
                    title="Get Started"
                    aria-label="Get Started"
                    className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center shadow-lg shadow-cyan-500/30"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all flex items-center gap-3 ${
                    activeTab === item.id
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="relative">
                    {item.label}
                    {item.id === 'messages' && unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-3 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Navigation;
