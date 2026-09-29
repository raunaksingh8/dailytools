import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Menu } from 'lucide-react';
import '../styles/global.css';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('dailytools_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
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
    }
  };

  return (
    <nav style={{ backgroundColor: 'var(--bg-navbar)', color: 'var(--text-navbar)', padding: '0.75rem 0', borderBottom: '1px solid #1F2937' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '12px' }}>★</span>
            </div>
            DailyTools
          </Link>
          
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-navbar-secondary)', fontSize: '0.875rem', fontWeight: 500 }} className="hidden md-flex">
            <Link to="/developer" style={{ color: 'var(--text-navbar)' }}>Developer</Link>
            <Link to="/files" style={{ transition: 'color 0.2s' }}>Files</Link>
            <Link to="/text" style={{ transition: 'color 0.2s' }}>Text</Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex' }} className="hidden md-block">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
            <input 
              type="text" 
              placeholder="Search tools..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#1C1F26',
                border: '1px solid #2D313A',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 1rem 0.4rem 2.25rem',
                color: 'white',
                outline: 'none',
                width: '240px',
                fontSize: '0.875rem'
              }}
            />
          </form>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#9CA3AF' }}>
            <button style={{ color: 'inherit' }} onClick={toggleTheme}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button style={{ color: 'inherit' }} className="md-hidden">
              <Menu size={24} />
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
