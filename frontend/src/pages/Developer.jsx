import React from 'react';
import { tools } from '../data/tools';
import { CategoryLayout } from '../components/CategoryLayout';

const Developer = () => {
  return (
    <CategoryLayout 
      category="Developer" 
      title="Developer Tools" 
      description="Fast utilities for coding, APIs, data and debugging." 
      toolsList={tools}
    />
  );
};

export default Developer;
