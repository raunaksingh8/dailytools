import React, { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { Copy, Trash2 } from 'lucide-react';
import '../../styles/word-counter.css';

const WordCounter = () => {
  const tool = tools.find(t => t.slug === 'word-counter');
  const [text, setText] = useState('');
  
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0
  });

  useEffect(() => {
    const textStr = text || '';
    
    // Words
    const words = textStr.trim() ? textStr.trim().split(/\s+/).length : 0;
    
    // Characters
    const characters = textStr.length;
    
    // Sentences
    const sentences = textStr.trim() ? textStr.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    
    // Paragraphs
    const paragraphs = textStr.trim() ? textStr.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
    
    // Reading Time (assuming 225 words per minute)
    const readingTime = Math.ceil(words / 225);

    setStats({ words, characters, sentences, paragraphs, readingTime });
  }, [text]);

  const toolbarActions = (
    <>
      <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(text)} title="Copy Text">
        <Copy size={16} /> Copy
      </button>
      <button className="btn-secondary" onClick={() => setText('')} title="Clear Text">
        <Trash2 size={16} /> Clear
      </button>
    </>
  );

  return (
    <ToolLayout tool={tool} toolbarActions={toolbarActions}>
      <div className="workspace-panel word-counter-panel">
        <div className="workspace-content word-counter-content">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="word-counter-textarea"
          />
        </div>
        
        {/* Stats Row */}
        <div className="word-counter-stats-row">
          <div>
            <div className="word-counter-stat-value">{stats.words}</div>
            <div className="word-counter-stat-label">Words</div>
          </div>
          <div>
            <div className="word-counter-stat-value">{stats.characters}</div>
            <div className="word-counter-stat-label">Characters</div>
          </div>
          <div>
            <div className="word-counter-stat-value">{stats.sentences}</div>
            <div className="word-counter-stat-label">Sentences</div>
          </div>
          <div>
            <div className="word-counter-stat-value">{stats.paragraphs}</div>
            <div className="word-counter-stat-label">Paragraphs</div>
          </div>
          <div>
            <div className="word-counter-stat-value">{stats.readingTime} min</div>
            <div className="word-counter-stat-label">Reading Time</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default WordCounter;
