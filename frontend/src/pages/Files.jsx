import React from 'react';
import { tools } from '../data/tools';
import { CategoryLayout } from '../components/CategoryLayout';

const Files = () => {
  return (
    <CategoryLayout 
      category="Files" 
      title="File Tools" 
      description="Tools for working with PDFs, images and data files." 
      toolsList={tools}
    />
  );
};

export default Files;
