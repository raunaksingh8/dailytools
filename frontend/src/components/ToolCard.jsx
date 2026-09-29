import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

const ToolCard = ({ tool }) => {
  const IconComponent = Icons[tool.icon] || Icons.Wrench;

  return (
    <Link to={tool.route} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ 
          backgroundColor: 'var(--accent-light)', 
          color: 'var(--accent-primary)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <IconComponent size={24} />
        </div>
        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{tool.name}</h3>
      </div>
      <p className="text-secondary" style={{ flex: 1, marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        {tool.description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 500, marginTop: 'auto' }}>
        Open <Icons.ArrowRight size={16} style={{ marginLeft: '0.25rem' }} />
      </div>
    </Link>
  );
};

export default ToolCard;
