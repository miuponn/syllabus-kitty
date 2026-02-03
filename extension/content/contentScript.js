/**
 * Syllabus Kitty Extension - Content Script
 * Extracts text content from web pages
 */

(function() {
  'use strict';
  
  /**
   * Clean and normalize text
   */
  function cleanText(text) {
    if (!text) return '';
    
    return text
      // Normalize whitespace
      .replace(/[\t\r]+/g, ' ')
      // Replace multiple newlines with double newline
      .replace(/\n{3,}/g, '\n\n')
      // Replace multiple spaces with single space
      .replace(/ {2,}/g, ' ')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Trim overall
      .trim();
  }
  
  /**
   * Extract text from main content areas
   */
  function extractMainContent() {
    // Priority selectors for main content
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.syllabus',
      '.course-content',
      '.document-content'
    ];
    
    // Try to find main content area
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 100) {
        return cleanText(element.textContent);
      }
    }
    
    // Fallback to body, excluding navigation and footer
    return extractFromBody();
  }
  
  /**
   * Extract from body with exclusions
   */
  function extractFromBody() {
    // Clone body to avoid modifying the page
    const clone = document.body.cloneNode(true);
    
    // Remove elements that typically don't contain useful content
    const removeSelectors = [
      'script',
      'style',
      'noscript',
      'nav',
      'header',
      'footer',
      'aside',
      '.nav',
      '.navigation',
      '.sidebar',
      '.menu',
      '.ads',
      '.advertisement',
      '.cookie-banner',
      '.popup',
      '.modal'
    ];
    
    removeSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    return cleanText(clone.textContent);
  }
  
  /**
   * Extract structured data if available
   */
  function extractStructuredData() {
    const data = {
      title: document.title || '',
      url: window.location.href,
      headings: [],
      lists: [],
      tables: []
    };
    
    // Extract headings
    document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      const text = h.textContent.trim();
      if (text) {
        data.headings.push({
          level: parseInt(h.tagName[1]),
          text: text
        });
      }
    });
    
    // Extract lists
    document.querySelectorAll('ul, ol').forEach(list => {
      const items = Array.from(list.querySelectorAll('li'))
        .map(li => li.textContent.trim())
        .filter(text => text.length > 0);
      
      if (items.length > 0) {
        data.lists.push(items);
      }
    });
    
    // Extract tables
    document.querySelectorAll('table').forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td, th'))
          .map(cell => cell.textContent.trim());
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      if (rows.length > 0) {
        data.tables.push(rows);
      }
    });
    
    return data;
  }
  
  /**
   * Check if page contains syllabus-like content
   */
  function detectSyllabusContent() {
    const pageText = document.body.textContent.toLowerCase();
    
    const syllabusIndicators = [
      'syllabus',
      'course outline',
      'course schedule',
      'learning objectives',
      'course objectives',
      'grading policy',
      'attendance policy',
      'required textbook',
      'office hours',
      'instructor:',
      'professor:',
      'prerequisites',
      'course description',
      'assignments',
      'final exam',
      'midterm'
    ];
    
    const matchedIndicators = syllabusIndicators.filter(
      indicator => pageText.includes(indicator)
    );
    
    return {
      isSyllabus: matchedIndicators.length >= 3,
      confidence: Math.min(matchedIndicators.length / 5, 1),
      matchedTerms: matchedIndicators
    };
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
      try {
        const mainText = extractMainContent();
        const structured = extractStructuredData();
        const detection = detectSyllabusContent();
        
        sendResponse({
          success: true,
          data: {
            text: mainText,
            title: structured.title,
            url: structured.url,
            structured: structured,
            detection: detection,
            charCount: mainText.length,
            wordCount: mainText.split(/\s+/).filter(w => w).length
          }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
    }
    
    if (request.action === 'getPageInfo') {
      const isPdf = document.contentType === 'application/pdf';
      
      const embeddedPdf = document.querySelector(
        'embed[type="application/pdf"], ' +
        'object[type="application/pdf"], ' +
        'iframe[src*=".pdf"]'
      );
      const embeddedPdfUrl = embeddedPdf?.src || embeddedPdf?.data || null;
      
      sendResponse({
        title: document.title,
        url: window.location.href,
        isPdf: isPdf,
        isEmbeddedPdf: !!embeddedPdfUrl,
        embeddedPdfUrl: embeddedPdfUrl,
        contentType: document.contentType,
        hasContent: document.body.textContent.trim().length > 100
      });
    }
    
    // Handle highlight request from popup
    if (request.action === 'highlightText') {
      highlightExtractedText(request.text);
      sendResponse({ success: true });
    }
    
    // Handle clear highlights request
    if (request.action === 'clearHighlights') {
      clearHighlights();
      sendResponse({ success: true });
    }
    
    // Return true to indicate async response
    return true;
  });

  /**
   * Inject highlight styles into the page
   */
  function injectHighlightStyles() {
    if (document.getElementById('syllabus-kitty-highlight-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'syllabus-kitty-highlight-styles';
    style.textContent = `
      .syllabus-kitty-highlight {
        background-color: rgba(255, 209, 102, 0.4) !important;
        border-bottom: 2px solid #ffd166 !important;
        padding: 1px 2px !important;
        border-radius: 2px !important;
        transition: background-color 0.2s ease !important;
      }
      .syllabus-kitty-highlight:hover {
        background-color: rgba(255, 209, 102, 0.6) !important;
      }
      .syllabus-kitty-highlight-first {
        animation: syllabus-kitty-pulse 2s ease-in-out !important;
      }
      @keyframes syllabus-kitty-pulse {
        0%, 100% { background-color: rgba(255, 209, 102, 0.4); }
        50% { background-color: rgba(255, 209, 102, 0.8); }
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Highlight extracted text on the page
   * @param {string} textToHighlight - Text that was extracted
   */
  function highlightExtractedText(textToHighlight) {
    if (!textToHighlight || textToHighlight.length < 50) return;
    
    // Inject styles first
    injectHighlightStyles();
    
    // Clear any existing highlights
    clearHighlights();
    
    // Extract meaningful phrases/sentences to highlight
    // Get all sentences/paragraphs with substantial content
    const phrases = textToHighlight
      .split(/[.!?]\s+|\n\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 30)
      .map(s => s.substring(0, 150)); // Limit match length for performance
    
    let firstHighlight = null;
    let highlightCount = 0;
    const maxHighlights = 100; // Increased from 10
    
    for (const phrase of phrases) {
      if (highlightCount >= maxHighlights) break;
      if (phrase.length < 30) continue;
      
      // Create a search snippet (first 60 chars for matching)
      const searchSnippet = phrase.substring(0, 60);
      
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue.includes(searchSnippet)) {
          // Found a match - wrap in highlight span
          const span = document.createElement('span');
          span.className = 'syllabus-kitty-highlight';
          if (!firstHighlight) {
            span.classList.add('syllabus-kitty-highlight-first');
            firstHighlight = span;
          }
          
          try {
            const parent = node.parentNode;
            if (parent && !parent.classList?.contains('syllabus-kitty-highlight')) {
              parent.insertBefore(span, node);
              span.appendChild(node);
              highlightCount++;
            }
          } catch (e) {
            // Ignore DOM manipulation errors
          }
          break;
        }
      }
    }
    
    // Scroll to first highlight
    if (firstHighlight) {
      firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    console.log(`🐱 Syllabus Kitty: Highlighted ${highlightCount} sections of extracted content`);
  }
  
  // Clear all highlights from the page
  function clearHighlights() {
    document.querySelectorAll('.syllabus-kitty-highlight').forEach(el => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      parent.normalize();
    });
  }
  
  // Set up listener for text selection changes
  function setupSelectionListener() {
    let debounceTimer = null;
    
    document.addEventListener('selectionchange', () => {
      // Debounce to avoid excessive messages
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const selection = window.getSelection().toString().trim();
        
        // Only notify if meaningful selection (> 100 chars, likely syllabus content)
        if (selection.length > 100) {
          chrome.runtime.sendMessage({
            type: 'SELECTION_CHANGED',
            text: selection,
            url: window.location.href,
            title: document.title
          }).catch(() => {
          });
        }
      }, 300); // 300ms debounce
    });
  }
  
  // Initialize selection listener
  setupSelectionListener();
  
  // Log that content script is loaded (for debugging)
  console.log('🐱 Syllabus Kitty content script loaded');
})();
