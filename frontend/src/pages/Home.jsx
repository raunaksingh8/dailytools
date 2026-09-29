import React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Code2, FileText, File, Search } from 'lucide-react';
import { tools } from '../data/tools';
import ToolCard from '../components/ToolCard';

const Home = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const query = fd.get('q');
    if (query) navigate(`/?q=${encodeURIComponent(query)}`);
  };

  const filteredTools = q
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q.toLowerCase()) ||
          t.description.toLowerCase().includes(q.toLowerCase()) ||
          t.category.toLowerCase().includes(q.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()))
      )
    : [];

  const popularTools = tools.slice(0, 6);

  /* ── Search Results Page ── */
  if (q) {
    return (
      <div className="container" style={{ padding: '3rem 0', minHeight: 'calc(100vh - 200px)' }}>
        <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', marginBottom: '0.5rem' }}>
          Search results for &ldquo;{q}&rdquo;
        </h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>
          Found {filteredTools.length} tools.
        </p>
        <div className="tool-grid-hz">
          {filteredTools.map((tool) => {
            const IconComp = Icons[tool.icon] || Code2;
            return (
              <Link key={tool.slug} to={tool.route} className="tool-card-hz">
                <div style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '0.5rem', borderRadius: '0.5rem', flexShrink: 0 }}>
                  <IconComp size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{tool.name}</h4>
                  <p className="text-secondary" style={{ fontSize: '0.8rem' }}>{tool.description}</p>
                </div>
              </Link>
            );
          })}
          {filteredTools.length === 0 && (
            <p className="text-secondary">No tools matched your search.</p>
          )}
        </div>
      </div>
    );
  }

  /* ── Main Homepage ── */
  return (
    <div style={{ backgroundColor: 'var(--bg-main)', overflowX: 'hidden' }}>

      {/* ── Hero ── */}
      <section className="hero-section-desktop" style={{ backgroundColor: 'var(--bg-hero)', color: 'var(--text-hero)', padding: 'clamp(2rem, 4vw, 3.5rem) 0 clamp(2rem, 4vw, 3.5rem)' }}>
        <div
          className="container hero-grid"
        >
          {/* Text */}
          <div style={{ maxWidth: '560px' }}>
            <div
              style={{
                display: 'inline-block',
                border: '1px solid var(--border-color)',
                borderRadius: '2rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-hero-secondary)',
                marginBottom: '1.25rem',
              }}
            >
              ✦ Free • No Signup • Privacy First
            </div>

            <h1
              className="responsive-hero-text"
              style={{ marginBottom: '1rem', color: 'var(--text-hero)' }}
            >
              Simple tools for <br />
              everyday{' '}
              <span style={{ color: 'var(--accent-primary)' }}>digital work.</span>
            </h1>

            <p
              className="hero-desc-desktop"
              style={{
                fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
                color: 'var(--text-hero-secondary)',
                marginBottom: '1.75rem',
                lineHeight: '1.65',
                maxWidth: '460px',
              }}
            >
              Fast, free tools for developers, creators and everyone.
              <br />
              No signup. Your data stays on your device.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="hero-search-desktop" style={{ position: 'relative', maxWidth: '460px', width: '100%' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                name="q"
                placeholder="What do you need to do?"
                style={{
                  width: '100%',
                  padding: '0.875rem 3.5rem 0.875rem 3rem',
                  fontSize: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  outline: 'none',
                  boxShadow: 'var(--shadow-md)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '0.5rem',
                  bottom: '0.5rem',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minWidth: '44px',
                }}
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Hero decorative shapes — only on larger screens, beside the text */}
          <div
            className="hidden lg-block hero-icons-container"
            style={{ position: 'relative', height: '300px', minWidth: '280px' }}
          >
            <div className="hero-icon-1" style={{ position: 'absolute', top: '5%', right: '18%', width: '110px', height: '110px', backgroundColor: 'var(--accent-primary)', borderRadius: '22px', transform: 'rotate(15deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={44} color="white" />
            </div>
            <div className="hero-icon-2" style={{ position: 'absolute', top: '38%', right: '2%', width: '130px', height: '130px', backgroundColor: '#F59E0B', borderRadius: '22px', transform: 'rotate(-10deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <File size={52} color="white" />
            </div>
            <div className="hero-icon-3" style={{ position: 'absolute', bottom: '5%', right: '38%', width: '96px', height: '96px', backgroundColor: '#10B981', borderRadius: '22px', transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white' }}>Aa</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Cards ── */}
      <section className="categories-section-desktop" style={{ padding: 'clamp(1.5rem, 3vw, 3rem) 0', position: 'relative' }}>
        <div className="container">
          <h2 style={{ marginBottom: '1.5rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
            Explore by Category
          </h2>

          <div
            className="categories-grid-desktop"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '1.25rem',
            }}
          >
            <Link to="/developer" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="categories-icon-desktop" style={{ color: 'var(--accent-primary)', marginBottom: '1.25rem' }}>
                <Code2 size={44} strokeWidth={1.5} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>Developer Tools</h3>
              <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                JSON, encoding, generators, API tools and more.
              </p>
              <span className="text-accent" style={{ fontWeight: 500, marginTop: 'auto', fontSize: '0.875rem' }}>
                {tools.filter((t) => t.category === 'Developer').length}+ tools →
              </span>
            </Link>

            <Link to="/files" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="categories-icon-desktop" style={{ color: '#F59E0B', marginBottom: '1.25rem' }}>
                <File size={44} strokeWidth={1.5} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>File Tools</h3>
              <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                PDF, image, CSV and other file utilities.
              </p>
              <span className="text-accent" style={{ fontWeight: 500, marginTop: 'auto', fontSize: '0.875rem' }}>
                {tools.filter((t) => t.category === 'Files').length}+ tools →
              </span>
            </Link>

            <Link to="/text" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="categories-icon-desktop" style={{ color: '#10B981', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '2.75rem', fontWeight: 600, lineHeight: 1 }}>Aa</span>
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>Text Tools</h3>
              <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Word counter, formatters, converters and more.
              </p>
              <span className="text-accent" style={{ fontWeight: 500, marginTop: 'auto', fontSize: '0.875rem' }}>
                {tools.filter((t) => t.category === 'Text').length}+ tools →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular Tools ── */}
      <section className="popular-section-desktop" style={{ padding: '0 0 clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Popular Tools</h2>
            <Link to="/developer" className="text-accent" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              View all →
            </Link>
          </div>

          <div className="tool-grid-hz">
            {popularTools.map((tool) => {
              const IconComp = Icons[tool.icon] || Code2;
              return (
                <Link key={tool.slug} to={tool.route} className="tool-card-hz">
                  <div style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '0.5rem', borderRadius: '0.5rem', flexShrink: 0 }}>
                    <IconComp size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{tool.name}</h4>
                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>{tool.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
