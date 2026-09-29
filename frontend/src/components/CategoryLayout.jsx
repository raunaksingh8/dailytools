import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';

const subcategoryIcon = (sub) => {
  if (sub.includes('JSON'))       return Icons.Braces;
  if (sub.includes('API'))        return Icons.Globe;
  if (sub.includes('SQL'))        return Icons.Database;
  if (sub.includes('Generator'))  return Icons.Zap;
  if (sub.includes('Security'))   return Icons.Shield;
  if (sub.includes('Encoding'))   return Icons.Binary;
  if (sub.includes('PDF'))        return Icons.FileText;
  if (sub.includes('Image'))      return Icons.Image;
  if (sub.includes('CSV'))        return Icons.FileSpreadsheet;
  if (sub.includes('Count'))      return Icons.Calculator;
  if (sub.includes('Format'))     return Icons.AlignLeft;
  if (sub.includes('Compare'))    return Icons.GitCompare;
  return Icons.Circle;
};

export const CategoryLayout = ({ category, title, description, toolsList }) => {
  const [search, setSearch] = useState('');
  const location = useLocation();

  const categoryTools = toolsList.filter((t) => t.category === category);
  const subcategories = [...new Set(categoryTools.map((t) => t.subcategory))];

  const filteredTools = search
    ? categoryTools.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : categoryTools;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="container"
      style={{ paddingTop: '2rem', paddingBottom: '4rem' }}
    >
      {/* ── Mobile: category jump dropdown (shown below 900px) ── */}
      <div
        className="category-mobile-nav"
        style={{ marginBottom: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Link
            to="/"
            style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Icons.ArrowLeft size={16} /> Back
          </Link>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.5rem' }}>{title}</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>{description}</p>
        </div>
      </div>

      {/* ── Layout: sidebar (lg) + main ── */}
      <div className="category-page-layout">

        {/* ── Desktop Sidebar (≥900px) ── */}
        <aside className="category-sidebar">
          <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.25rem' }}>
            <Icons.ArrowLeft size={16} /> Back to Home
          </Link>

          <nav>
            <Link to={`/${category.toLowerCase()}`} className="sidebar-link active">
              <Icons.LayoutGrid size={17} /> {category} Tools
            </Link>
            <div style={{ margin: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }} />
            {subcategories.map((sub) => {
              const Icon = subcategoryIcon(sub);
              const id = sub.replace(/\s+/g, '-').toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() => scrollToSection(id)}
                  className="sidebar-link"
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Icon size={17} /> {sub}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Mobile subcategory jump — shown only below 900px via CSS */}
          <div style={{ marginBottom: '1.25rem', display: 'none' }} className="mobile-jump">
            <select
              onChange={(e) => { if (e.target.value) scrollToSection(e.target.value); e.target.value = ''; }}
              defaultValue=""
              className="input-field"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Jump to section…</option>
              {subcategories.map((sub) => (
                <option key={sub} value={sub.replace(/\s+/g, '-').toLowerCase()}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Search within category */}
          <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: '420px' }}>
            <Icons.Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}…`}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={`Search ${title}`}
            />
          </div>

          {/* Tool sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {search ? (
              <section>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '1.25rem' }}>
                  Search Results{filteredTools.length === 0 ? ' — no matches' : ''}
                </h2>
                <div className="tool-grid-hz">
                  {filteredTools.map((tool) => {
                    const IconComp = Icons[tool.icon] || Icons.Wrench;
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
              </section>
            ) : (
              subcategories.map((sub) => {
                const toolsInSub = categoryTools.filter((t) => t.subcategory === sub);
                const id = sub.replace(/\s+/g, '-').toLowerCase();
                return (
                  <section key={sub} id={id} style={{ scrollMarginTop: '5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.125rem' }}>{sub}</h2>
                      <span className="text-accent" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {toolsInSub.length} tools
                      </span>
                    </div>
                    <div className="tool-grid-hz">
                      {toolsInSub.map((tool) => {
                        const IconComp = Icons[tool.icon] || Icons.Wrench;
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
                  </section>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Inject responsive rule for mobile-jump */}
      <style>{`
        @media (max-width: 899px) {
          .mobile-jump { display: block !important; }
          .category-mobile-nav h1, .category-mobile-nav p { display: block; }
        }
        @media (min-width: 900px) {
          .category-mobile-nav { display: none; }
        }
      `}</style>
    </div>
  );
};
