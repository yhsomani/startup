/**
 * Layout Component
 * 
 * Main layout component with navigation, header, sidebar, and footer
 * Responsive design with collapsible sidebar and mobile menu
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import { selectLayout } from '../store/slices/uiSlice';
// Import logger conditionally for development only
const Logger = process.env.NODE_ENV === 'development' ? require('../../shared/logger') : null;

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme } = useTheme();
  const { activeTab, setBreadcrumbs } = useSelector(selectLayout);
  const dispatch = useDispatch();
  
  // Local sidebar state since ThemeContext doesn't provide sidebar management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  // Navigation items
  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠️', requiresAuth: false },
    { path: '/jobs', label: 'Job Search', icon: '💼', requiresAuth: false },
    { path: '/jobs/applied', label: 'Applications', icon: '📋', requiresAuth: true },
    { path: '/profile', label: 'Profile', icon: '👤', requiresAuth: true },
    { path: '/messages', label: 'Messages', icon: '💬', requiresAuth: true },
    { path: '/companies', label: 'Companies', icon: '🏢', requiresAuth: false },
    { path: '/analytics', label: 'Analytics', icon: '📊', requiresAuth: true },
    { path: '/settings', label: 'Settings', icon: '⚙️', requiresAuth: true },
  ];
  
  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Logger moved to conditional import for production
  
  // Update breadcrumbs based on current location
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
      return {
        path: '/' + pathSegments.slice(0, index + 1).join('/'),
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
      };
    });
    
    setBreadcrumbs(breadcrumbs);
  }, [location.pathname]);
  
  // Get current navigation item
  const getCurrentNavItem = () => {
    return navigationItems.find(item => 
      item.path === '/' && location.pathname === '/' ||
      location.pathname.startsWith(item.path + '/')
    ) || navigationItems[0]; // Dashboard as fallback
  };
  
  const currentNavItem = getCurrentNavItem();
  
  const handleLogout = () => {
    const { logout } = useAuth();
    logout();
    setMobileMenuOpen(false);
  };
  
  return (
    <div className={`layout ${theme.mode} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <header className="layout-header">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span className="menu-icon">☰</span>
          </button>
          
          <Link to="/" className="logo-link">
            <div className="logo">
              <span className="logo-text">Talent</span>
              <span className="logo-sphere">Sphere</span>
            </div>
          </Link>
          
          <nav className="main-nav">
            {navigationItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="header-right">
          {/* User menu */}
          {user && (
            <div className="user-menu">
              <div className="user-avatar">
                <img 
                  src={user.profilePicture || '/default-avatar.png'} 
                  alt={user.name}
                  className="avatar"
                />
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button 
                className="logout-button"
                onClick={handleLogout}
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          )}
          
          {/* Notifications */}
          <div className="header-notifications">
            <button className="notifications-btn" aria-label="Notifications">
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
          </div>
          
          {/* Dark mode toggle */}
          <button 
            className={`theme-toggle ${theme.mode}`}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {theme.mode === 'dark' ? '☀️' : '🌞'}
          </button>
        </div>
      </header>
      
      {/* Sidebar */}
      <aside className={`layout-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-text">Talent</span>
              <span className="logo-sphere">Sphere</span>
            </div>
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <span className="toggle-icon">☰</span>
            </button>
          </div>
          
          <nav className="sidebar-nav">
            {navigationItems
              .filter(item => !item.requiresAuth || user)
              .map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
          </nav>
          
          {user && (
            <div className="sidebar-user-section">
              <div className="sidebar-user">
                <div className="user-avatar">
                  <img 
                    src={user.profilePicture || '/default-avatar.png'} 
                    alt={user.name}
                    className="avatar"
                  />
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
              
              <div className="sidebar-actions">
                <Link to="/profile" className="sidebar-action">
                  <span>Profile</span>
                </Link>
                <Link to="/settings" className="sidebar-action">
                  <span>Settings</span>
                </Link>
                <button 
                  className="sidebar-action logout-btn"
                  onClick={handleLogout}
                >
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu">
            {navigationItems
              .filter(item => !item.requiresAuth || user)
              .map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="mobile-menu-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className={`layout-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="content-wrapper">
          {/* Breadcrumbs */}
          {location.pathname !== '/' && (
            <nav className="breadcrumbs">
              <Link to="/" className="breadcrumb-item">Home</Link>
              {location.pathname !== '/' && ' / '}
              {location.pathname.split('/').filter(Boolean).map((segment, index, array) => (
                <React.Fragment key={index}>
                  <Link to={array.slice(0, index + 1).join('/')} className="breadcrumb-item">
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </Link>
                  {index < array.length - 1 && ' / '}
                </React.Fragment>
              ))}
            </nav>
          )}
          
          {/* Page content */}
          <div className="page-content">
            {children}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="layout-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>TalentSphere</h4>
            <p>© 2024 TalentSphere Platform. All rights reserved.</p>
          </div>
          
          <div className="footer-section">
            <a href="/about" className="footer-link">About</a>
            <span> • </span>
            <a href="/privacy" className="footer-link">Privacy</a>
            <span> • </span>
            <a href="/terms" className="footer-link">Terms</a>
          </div>
          
          <div className="footer-section">
            <a href="/help" className="footer-link">Help</a>
            <span> • </span>
            <a href="/contact" className="footer-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
    
    {/* Mobile menu button */}
    <button
      className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      aria-label="Toggle mobile menu"
    >
      <span className="hamburger-icon">☰</span>
      <span className="hamburger-icon">☰</span>
      <span className="hamburger-icon">☰</span>
    </button>
  </Layout>
  );
};

export default Layout;