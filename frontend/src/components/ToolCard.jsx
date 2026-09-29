import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import '../styles/tool-card.css';

const ToolCard = ({ tool }) => {
  const IconComponent = Icons[tool.icon] || Icons.Wrench;

  return (
    <Link to={tool.route} className="card tool-card">
      <div className="tool-card-header">
        <div className="tool-card-icon">
          <IconComponent size={24} />
        </div>
        <h3 className="tool-card-title">{tool.name}</h3>
      </div>
      <p className="text-secondary tool-card-desc">
        {tool.description}
      </p>
      <div className="tool-card-link">
        Open <Icons.ArrowRight size={16} className="tool-card-link-icon" />
      </div>
    </Link>
  );
};

export default ToolCard;
