import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: '3rem 0', marginTop: 'auto' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}>⚡</span>
            DailyTools
          </div>
          <p className="text-secondary" style={{ maxWidth: '300px' }}>
            Simple, fast, free tools for developers, creators and everyday work.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Tools</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Link to="/developer">Developer</Link>
              <Link to="/files">Files</Link>
              <Link to="/text">Text</Link>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Link to="#">Privacy</Link>
              <Link to="#">Terms</Link>
              <Link to="#">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        © {new Date().getFullYear()} DailyTools. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
