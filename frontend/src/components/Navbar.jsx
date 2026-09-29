import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Menu, X } from 'lucide-react';
import '../styles/global.css';

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

  const navLinkStyle = {
    color: 'var(--text-navbar)',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'color 0.2s',
    padding: '0.25rem 0',
  };

  return (
    <nav
      ref={menuRef}
      style={{
        backgroundColor: 'var(--bg-navbar)',
        color: 'var(--text-navbar)',
        borderBottom: '1px solid #1F2937',
        position: 'relative',
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '56px' }}
      >
        {/* Logo + Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', minWidth: 0 }}>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.025em', flexShrink: 0 }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: '11px', lineHeight: 1 }}>★</span>
            </div>
            DailyTools
          </Link>

          {/* Desktop nav links — hidden on mobile, shown on md+ */}
          <div className="hidden md-flex" style={{ gap: '1.5rem' }}>
            <Link to="/developer" style={navLinkStyle}>Developer</Link>
            <Link to="/files" style={{ ...navLinkStyle, color: 'var(--text-navbar-secondary)' }}>Files</Link>
            <Link to="/text" style={{ ...navLinkStyle, color: 'var(--text-navbar-secondary)' }}>Text</Link>
          </div>
        </div>

        {/* Right: Desktop Search + Theme + Mobile Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Desktop search — hidden on mobile, shown on md+ */}
          <form onSubmit={handleSearch} className="hidden md-flex" style={{ position: 'relative', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', color: '#6B7280', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#1C1F26',
                border: '1px solid #2D313A',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 1rem 0.4rem 2rem',
                color: 'white',
                outline: 'none',
                width: '220px',
                fontSize: '0.8125rem',
              }}
            />
          </form>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{ color: '#9CA3AF', padding: '0.25rem', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile hamburger — ONLY shown on small screens via CSS class */}
          <button
            className="navbar-hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ color: '#9CA3AF', padding: '0.25rem', minHeight: '44px', minWidth: '44px', alignItems: 'center', justifyContent: 'center' }}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu — only rendered when open AND on mobile */}
      {isMobileMenuOpen && (
        <div
          className="navbar-mobile-menu"
          style={{
            borderTop: '1px solid #1F2937',
            backgroundColor: '#12141C',
          }}
        >
          <div className="container" style={{ paddingBlock: '1rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Mobile nav links */}
            {[
              { to: '/developer', label: 'Developer' },
              { to: '/files', label: 'Files' },
              { to: '/text', label: 'Text' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 500,
                  padding: '0.875rem 0',
                  borderBottom: '1px solid #1F2937',
                  display: 'block',
                }}
              >
                {label}
              </Link>
            ))}

            {/* Mobile search */}
            <form onSubmit={handleSearch} style={{ position: 'relative', marginTop: '1rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: '#1C1F26',
                  border: '1px solid #2D313A',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  color: 'white',
                  outline: 'none',
                  width: '100%',
                  fontSize: '1rem',
                }}
              />
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
