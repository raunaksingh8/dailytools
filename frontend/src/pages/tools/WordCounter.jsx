import React, { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { tools } from '../../data/tools';
import { Copy, Trash2 } from 'lucide-react';

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
      <div className="workspace-panel" style={{ height: 'auto', minHeight: '400px' }}>
        <div className="workspace-content" style={{ padding: 0 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            style={{ 
              fontFamily: 'var(--font-sans)', 
              fontSize: '1rem',
              padding: '1.5rem',
              border: 'none',
              minHeight: '300px'
            }}
          />
        </div>
        
        {/* Stats Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
          gap: '1rem', 
          borderTop: '1px solid var(--border-color)',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-hover)',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.words}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Words</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.characters}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Characters</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.sentences}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sentences</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.paragraphs}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Paragraphs</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.readingTime} min</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Reading Time</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default WordCounter;
