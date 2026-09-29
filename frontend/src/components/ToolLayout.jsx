import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Share2 } from 'lucide-react';
import { tools } from '../data/tools';
import '../styles/tool-layout.css';

const ToolLayout = ({ tool, children, toolbarActions, about, relatedTools = [] }) => {
  if (!tool) return <div className="container tool-layout-container">Tool not found</div>;

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
    <div className="container tool-layout-container">

      {/* Breadcrumb */}
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={`/${tool.category.toLowerCase()}`}>{tool.category}</Link>
        <span>/</span>
        <span className="tool-breadcrumb-current">{tool.name}</span>
      </div>

      {/* Header */}
      <div className="tool-header-row">
        <div className="tool-header-text">
          <h1 className="tool-title">
            {tool.name}
          </h1>
          <p className="text-secondary tool-description">{tool.description}</p>
        </div>
        <div className="tool-header-actions">
          <button
            className="btn-secondary tool-action-btn"
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? 'Favorited' : 'Favorite'}
          </button>
          <button
            className="btn-secondary tool-action-btn"
            onClick={() => navigator.share?.({ title: tool.name, url: window.location.href })}
            aria-label="Share this tool"
          >
            <Share2 size={15} /> Share
          </button>
        </div>
      </div>

      {/* Toolbar actions (Format, Copy, Download…) */}
      {toolbarActions && (
        <div className="toolbar-actions">
          {toolbarActions}
        </div>
      )}

      {/* Main content (editor, upload area, etc.) */}
      <div className="tool-content-area">
        {children}
      </div>

      {/* Footer */}
      <div className="tool-footer">
        <h3 className="tool-about-title">About {tool.name}</h3>
        <p className="text-secondary tool-about-desc">
          {about ||
            `This tool helps you ${tool.description.toLowerCase()} You can use it directly in your browser without sending data to our servers.`}
        </p>

        {related.length > 0 && (
          <>
            <h3 className="tool-related-title">Related Tools</h3>
            <div className="tool-related-list">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={r.route}
                  className="tool-related-tag"
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
