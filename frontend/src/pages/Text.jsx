import React from 'react';
import { tools } from '../data/tools';
import { CategoryLayout } from '../components/CategoryLayout';

const Text = () => {
  return (
    <CategoryLayout 
      category="Text" 
      title="Text Tools" 
      description="Simple tools for text analysis, formatting and conversion." 
      toolsList={tools}
    />
  );
};

export default Text;
