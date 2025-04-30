'use client';

import { useState, useEffect } from 'react';

interface SpineItem {
  label?: string;
  title?: string;
  href?: string;
}

export default function ThemeProvider({
  children,
  from,
  to,
  onFromChange,
  onToChange,
  spineItems = [],
  onLoadChapters
}: {
  children: React.ReactNode;
  from: number;
  to: number;
  onFromChange: (value: number) => void;
  onToChange: (value: number) => void;
  spineItems: SpineItem[];
  onLoadChapters: () => void;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [isExactBreakpoint, setIsExactBreakpoint] = useState(false);

  // Apply the theme when component mounts and manage dark mode
  useEffect(() => {
    setMounted(true);
    // Get saved theme or use system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Apply theme to document
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Set initial screen width
    setScreenWidth(window.innerWidth);
    setIsExactBreakpoint(window.innerWidth === 767);

    // Listen for window resize events
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsExactBreakpoint(width === 767);
      
      // Auto-expand on larger screens, collapse on smaller ones
      if (width >= 768) {
        setIsExpanded(true);
      } else if (width < 768) {
        // At the problematic breakpoint or smaller, ensure controls are in mobile state
        setIsExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Toggle dark class on document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle expanded view on mobile
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!mounted) return null;

  // Determine if we're on mobile or desktop view
  const isMobile = screenWidth < 768;

  return (
    <>
      {children}
      <nav className={`reading-controls ${theme === 'dark' ? 'dark-mode' : ''} ${isExpanded ? 'expanded' : ''} ${isExactBreakpoint ? 'exact-breakpoint' : ''}`}>
        <div className="controls-header">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
          
          {/* Show the expand toggle on mobile and at the problematic breakpoint */}
          {(isMobile || isExactBreakpoint) && (
            <button 
              className="expand-toggle" 
              onClick={toggleExpanded}
              aria-label="Toggle controls"
            >
              {isExpanded ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </button>
          )}
        </div>
        
        <div className="controls-content">
          <div className="chapter-controls">
            {spineItems.length === 0 ? (
              <div className="loading-message">Loading chapters...</div>
            ) : (
              <>
                <div className="select-wrap">
                  <label htmlFor="from-chapter">From:</label>
                  <select
                    id="from-chapter"
                    value={from}
                    onChange={(e) => onFromChange(parseInt(e.target.value))}
                    className="chapter-select"
                    disabled={!spineItems.length}
                  >
                    {spineItems.map((_, i) => {
                      const chapterLabel = i < 2 ? 'Info' : `${1098 + i}`; // Start at 1100 for chapter 3
                      return (
                        <option key={i} value={i}>{chapterLabel}</option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="select-wrap">
                  <label htmlFor="to-chapter">To:</label>
                  <select
                    id="to-chapter"
                    value={to}
                    onChange={(e) => onToChange(parseInt(e.target.value))}
                    className="chapter-select"
                    disabled={!spineItems.length}
                  >
                    {spineItems.map((_, i) => {
                      const chapterLabel = i < 2 ? 'Info' : `${1098 + i}`; // Start at 1100 for chapter 3
                      return (
                        <option key={i} value={i}>{chapterLabel}</option>
                      );
                    })}
                  </select>
                </div>
              </>
            )}
          </div>
          
          <button 
            onClick={onLoadChapters}
            className="load-button"
            disabled={!spineItems.length}
            aria-label="Load chapters"
          >
            Load
          </button>
        </div>
      </nav>
    </>
  );
} 