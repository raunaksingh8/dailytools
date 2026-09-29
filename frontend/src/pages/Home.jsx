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

  const filteredTools = q ? tools.filter(t => 
    t.name.toLowerCase().includes(q.toLowerCase()) || 
    t.description.toLowerCase().includes(q.toLowerCase()) ||
    t.category.toLowerCase().includes(q.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
  ) : [];

  const popularTools = tools.slice(0, 6);

  if (q) {
    return (
      <div className="container" style={{ padding: '3rem 0', minHeight: 'calc(100vh - 200px)' }}>
        <h2>Search results for "{q}"</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>Found {filteredTools.length} tools.</p>
        <div className="tool-grid">
          {filteredTools.map(tool => <ToolCard key={tool.slug} tool={tool} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--bg-hero)', color: 'var(--text-hero)', padding: '4rem 0 6rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', border: '1px solid var(--border-color)', borderRadius: '2rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-hero-secondary)', marginBottom: '2rem' }}>
              ✦ Free • No Signup • Privacy First
            </div>
            
            <h1 style={{ fontSize: '4rem', lineHeight: '1.1', marginBottom: '1.5rem', letterSpacing: '-0.025em', color: 'var(--text-hero)' }}>
              Simple tools for <br />
              everyday <span style={{ color: 'var(--accent-primary)' }}>digital work.</span>
            </h1>
            
            <p style={{ fontSize: '1.125rem', color: 'var(--text-hero-secondary)', marginBottom: '2.5rem', maxWidth: '480px', lineHeight: '1.6' }}>
              Fast, free tools for developers, creators and everyone.<br />
              No signup. Your data stays on your device.
            </p>
            
            <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '480px' }}>
              <input 
                type="text" 
                name="q"
                placeholder="What do you need to do?" 
                style={{ 
                  width: '100%',
                  padding: '1.25rem 1.5rem', 
                  fontSize: '1rem', 
                  borderRadius: '0.75rem', 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  outline: 'none',
                  boxShadow: 'var(--shadow-md)',
                  color: 'var(--text-primary)'
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
                  borderRadius: '0.5rem', 
                  padding: '0 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Search size={18} />
              </button>
            </form>
          </div>
          
          <div className="hidden lg-block" style={{ position: 'relative', height: '400px' }}>
            {/* Abstract visual mockup shapes */}
            <div style={{ position: 'absolute', top: '10%', right: '20%', width: '120px', height: '120px', backgroundColor: 'var(--accent-primary)', borderRadius: '24px', transform: 'rotate(15deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={48} color="white" />
            </div>
            <div style={{ position: 'absolute', top: '40%', right: '5%', width: '140px', height: '140px', backgroundColor: '#F59E0B', borderRadius: '24px', transform: 'rotate(-10deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <File size={56} color="white" />
            </div>
            <div style={{ position: 'absolute', bottom: '10%', right: '35%', width: '100px', height: '100px', backgroundColor: '#10B981', borderRadius: '24px', transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>Aa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '4rem 0', position: 'relative', top: '-2rem' }}>
        <div className="container">
          <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Explore by Category</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <Link to="/developer" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
                <Code2 size={48} strokeWidth={1.5} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Developer Tools</h3>
              <p className="text-secondary" style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>JSON, encoding, generators, API tools and more.</p>
              <span className="text-accent" style={{ fontWeight: 500, marginTop: 'auto', fontSize: '0.875rem' }}>
                {tools.filter(t => t.category === 'Developer').length}+ tools →
              </span>
            </Link>
            
            <Link to="/files" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ color: '#F59E0B', marginBottom: '1.5rem' }}>
                <File size={48} strokeWidth={1.5} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>File Tools</h3>
              <p className="text-secondary" style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>PDF, image, CSV and other file utilities.</p>
              <span className="text-accent" style={{ fontWeight: 500, marginTop: 'auto', fontSize: '0.875rem' }}>
                {tools.filter(t => t.category === 'Files').length}+ tools →
              </span>
            </Link>
            
            <Link to="/text" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ color: '#10B981', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 600, lineHeight: 1 }}>Aa</span>
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Text Tools</h3>
              <p className="text-secondary" style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>Word counter, formatters, converters and more.</p>
              <span className="text-accent" style={{ fontWeight: 500, marginTop: 'auto', fontSize: '0.875rem' }}>
                {tools.filter(t => t.category === 'Text').length}+ tools →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Tools */}
      <section style={{ padding: '0 0 6rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Popular Tools</h2>
            <Link to="/developer" className="text-accent" style={{ fontSize: '0.875rem', fontWeight: 500 }}>View all →</Link>
          </div>
          
          {/* Horizontal layout like reference */}
          <div className="tool-grid-hz">
            {popularTools.map(tool => {
              const IconComp = Icons[tool.icon] || Code2;
              return (
                <Link key={tool.slug} to={tool.route} className="tool-card-hz">
                  <div style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    <IconComp size={20} />
                  </div>
                  <div>
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
