import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Code2, File, Search } from 'lucide-react';
import { tools } from '../data/tools';
import ToolCard from '../components/ToolCard';
import '../styles/home.css';

const Home = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const navigate = useNavigate();

  const rotatingPhrases = [
    'digital work',
    'creative work',
    'technical work',
    'online work',
    'daily work',
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseVisible(false);

      setTimeout(() => {
        setPhraseIndex(
          (prev) => (prev + 1) % rotatingPhrases.length
        );
        setPhraseVisible(true);
      }, 300);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const fd = new FormData(e.target);
    const query = fd.get('q');

    if (query) {
      navigate(`/?q=${encodeURIComponent(query)}`);
    }
  };

  const filteredTools = q
    ? tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.description.toLowerCase().includes(q.toLowerCase()) ||
        t.category.toLowerCase().includes(q.toLowerCase()) ||
        t.tags.some((tag) =>
          tag.toLowerCase().includes(q.toLowerCase())
        )
    )
    : [];

  const popularTools = tools.slice(0, 6);

  /* ── Search Results Page ── */
  if (q) {
    return (
      <div className="container home-search-results">
        <h2 className="home-search-title">
          Search results for &ldquo;{q}&rdquo;
        </h2>

        <p className="text-secondary home-search-subtitle">
          Found {filteredTools.length} tools.
        </p>

        <div className="tool-grid-hz">
          {filteredTools.map((tool) => {
            const IconComp = Icons[tool.icon] || Code2;

            return (
              <Link
                key={tool.slug}
                to={tool.route}
                className="tool-card-hz"
              >
                <div className="home-search-icon">
                  <IconComp size={20} />
                </div>

                <div className="home-search-text-wrapper">
                  <h4 className="home-search-item-title">
                    {tool.name}
                  </h4>

                  <p className="text-secondary home-search-item-desc">
                    {tool.description}
                  </p>
                </div>
              </Link>
            );
          })}

          {filteredTools.length === 0 && (
            <p className="text-secondary">
              No tools matched your search.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Main Homepage ── */
  return (
    <div className="home-container">

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="container hero-grid">

          {/* Text */}
          <div className="hero-text-container">

            <div className="hero-badge">
              ✦ Free • No Signup • Privacy First
            </div>

            <h1 className="responsive-hero-text">
              Simple tools for <br />

              <span className="hero-everyday-line">
                everyday{' '}
                <span
                  className={`hero-text-highlight hero-rotating-phrase ${phraseVisible
                    ? 'phrase-visible'
                    : 'phrase-hidden'
                    }`}
                >
                  {rotatingPhrases[phraseIndex]}.
                </span>
              </span>
            </h1>

            <p className="hero-desc">
              Fast, free tools for developers, creators and everyone.
              <br />
              No signup. Your data stays on your device.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="hero-search-form"
            >
              <Search
                size={18}
                className="hero-search-icon"
              />

              <input
                type="text"
                name="q"
                placeholder="What do you need to do?"
                className="hero-search-input"
              />

              <button
                type="submit"
                className="hero-search-button"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Hero decorative shapes */}
          <div className="hidden lg-block hero-icons-container">

            <div className="hero-icon-box hero-icon-1">
              <Code2
                size={44}
                color="white"
              />
            </div>

            <div className="hero-icon-box hero-icon-2">
              <File
                size={52}
                color="white"
              />
            </div>

            <div className="hero-icon-box hero-icon-3">
              <span>Aa</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── Category Cards ── */}
      <section className="categories-section">
        <div className="container">

          <h2 className="categories-title">
            Explore by Category
          </h2>

          <div className="categories-grid">

            <Link
              to="/developer"
              className="card category-card"
            >
              <div className="category-icon-wrapper category-icon-developer">
                <Code2
                  size={44}
                  strokeWidth={1.5}
                />
              </div>

              <h3 className="category-card-title">
                Developer Tools
              </h3>

              <p className="text-secondary category-card-desc">
                JSON, encoding, generators, API tools and more.
              </p>

              <span className="text-accent category-card-link">
                {tools.filter(
                  (t) => t.category === 'Developer'
                ).length}
                + tools →
              </span>
            </Link>

            <Link
              to="/files"
              className="card category-card"
            >
              <div className="category-icon-wrapper category-icon-files">
                <File
                  size={44}
                  strokeWidth={1.5}
                />
              </div>

              <h3 className="category-card-title">
                File Tools
              </h3>

              <p className="text-secondary category-card-desc">
                PDF, image, CSV and other file utilities.
              </p>

              <span className="text-accent category-card-link">
                {tools.filter(
                  (t) => t.category === 'Files'
                ).length}
                + tools →
              </span>
            </Link>

            <Link
              to="/text"
              className="card category-card"
            >
              <div className="category-icon-wrapper category-icon-text">
                <span>Aa</span>
              </div>

              <h3 className="category-card-title">
                Text Tools
              </h3>

              <p className="text-secondary category-card-desc">
                Word counter, formatters, converters and more.
              </p>

              <span className="text-accent category-card-link">
                {tools.filter(
                  (t) => t.category === 'Text'
                ).length}
                + tools →
              </span>
            </Link>

          </div>
        </div>
      </section>

      {/* ── Popular Tools ── */}
      <section className="popular-section">
        <div className="container">

          <div className="popular-header">
            <h2 className="popular-title">
              Popular Tools
            </h2>

            <Link
              to="/developer"
              className="text-accent popular-link"
            >
              View all →
            </Link>
          </div>

          <div className="tool-grid-hz">
            {popularTools.map((tool) => {
              const IconComp =
                Icons[tool.icon] || Code2;

              return (
                <Link
                  key={tool.slug}
                  to={tool.route}
                  className="tool-card-hz"
                >
                  <div className="home-search-icon">
                    <IconComp size={20} />
                  </div>

                  <div className="home-search-text-wrapper">
                    <h4 className="home-search-item-title">
                      {tool.name}
                    </h4>

                    <p className="text-secondary home-search-item-desc">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;