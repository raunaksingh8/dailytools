import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';

export const CategoryLayout = ({ category, title, description, toolsList }) => {
  const [search, setSearch] = useState('');
  const location = useLocation();
  
  const categoryTools = toolsList.filter(t => t.category === category);
  
  // Group by subcategory
  const subcategories = [...new Set(categoryTools.map(t => t.subcategory))];

  const filteredTools = search ? categoryTools.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  ) : categoryTools;

  return (
    <div className="container" style={{ padding: '2rem 0 4rem 0', display: 'flex', gap: '3rem' }}>
      
      {/* Left Sidebar */}
      <aside className="hidden md-block" style={{ width: '250px', flexShrink: 0 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Icons.ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <Link to={`/${category.toLowerCase()}`} className="sidebar-link active">
            <Icons.LayoutGrid size={18} /> {category} Tools
          </Link>
          
          <div style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)' }}></div>
          
          {subcategories.map(sub => {
            // Assign a default icon based on subcategory name roughly
            let Icon = Icons.Circle;
            if (sub.includes('JSON')) Icon = Icons.Braces;
            if (sub.includes('API')) Icon = Icons.Globe;
            if (sub.includes('SQL')) Icon = Icons.Database;
            if (sub.includes('Generator')) Icon = Icons.Zap;
            if (sub.includes('Security')) Icon = Icons.Shield;
            if (sub.includes('Encoding')) Icon = Icons.Binary;
            
            if (sub.includes('PDF')) Icon = Icons.FileText;
            if (sub.includes('Image')) Icon = Icons.Image;
            if (sub.includes('CSV')) Icon = Icons.FileSpreadsheet;
            
            if (sub.includes('Count')) Icon = Icons.Calculator;
            if (sub.includes('Format')) Icon = Icons.AlignLeft;
            if (sub.includes('Compare')) Icon = Icons.GitCompare;
            
            return (
              <a key={sub} href={`#${sub.replace(/\s+/g, '-').toLowerCase()}`} className="sidebar-link">
                <Icon size={18} /> {sub}
              </a>
            );
          })}
        </nav>
      </aside>
      
      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>{title}</h1>
          <p className="text-secondary" style={{ fontSize: '1rem' }}>{description}</p>
        </div>
        
        <div style={{ marginBottom: '3rem', position: 'relative', maxWidth: '400px' }}>
          <Icons.Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
          <input 
            type="text" 
            placeholder={`Search ${title.toLowerCase()}...`}
            className="input-field"
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {search ? (
            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Search Results</h2>
              <div className="tool-grid-hz">
                {filteredTools.map(tool => {
                  const IconComp = Icons[tool.icon] || Icons.Wrench;
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
                {filteredTools.length === 0 && <p className="text-secondary">No tools found.</p>}
              </div>
            </section>
          ) : (
            subcategories.map(sub => {
              const toolsInSub = categoryTools.filter(t => t.subcategory === sub);
              return (
                <section key={sub} id={sub.replace(/\s+/g, '-').toLowerCase()} style={{ scrollMarginTop: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>{sub}</h2>
                    <span className="text-accent" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>View all →</span>
                  </div>
                  <div className="tool-grid-hz">
                    {toolsInSub.map(tool => {
                      const IconComp = Icons[tool.icon] || Icons.Wrench;
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
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
