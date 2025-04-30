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

  useEffect(() => {
    try {
      console.log('Loading EPUB file...');
      // Use custom options to better handle non-standard EPUB files
      const b = ePub('/trimmed_book.epub');
      setBook(b);

      b.ready.then(() => {
        try {
          console.log('EPUB loaded, processing spine...');
          const items = (b.spine as any).spineItems;
          console.log('Spine items:', items);
          
          if (items && items.length > 0) {
            console.log(`Found ${items.length} chapters`);
            setSpineItems(items);
            
            // Load from localStorage if available, otherwise use defaults
            const savedHTML = localStorage.getItem(STORAGE_KEYS.CONTENT);
            const savedFrom = localStorage.getItem(STORAGE_KEYS.FROM);
            const savedTo = localStorage.getItem(STORAGE_KEYS.TO);

            if (savedHTML) {
              console.log('Loading saved state from localStorage');
              setContentHTML(savedHTML);
              setFrom(savedFrom ? parseInt(savedFrom) : 0);
              setTo(savedTo ? parseInt(savedTo) : 0);
            } else {
              // Set default values if no saved state
              console.log('No saved state, using defaults');
              setFrom(0);
              setTo(items.length > 0 ? Math.min(2, items.length - 1) : 0); // Default to first 3 chapters or less
            }
          } else {
            console.error('No spine items found in the EPUB file');
          }
        } catch (err) {
          console.error('Error processing spine:', err);
        }
      }).catch(err => {
        console.error('EPUB ready promise failed:', err);
      });
    } catch (err) {
      console.error('Error loading EPUB file:', err);
    }
  }, []);

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
    
    // Clear existing content first
    setContentHTML('');
    
    // Small delay to ensure DOM is cleared
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let combinedHTML = '';
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
        let chapterTitle = item.title || item.label || ``;

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
          const formattedTitle = `<h2 class="chapter-title">${chapterTitle}</h2>`;
          
          combinedHTML += `
            <div class="chapter" data-chapter="${index}">
              ${formattedTitle}
              ${chapterHTML}
            </div>
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
    <div className="min-h-screen" role="main">
      <ThemeProvider
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        spineItems={spineItems}
        onLoadChapters={loadChapters}
      >
        <div
          key={`content-${from}-${to}`}
          className="reading-area"
          role="article"
          aria-live="polite"
          aria-atomic="true"
          dangerouslySetInnerHTML={{ __html: contentHTML }}
        />
      </ThemeProvider>
    </div>
  );
}

export const dynamic = 'force-static';
export const runtime = 'edge';