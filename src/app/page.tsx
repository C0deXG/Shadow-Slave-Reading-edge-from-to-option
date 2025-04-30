/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import ePub from 'epubjs';
import ThemeProvider from './components/ThemeProvider';

// Constants for localStorage keys
const STORAGE_KEYS = {
  CONTENT: 'epubReaderContent',
  FROM: 'epubReaderFrom',
  TO: 'epubReaderTo',
  LAST_POSITION: 'epubReaderLastPosition'
};

export default function Home() {
  const [book, setBook] = useState<any>(null);
  const [spineItems, setSpineItems] = useState<any[]>([]);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [contentHTML, setContentHTML] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadChapters = useCallback(async () => {
    if (!book || !spineItems) {
      console.error('Book or spine items not initialized');
      return;
    }
    
    // Function to safely extract HTML content - moved inside useCallback to fix linting warning
    const extractContentHTML = (content: any): string => {
      if (!content) return '';
      
      try {
        // Try to get innerHTML from body
        if (content.body && content.body.innerHTML) {
          return content.body.innerHTML;
        }
        
        // Try to get from document.body if content is a document
        if (content.document && content.document.body) {
          return content.document.body.innerHTML;
        }
        
        // If content is already HTML string
        if (typeof content === 'string') {
          return content;
        }
        
        // If content has toString method, try that
        if (content.toString && typeof content.toString === 'function') {
          return content.toString();
        }
        
        // Fallback: Return empty string
        return '';
      } catch (e) {
        console.error('Error extracting HTML content:', e);
        return '';
      }
    };

    // Function to clean and structure HTML for better readability
    const structureHTML = (html: string): string => {
      const div = document.createElement('div');
      div.innerHTML = html;

      // Remove any script tags
      const scripts = div.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        scripts[i].remove();
      }

      // Remove existing titles/headers to prevent duplicates
      const existingTitles = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
      existingTitles.forEach(title => title.remove());

      // Convert divs to paragraphs where appropriate
      const divs = div.getElementsByTagName('div');
      for (let i = divs.length - 1; i >= 0; i--) {
        const div = divs[i];
        if (!div.querySelector('div, p')) {
          const p = document.createElement('p');
          p.innerHTML = div.innerHTML;
          div.parentNode?.replaceChild(p, div);
        }
      }

      return div.innerHTML;
    };
    
    // Clear existing content first
    setContentHTML('');
    
    // Small delay to ensure DOM is cleared
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let combinedHTML = `
      <article class="book-content" lang="en">
        <main class="book-main">
    `;
    console.log('Loading chapters from', from, 'to', to);

    // Initialize rendition if it doesn't exist
    if (!book.rendition) {
      try {
        // Create a hidden container for rendition
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
        container.style.width = '100%';
        container.style.height = '100px';
        document.body.appendChild(container);
        
        // Initialize rendition
        book.rendition = book.renderTo(container, {
          width: '100%',
          height: '100px',
          ignoreClass: 'epub-container'
        });
        
        await book.rendition.display();
        console.log('Rendition initialized successfully');
      } catch (error) {
        console.error('Failed to initialize rendition:', error);
      }
    }

    // Get all sections that need to be loaded
    const sectionsToLoad = [];
    for (let i = from; i <= to && i < spineItems.length; i++) {
      sectionsToLoad.push({
        index: i,
        item: spineItems[i]
      });
    }

    // Load each section from the EPUB
    for (const { index, item } of sectionsToLoad) {
      try {
        console.log(`Processing chapter ${index}:`, {
          href: item.href,
          title: item.title,
          label: item.label
        });

        let chapterHTML = '';
        let chapterTitle = item.title || item.label || `Chapter ${index + 1}`;

        // Method 1: Try using book.rendition.display() first
        try {
          if (book.rendition) {
            console.log(`Using rendition to display chapter ${index}`);
            const rendered = await book.rendition.display(item.href);
            
            if (rendered) {
              chapterHTML = extractContentHTML(rendered);
              console.log(`Successfully extracted content using rendition for chapter ${index}`);
            }
          }
        } catch (renditionError) {
          console.warn(`Rendition display failed for chapter ${index}:`, renditionError);
        }

        // Method 2: Try using direct spine access if rendition failed
        if (!chapterHTML) {
          try {
            console.log(`Using spine access for chapter ${index}`);
            const section = await book.spine.get(item.href);
            
            if (section) {
              const content = await section.load(book.load.bind(book));
              
              if (content) {
                chapterHTML = extractContentHTML(content);
                // Try to get title from content if not already set
                if (!chapterTitle && content.getElementsByTagName && content.getElementsByTagName('title').length > 0) {
                  chapterTitle = content.getElementsByTagName('title')[0].textContent || chapterTitle;
                }
                console.log(`Successfully extracted content using spine for chapter ${index}`);
              }
            }
          } catch (spineError) {
            console.warn(`Spine access failed for chapter ${index}:`, spineError);
          }
        }

        // Method 3: Try directly accessing the resource
        if (!chapterHTML) {
          try {
            console.log(`Using direct resource access for chapter ${index}`);
            const url = item.href;
            const data = await book.resources.load(url);
            
            if (data) {
              // Parse HTML string
              const parser = new DOMParser();
              const doc = parser.parseFromString(data, 'text/html');
              chapterHTML = doc.body.innerHTML;
              console.log(`Successfully extracted content using resource for chapter ${index}`);
            }
          } catch (resourceError) {
            console.warn(`Resource access failed for chapter ${index}:`, resourceError);
          }
        }

        // If we got content, add it to our combined HTML
        if (chapterHTML) {
          const structuredHTML = structureHTML(chapterHTML);
          const chapterNum = index + 1;
          
          combinedHTML += `
            <section class="chapter" id="chapter-${chapterNum}">
              <header>
                <h2>Chapter ${chapterNum}</h2>
              </header>
              <div class="chapter-content">
                ${structuredHTML}
              </div>
            </section>
          `;
          
          console.log(`Successfully processed chapter ${index}`);
        } else {
          console.error(`Failed to load content for chapter ${index} after trying all methods`);
        }
      } catch (error) {
        console.error(`Error processing chapter ${index}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    combinedHTML += `
        </main>
      </article>
    `;

    // Update state with new content
    setContentHTML(combinedHTML);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT, combinedHTML);
      localStorage.setItem(STORAGE_KEYS.FROM, from.toString());
      localStorage.setItem(STORAGE_KEYS.TO, to.toString());
      
      // Also save the current time to know when this content was cached
      localStorage.setItem(STORAGE_KEYS.LAST_POSITION, new Date().toISOString());
      
      console.log('Successfully saved content to localStorage for future visits');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [book, spineItems, from, to]);

  useEffect(() => {
    let mounted = true;
    
    async function initializeBook() {
      try {
        console.log('Loading EPUB file...');
        setIsLoading(true);
        
        // Add a small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialize book with explicit options for mobile and static deployments
        const b = ePub('/trimmed_book.epub', {
          openAs: 'epub',
          requestMethod: async (url: string) => {
            try {
              // First try to load from the static deployment path
              const staticPath = url.startsWith('/') ? url : `/${url}`;
              const response = await fetch(staticPath);
              if (response.ok) {
                return response.blob();
              }
              // Fallback to relative path
              const fallbackResponse = await fetch(url);
              return fallbackResponse.blob();
            } catch (error) {
              console.error('Error loading resource:', error);
              // Try one more time with the full URL
              const fullUrl = new URL(url, window.location.href).href;
              const finalResponse = await fetch(fullUrl);
              return finalResponse.blob();
            }
          },
          requestCredentials: 'same-origin'
        } as any);

        // Wait for book to be ready
        await b.ready;
        
        if (!mounted) return;
        
        console.log('EPUB loaded, processing spine...');
        setBook(b);

        // Get spine items with retry mechanism
        let items;
        try {
          items = (b.spine as any).spineItems;
          if (!items || items.length === 0) {
            // Try alternative method
            items = await b.loaded.spine;
          }
        } catch (error) {
          console.error('Error getting spine items:', error);
          items = [];
        }
        
        if (!items || items.length === 0) {
          throw new Error('No spine items found in the EPUB file');
        }

        console.log(`Found ${items.length} chapters`);
        setSpineItems(items);
        
        // Load saved state or set defaults
        const savedHTML = localStorage.getItem(STORAGE_KEYS.CONTENT);
        const savedFrom = localStorage.getItem(STORAGE_KEYS.FROM);
        const savedTo = localStorage.getItem(STORAGE_KEYS.TO);

        if (savedHTML && savedFrom && savedTo) {
          console.log('Loading saved state from localStorage');
          setContentHTML(savedHTML);
          setFrom(savedFrom ? parseInt(savedFrom) : 0);
          setTo(savedTo ? parseInt(savedTo) : 0);
        } else {
          console.log('No saved state, loading first two chapters by default');
          const defaultFrom = 0;
          const defaultTo = Math.min(1, items.length - 1);
          
          setFrom(defaultFrom);
          setTo(defaultTo);
          
          // Load initial chapters immediately
          loadChapters();
        }
      } catch (err) {
        console.error('Error initializing book:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeBook();

    return () => {
      mounted = false;
    };
  }, [loadChapters]);

  // Save the current state to localStorage when component unmounts or tab is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (contentHTML) {
          localStorage.setItem(STORAGE_KEYS.CONTENT, contentHTML);
          localStorage.setItem(STORAGE_KEYS.FROM, from.toString());
          localStorage.setItem(STORAGE_KEYS.TO, to.toString());
          localStorage.setItem(STORAGE_KEYS.LAST_POSITION, new Date().toISOString());
        }
      } catch (e) {
        console.error('Error saving state before unload:', e);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Also save when component unmounts
    };
  }, [contentHTML, from, to]);

  return (
    <div className="epub-reader" lang="en">
      <header className="reader-header">
        <h1 className="sr-only">eBook Reader</h1>
      </header>
      {isLoading ? (
        <div className="loading-indicator">Loading book...</div>
      ) : (
        <ThemeProvider
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          spineItems={spineItems}
          onLoadChapters={loadChapters}
        >
          <main 
            className="reader-main"
            role="main"
            aria-label="Book content"
          >
            <article 
              className="reader-content"
              role="article"
            >
              <div
                key={`content-${from}-${to}`}
                className="reading-area"
                lang="en"
                role="document"
                aria-label="Current chapter content"
                dangerouslySetInnerHTML={{ __html: contentHTML }}
              />
            </article>
          </main>
        </ThemeProvider>
      )}
    </div>
  );
}

// Changed from edge to nodejs runtime to help with Vercel deployment
export const dynamic = 'force-static';