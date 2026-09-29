import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="container footer-top">
        <div>
          <div className="footer-brand">
            <span className="footer-brand-icon">⚡</span>
            DailyTools
          </div>
          <p className="text-secondary footer-desc">
            Simple, fast, free tools for developers, creators and everyday work.
          </p>
        </div>
        <div className="footer-links-wrapper">
          <div className="footer-section">
            <h4>Tools</h4>
            <div className="footer-links">
              <Link to="/developer">Developer</Link>
              <Link to="/files">Files</Link>
              <Link to="/text">Text</Link>
            </div>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <div className="footer-links">
              <Link to="#">Privacy</Link>
              <Link to="#">Terms</Link>
              <Link to="#">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        {/* © {new Date().getFullYear()} DailyTools. All rights reserved. */}
        <span>© DailyTools. All rights reserved.</span>
        <span className="footer-maintained">
          Developed and Maintained by Raunak Singh.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
