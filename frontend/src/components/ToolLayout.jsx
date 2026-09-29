import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Share2, MoreHorizontal } from 'lucide-react';
import { tools } from '../data/tools';

const ToolLayout = ({ tool, children, toolbarActions, about, relatedTools = [] }) => {
  if (!tool) return <div className="container" style={{ padding: '4rem 0' }}>Tool not found</div>;
  
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('dailytools_favs') || '[]');
    setIsFavorite(favs.includes(tool.slug));
  }, [tool.slug]);

  const toggleFavorite = () => {
    let favs = JSON.parse(localStorage.getItem('dailytools_favs') || '[]');
    if (favs.includes(tool.slug)) {
      favs = favs.filter(slug => slug !== tool.slug);
      setIsFavorite(false);
    } else {
      favs.push(tool.slug);
      setIsFavorite(true);
    }
    localStorage.setItem('dailytools_favs', JSON.stringify(favs));
  };

  const related = relatedTools.map(slug => tools.find(t => t.slug === slug)).filter(Boolean);

  return (
    <div className="container" style={{ padding: '2rem 0 4rem 0', display: 'flex', flexDirection: 'column' }}>
      
      {/* Breadcrumb */}
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <Link to="/">Home</Link> / <Link to={`/${tool.category.toLowerCase()}`}>{tool.category}</Link> / <span style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '2rem', letterSpacing: '-0.025em' }}>{tool.name}</h1>
          <p className="text-secondary" style={{ fontSize: '1rem' }}>{tool.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={toggleFavorite} style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>
            <Star size={16} fill={isFavorite ? "currentColor" : "none"} /> {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
          <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px', marginBottom: '3rem' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
        {toolbarActions && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {toolbarActions}
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>About {tool.name}</h3>
        <p className="text-secondary" style={{ marginBottom: '2rem', maxWidth: '800px', lineHeight: '1.6' }}>
          {about || `This tool helps you ${tool.description.toLowerCase()} You can use it directly in your browser without sending data to our servers.`}
        </p>
        
        {related.length > 0 && (
          <>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Related Tools</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {related.map(r => (
                <Link key={r.slug} to={r.route} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  {r.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ToolLayout;
