import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import '../styles/category-layout.css';

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
    <div className="container category-page-container">
      {/* ── Mobile: category jump dropdown (shown below 900px) ── */}
      <div className="category-mobile-nav">
        <div className="category-back-link-wrapper">
          <Link to="/" className="category-back-link">
            <Icons.ArrowLeft size={16} /> Back
          </Link>
        </div>

        <div className="category-mobile-header">
          <h1 className="category-mobile-title">{title}</h1>
          <p className="text-secondary category-mobile-desc">{description}</p>
        </div>
      </div>

      {/* ── Layout: sidebar (lg) + main ── */}
      <div className="category-page-layout">

        {/* ── Desktop Sidebar (≥900px) ── */}
        <aside className="category-sidebar">
          <Link to="/" className="category-sidebar-back">
            <Icons.ArrowLeft size={16} /> Back to Home
          </Link>

          <nav>
            <Link to={`/${category.toLowerCase()}`} className="sidebar-link active">
              <Icons.LayoutGrid size={17} /> {category} Tools
            </Link>
            <div className="category-sidebar-divider" />
            {subcategories.map((sub) => {
              const Icon = subcategoryIcon(sub);
              const id = sub.replace(/\s+/g, '-').toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() => scrollToSection(id)}
                  className="sidebar-link category-sidebar-btn"
                >
                  <Icon size={17} /> {sub}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="category-main-content">

          {/* Mobile subcategory jump — shown only below 900px via CSS */}
          <div className="mobile-jump">
            <select
              onChange={(e) => { if (e.target.value) scrollToSection(e.target.value); e.target.value = ''; }}
              defaultValue=""
              className="input-field mobile-jump-select"
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
          <div className="category-search-wrapper">
            <Icons.Search size={16} className="category-search-icon" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}…`}
              className="input-field category-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={`Search ${title}`}
            />
          </div>

          {/* Tool sections */}
          <div className="category-sections-wrapper">
            {search ? (
              <section>
                <h2 className="category-search-results-title">
                  Search Results{filteredTools.length === 0 ? ' — no matches' : ''}
                </h2>
                <div className="tool-grid-hz">
                  {filteredTools.map((tool) => {
                    const IconComp = Icons[tool.icon] || Icons.Wrench;
                    return (
                      <Link key={tool.slug} to={tool.route} className="tool-card-hz">
                        <div className="home-search-icon">
                          <IconComp size={20} />
                        </div>
                        <div className="category-search-text-wrapper">
                          <h4 className="home-search-item-title">{tool.name}</h4>
                          <p className="text-secondary home-search-item-desc">{tool.description}</p>
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
                  <section key={sub} id={id} className="subcategory-section">
                    <div className="subcategory-header">
                      <h2 className="subcategory-title">{sub}</h2>
                      <span className="text-accent subcategory-count">
                        {toolsInSub.length} tools
                      </span>
                    </div>
                    <div className="tool-grid-hz">
                      {toolsInSub.map((tool) => {
                        const IconComp = Icons[tool.icon] || Icons.Wrench;
                        return (
                          <Link key={tool.slug} to={tool.route} className="tool-card-hz">
                            <div className="home-search-icon">
                              <IconComp size={20} />
                            </div>
                            <div className="category-search-text-wrapper">
                              <h4 className="home-search-item-title">{tool.name}</h4>
                              <p className="text-secondary home-search-item-desc">{tool.description}</p>
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
    </div>
  );
};
