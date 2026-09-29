import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Menu, X, Zap } from 'lucide-react';
import '../styles/global.css';
import '../styles/navbar.css';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Persist theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('dailytools_theme');
    if (saved === 'dark') {
      document.body.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.body.classList.add('dark');
      localStorage.setItem('dailytools_theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('dailytools_theme', 'light');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
    }
  };


  return (
    <nav
      ref={menuRef}
      className="navbar-wrapper"
    >
      <div className="container navbar-container">
        {/* Logo + Desktop Nav Links */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <div className="navbar-logo-icon">
              <span className="navbar-logo-star"><Zap size={18} strokeWidth={2.5} /></span>
            </div>
            DailyTools
          </Link>

          {/* Desktop nav links — hidden on mobile, shown on md+ */}
          <div className="hidden md-flex navbar-desktop-links">
            <Link to="/developer" className="navbar-link">Developer</Link>
            <Link to="/files" className="navbar-link secondary">Files</Link>
            <Link to="/text" className="navbar-link secondary">Text</Link>
          </div>
        </div>

        {/* Right: Desktop Search + Theme + Mobile Menu Button */}
        <div className="navbar-right">
          {/* Desktop search — hidden on mobile, shown on md+ */}
          <form onSubmit={handleSearch} className="hidden md-flex navbar-desktop-search">
            <Search size={15} className="navbar-desktop-search-icon" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar-search-input"
            />
          </form>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="navbar-icon-button"
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile hamburger — ONLY shown on small screens via CSS class */}
          <button
            className="navbar-hamburger navbar-icon-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu — only rendered when open AND on mobile */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <div className="container navbar-mobile-container">
            {/* Mobile nav links */}
            {[
              { to: '/developer', label: 'Developer' },
              { to: '/files', label: 'Files' },
              { to: '/text', label: 'Text' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="navbar-mobile-link">
                {label}
              </Link>
            ))}

            {/* Mobile search */}
            <form onSubmit={handleSearch} className="navbar-mobile-search">
              <Search size={16} className="navbar-mobile-search-icon" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="navbar-mobile-search-input"
              />
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
