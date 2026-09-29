import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Share2 } from 'lucide-react';
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
      favs = favs.filter((slug) => slug !== tool.slug);
      setIsFavorite(false);
    } else {
      favs.push(tool.slug);
      setIsFavorite(true);
    }
    localStorage.setItem('dailytools_favs', JSON.stringify(favs));
  };

  const related = relatedTools.map((slug) => tools.find((t) => t.slug === slug)).filter(Boolean);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

      {/* Breadcrumb */}
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={`/${tool.category.toLowerCase()}`}>{tool.category}</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', letterSpacing: '-0.02em', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tool.name}
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>{tool.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={toggleFavorite}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
            aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? 'Favorited' : 'Favorite'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigator.share?.({ title: tool.name, url: window.location.href })}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
            aria-label="Share this tool"
          >
            <Share2 size={15} /> Share
          </button>
        </div>
      </div>

      {/* Toolbar actions (Format, Copy, Download…) */}
      {toolbarActions && (
        <div className="toolbar-actions" style={{ marginBottom: '1.25rem' }}>
          {toolbarActions}
        </div>
      )}

      {/* Main content (editor, upload area, etc.) */}
      <div style={{ marginBottom: '3rem' }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>About {tool.name}</h3>
        <p className="text-secondary" style={{ marginBottom: '2rem', maxWidth: '760px', lineHeight: '1.7', fontSize: '0.9375rem' }}>
          {about ||
            `This tool helps you ${tool.description.toLowerCase()} You can use it directly in your browser without sending data to our servers.`}
        </p>

        {related.length > 0 && (
          <>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Related Tools</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={r.route}
                  style={{
                    padding: '0.4rem 0.875rem',
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent-primary)',
                    borderRadius: '2rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                  }}
                >
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
