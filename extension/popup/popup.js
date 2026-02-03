import { 
  extractContent,
  simplifyContent,
  translateContent,
  addToCalendar,
  downloadPdf,
  getSupportedLanguages,
  openInApp
} from '../background/apiClient.js';

import { log } from '../shared/logger.js';

const State = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  SIMPLIFYING: 'simplifying',
  TRANSLATING: 'translating',
  ADDING_TO_CALENDAR: 'adding',
  GENERATING_PDF: 'generating',
  SUCCESS: 'success',
  ERROR: 'error'
};

let currentState = State.IDLE;
let extractedData = null;
let importedId = null;
let importResult = null;
let syllabusData = null;
let calendarEvents = null;
let simplifiedMarkdown = null;
let translatedMarkdown = null;
let currentLanguage = 'en';
let currentPreviewType = 'original'; 
let previewHistory = [];
let supportedLanguages = {};
let currentPageUrl = null;
let currentTabId = null;

// Storage key for session persistence (per tab URL)
const STORAGE_KEY_PREFIX = 'syllabusKitty_session_';

// DOM Elements
const elements = {
  mascot: document.getElementById('mascot'),
  statusCard: document.getElementById('statusCard'),
  statusIcon: document.getElementById('statusIcon'),
  statusTitle: document.getElementById('statusTitle'),
  statusDescription: document.getElementById('statusDescription'),
  pageInfo: document.getElementById('pageInfo'),
  pageTypeBadge: document.getElementById('pageTypeBadge'),
  pageTypeText: document.getElementById('pageTypeText'),
  pageTitle: document.getElementById('pageTitle'),
  // Action toolbar (shown after detection)
  actionToolbar: document.getElementById('actionToolbar'),
  simplifyBtn: document.getElementById('simplifyBtn'),
  translateBtn: document.getElementById('translateBtn'),
  translateDropdown: document.getElementById('translateDropdown'),
  languageSelect: document.getElementById('languageSelect'),
  resetBtn: document.getElementById('resetBtn'),
  // Preview section
  previewSection: document.getElementById('previewSection'),
  previewToggle: document.getElementById('previewToggle'),
  previewContent: document.getElementById('previewContent'),
  previewText: document.getElementById('previewText'),
  previewTypeLabel: document.getElementById('previewTypeLabel'),
  charCount: document.getElementById('charCount'),
  wordCount: document.getElementById('wordCount'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  // Main action buttons
  detectBtn: document.getElementById('detectBtn'),
  addToCalendarBtn: document.getElementById('addToCalendarBtn'),
  clearDetectionBtn: document.getElementById('clearDetectionBtn'),
  openAppBtn: document.getElementById('openAppBtn'),
  // Error handling
  errorMessage: document.getElementById('errorMessage'),
  errorText: document.getElementById('errorText'),
  retryBtn: document.getElementById('retryBtn')
};

// Initialize popup
async function init() {
  log('Popup initialized');

  // Load supported languages for dropdown
  try {
    const langResult = await getSupportedLanguages();
    supportedLanguages = langResult.languages || {};
    populateLanguageDropdown();
  } catch (e) {
    log('Failed to load languages:', e);
  }

  // Setup event listeners
  setupEventListeners();

  // Setup listener for selection changes from content script
  setupSelectionListener();

  // Get basic page info (title, URL)
  await getPageInfo();

  // Try to restore session for this page
  await restoreSession();
}

// Get basic page info without extracting content
async function getPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showError('Unable to access this page');
      return;
    }

    // Ask content script for page info
    let pageInfo;
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          isPdf: document.contentType === 'application/pdf',
          contentType: document.contentType,
          title: document.title,
          // Check for embedded PDFs
          embeddedPdf: (() => {
            const embed = document.querySelector(
              'embed[type="application/pdf"], ' +
              'object[type="application/pdf"], ' +
              'iframe[src*=".pdf"]'
            );
            return embed ? (embed.src || embed.data) : null;
          })()
        })
      });
      pageInfo = result;
    } catch (e) {
      // Fallback for pages where we can't inject (chrome://, etc.)
      pageInfo = {
        isPdf: tab.url.toLowerCase().endsWith('.pdf'),
        contentType: 'unknown',
        title: tab.title,
        embeddedPdf: null
      };
    }

    // Update page title
    elements.pageTitle.textContent = pageInfo.title || tab.title || 'Untitled Page';

    // Determine page type
    if (pageInfo.isPdf) {
      updatePageType('pdf', 'PDF Document');
    } else if (pageInfo.embeddedPdf) {
      updatePageType('pdf', 'Embedded PDF');
    } else {
      updatePageType('html', 'Web Page');
    }

    // Store for later use
    currentPageUrl = tab.url;
    currentTabId = tab.id;
    
    extractedData = {
      tabId: tab.id,
      url: tab.url,
      title: pageInfo.title || tab.title,
      isPdf: pageInfo.isPdf,
      isEmbeddedPdf: !!pageInfo.embeddedPdf,
      embeddedPdfUrl: pageInfo.embeddedPdf,
      contentType: pageInfo.contentType
    };

    log('Page info:', extractedData);

  } catch (error) {
    log('Error getting page info:', error);
    showError('Unable to access this page');
  }
}

function setupEventListeners() {
  // Mascot wiggle on click
  elements.mascot.addEventListener('click', () => {
    elements.mascot.classList.add('wiggle');
    setTimeout(() => elements.mascot.classList.remove('wiggle'), 500);
  });

  // Preview toggle
  elements.previewToggle.addEventListener('click', () => {
    elements.previewToggle.classList.toggle('expanded');
    elements.previewContent.classList.toggle('hidden');
  });

  // Detect button - main action before detection
  elements.detectBtn.addEventListener('click', handleDetect);

  // Simplify button
  elements.simplifyBtn.addEventListener('click', handleSimplify);

  // Translate button - toggle dropdown
  elements.translateBtn.addEventListener('click', toggleTranslateDropdown);
  
  // Language selection from dropdown
  elements.languageSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      handleTranslate(e.target.value);
      elements.translateDropdown.classList.add('hidden');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.translateBtn.contains(e.target) && 
        !elements.translateDropdown.contains(e.target)) {
      elements.translateDropdown.classList.add('hidden');
    }
  });

  // Reset button
  elements.resetBtn.addEventListener('click', handleReset);

  // Download PDF button
  elements.downloadPdfBtn.addEventListener('click', handleDownloadPdf);
  
  // Add to Calendar button - main action after detection
  elements.addToCalendarBtn.addEventListener('click', handleAddToCalendar);

  // Clear Detection button - reset to pre-detection state
  elements.clearDetectionBtn.addEventListener('click', handleClearDetection);

  // Open app button
  elements.openAppBtn.addEventListener('click', () => {
    if (importedId) {
      const view = currentPreviewType === 'original' ? 'original' : 'simplified';
      openInApp(importedId, view);
    }
  });

  // Retry button
  elements.retryBtn.addEventListener('click', () => {
    resetAllState();
    updateState(State.IDLE);
    getPageInfo();
  });
}

// Handle Clear Detection button - reset and clear stored session
async function handleClearDetection() {
  // Clear highlights on the page
  if (extractedData?.tabId) {
    try {
      await chrome.tabs.sendMessage(extractedData.tabId, { action: 'clearHighlights' });
    } catch (e) {
      log('Clear highlights error:', e);
    }
  }
  
  // Clear stored session
  await clearSession();
  
  // Reset all state
  resetAllState();
  updateState(State.IDLE);
  await getPageInfo();
}

// Toggle translate dropdown visibility
function toggleTranslateDropdown() {
  if (elements.translateBtn.disabled) return;
  elements.translateDropdown.classList.toggle('hidden');
}

// Handle Detect button click - extract content from page
async function handleDetect() {
  if (!extractedData?.tabId) {
    showError('No page to detect');
    return;
  }

  try {
    updateState(State.DETECTING);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Use the ACTUAL detection results from getPageInfo()
    if (extractedData.isPdf) {
      // Direct PDF - send URL to backend
      extractedData = {
        ...extractedData,
        type: 'pdf',
        url: tab.url,
        sourceUrl: tab.url
      };
      elements.previewText.value = `PDF: ${tab.url}`;
      updatePreviewStats(tab.url);
      
    } else if (extractedData.isEmbeddedPdf && extractedData.embeddedPdfUrl) {
      // Embedded PDF - send the embedded URL
      extractedData = {
        ...extractedData,
        type: 'pdf',
        url: extractedData.embeddedPdfUrl,
        sourceUrl: tab.url
      };
      elements.previewText.value = `Embedded PDF: ${extractedData.embeddedPdfUrl}`;
      updatePreviewStats(extractedData.embeddedPdfUrl);
      
    } else {
      // HTML - extract text via content script
      await extractHtmlContent(tab.id);
    }

    // Send to backend for Gemini extraction
    const result = await extractContent(extractedData);
    if (result.success) {
      // Store results
      importedId = result.id;
      importResult = result;
      syllabusData = result.syllabusData;
      calendarEvents = result.calendarEvents || [];

      // Update preview with extracted text
      updatePreview(extractedData.text || `Detected ${calendarEvents.length} events`, 'original');
      
      // Push to history
      pushToHistory('original', extractedData.text || '');
      
      // Request highlight on page
      await highlightOnPage(tab.id, extractedData.text);
      
      // Show toolbar and switch main button
      showPostDetectionUI();
      
      updateState(State.IDLE);
      
      // Enable action buttons
      enableActionButtons();
      
      // Save session for persistence
      await saveSession();
      
    } else {
      throw new Error(result.message || 'Detection failed');
    }

  } catch (error) {
    log('Detection error:', error);
    updateState(State.ERROR);
    showError(error.message || 'Failed to detect syllabus content');
  }
}

// Handle Simplify button click
async function handleSimplify() {
  if (!syllabusData) {
    showError('No syllabus data to simplify. Please detect first.');
    return;
  }
  
  try {
    updateState(State.SIMPLIFYING);
    const result = await simplifyContent(syllabusData, extractedData.title);

    if (result.success) {
      simplifiedMarkdown = result.simplified;
      updatePreview(simplifiedMarkdown, 'simplified');
      pushToHistory('simplified', simplifiedMarkdown);
      elements.translateBtn.disabled = false;

      updateState(State.IDLE);
    } else {
      throw new Error(result.message || 'Simplification failed');
    }

  } catch (error) {
    log('Simplification error:', error);
    updateState(State.ERROR);
    showError(error.message || 'Failed to simplify syllabus content');
  }
}

// Handle Translate button click
async function handleTranslate(targetLanguage) {
  if (!simplifiedMarkdown) {
    showError('No simplified content to translate. Please simplify first.');
    return;
  }

  if (targetLanguage === 'en') {
    // Reset to English (simplified)
    updatePreview(simplifiedMarkdown, 'simplified');
    currentLanguage = 'en';
    return;
  }
  
  try {
    currentLanguage = targetLanguage;
    updateState(State.TRANSLATING);
    const result = await translateContent(simplifiedMarkdown, targetLanguage);

    if (result.success) {
      translatedMarkdown = result.translated;

      // Update preview
      const langName = supportedLanguages[targetLanguage] || targetLanguage;
      updatePreview(translatedMarkdown, 'translated', langName);

      // Push to history
      pushToHistory('translated', translatedMarkdown, targetLanguage);
      
      updateState(State.IDLE);
    } else {
      throw new Error(result.message || 'Translation failed');
    }
  } catch (error) {
    log('Translation error:', error);
    updateState(State.ERROR);
    showError(error.message || 'Failed to translate syllabus content');
  }
}

// Handle Reset button - restore previous state
function handleReset() {
  if (previewHistory.length <= 1) return; // Nothing to reset to

  // Pop current state
  previewHistory.pop();
  const previous = previewHistory[previewHistory.length - 1];

  if (previous) {
    // Restore previous state
    updatePreview(previous.content, previous.type, previous.language);

    // Update state variables
    if (previous.type === 'original') {
      simplifiedMarkdown = null;
      translatedMarkdown = null;
      currentLanguage = 'en';

      elements.translateBtn.disabled = true;
    } else if (previous.type === 'simplified') {
      translatedMarkdown = null;
      currentLanguage = 'en';
    }
    currentPreviewType = previous.type;
  }
  
  // Disable reset if nothing left to reset to
  elements.resetBtn.disabled = previewHistory.length <= 1;
}

// Handle Download PDF button
async function handleDownloadPdf() {
  // Get current preview content
  const content = getCurrentPreviewContent();

  if (!content) {
    showError('No content to download.');
    return; 
  }

  try {
    updateState(State.GENERATING_PDF);

    // Build title with type indicator
    let title = extractedData.title || 'Syllabus';
    if (currentPreviewType === 'simplified') {
      title += ' (Simplified)';
    } else if (currentPreviewType === 'translated') {
      const langName = supportedLanguages[currentLanguage] || currentLanguage;
      title += ` (Translated - ${langName})`;
    }
    await downloadPdf(content, title);
    
    updateState(State.IDLE);

  } catch (error) {
    log('PDF download error:', error);
    updateState(State.ERROR);
    showError(error.message || 'Failed to generate PDF');
  }
}

// Handle Add to Calendar button
async function handleAddToCalendar() {
  if (!calendarEvents || calendarEvents.length === 0) {
    showError('No calendar events to add. Please detect syllabus first.');
    return;
  }

  try {
    updateState(State.ADDING_TO_CALENDAR);

    // Get Google OAuth token via Chrome Identity API
    const googleToken = await getGoogleOAuthToken();

    if (!googleToken) {
      throw new Error('Google authentication required');
    }
    
    // Build calendar name from syllabus info
    const courseName = syllabusData?.extracted_sections?.code?.[0]?.text ||
                       syllabusData?.extracted_sections?.title?.[0]?.text ||
                       extractedData.title || 
                       'Course Calendar';
    const term = syllabusData?.date?.term || '';
    const year = syllabusData?.date?.year || '';
    const calendarName = `${courseName}${term ? ` - ${term}` : ''}${year ? ` ${year}` : ''}`;

    const result = await addToCalendar(calendarName, calendarEvents, googleToken);
    
    if (result.success) {
      updateState(State.SUCCESS);

      // Show success with calendar link
      elements.statusDescription.innerHTML = `
        Added ${result.events_added} events to calendar.<br>
        <a href="${result.calendar_url}" target="_blank" style="color: var(--bubbles);">
          Open in Google Calendar →
        </a>
      `;

    } else {
      throw new Error(result.message || 'Failed to add to calendar');
    }

  } catch (error) {
    log('Add to Calendar error:', error);
    updateState(State.ERROR);
    showError(error.message || 'Failed to add events to calendar');
  }
}

// Get Google OAuth token via Chrome Identity API
function getGoogleOAuthToken() {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive:true }, (token) => {
      if (chrome.runtime.lastError) {
        log('Google auth error:', chrome.runtime.lastError);
        resolve(null);
      } else {
        resolve(token);
      }
    });
  });
}

// Get current preview content based on state
function getCurrentPreviewContent() {
  if (currentPreviewType === 'translated' && translatedMarkdown) {
    return translatedMarkdown;
  }
  if (currentPreviewType === 'simplified' && simplifiedMarkdown) {
    return simplifiedMarkdown;
  }
  return extractedData?.text || '';
}

// Push state to history for Reset functionality
function pushToHistory(type, content, language = 'en') {
  previewHistory.push({ type, content, language });
  elements.resetBtn.disabled = previewHistory.length <= 1;
}

// Update preview display
function updatePreview(content, type, languageName = null) {
  elements.previewText.value = content;
  updatePreviewStats(content);
  currentPreviewType = type;
  
  // Update type label
  if (elements.previewTypeLabel) {
    if (type === 'original') {
      elements.previewTypeLabel.textContent = 'Original';
    } else if (type === 'simplified') {
      elements.previewTypeLabel.textContent = 'Simplified';
    } else if (type === 'translated') {
      elements.previewTypeLabel.textContent = languageName || 'Translated';
    }
  }

}

// Populate language dropdown
function populateLanguageDropdown() {
  if (!elements.languageSelect) return;
  
  elements.languageSelect.innerHTML = '<option value="">Select language...</option>';
  
  for (const [code, name] of Object.entries(supportedLanguages)) {
    if (code !== 'en') {  // Skip English for now
      const option = document.createElement('option');
      option.value = code;
      option.textContent = name;
      elements.languageSelect.appendChild(option);
    }
  }
}

// Enable action buttons after detection
function enableActionButtons() {
  elements.simplifyBtn.disabled = false;
  elements.addToCalendarBtn.disabled = false;
  elements.downloadPdfBtn.disabled = false;
  // Translate stays disabled until Simplify is done
  elements.translateBtn.disabled = true;
}

// Show post-detection UI: toolbar and calendar button
function showPostDetectionUI() {
  // Hide detect button, show calendar button and clear button
  elements.detectBtn.classList.add('hidden');
  elements.addToCalendarBtn.classList.remove('hidden');
  elements.clearDetectionBtn.classList.remove('hidden');
  
  // Show action toolbar
  elements.actionToolbar.classList.remove('hidden');
  
  // Expand preview to show content
  elements.previewToggle.classList.add('expanded');
  elements.previewContent.classList.remove('hidden');
}

// Hide post-detection UI (reset to initial state)
function hidePostDetectionUI() {
  // Show detect button, hide calendar button and clear button
  elements.detectBtn.classList.remove('hidden');
  elements.addToCalendarBtn.classList.add('hidden');
  elements.clearDetectionBtn.classList.add('hidden');
  
  // Hide action toolbar
  elements.actionToolbar.classList.add('hidden');
  
  // Collapse preview
  elements.previewToggle.classList.remove('expanded');
  elements.previewContent.classList.add('hidden');
}

// Reset all state variables 
function resetAllState() {
  extractedData = null;
  importedId = null;
  importResult = null;
  syllabusData = null;
  calendarEvents = null;
  simplifiedMarkdown = null;
  translatedMarkdown = null;
  currentLanguage = 'en';
  currentPreviewType = 'original';
  previewHistory = [];
  
  // Disable all action buttons
  elements.simplifyBtn.disabled = true;
  elements.translateBtn.disabled = true;
  elements.resetBtn.disabled = true;
  elements.downloadPdfBtn.disabled = true;
  elements.addToCalendarBtn.disabled = true;
  
  // Reset UI to pre-detection state
  hidePostDetectionUI();
  
  // Clear preview text
  elements.previewText.value = '';
  elements.previewTypeLabel.textContent = 'Preview';
  updatePreviewStats('');
}

// Highlight extracted text on the page
async function highlightOnPage(tabId, text) {
  if (!text || !tabId) return;
  
  try {
    // Send message to content script to highlight the text
    await chrome.tabs.sendMessage(tabId, {
      action: 'highlightText',
      text: text
    });
  } catch (e) {
    log('Highlight error:', e);
    // Non-critical - don't fail if highlighting doesn't work
  }
}

// Listen for selection changes from content script
function setupSelectionListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SELECTION_CHANGED' && message.text) {
      // Update extracted data with new selection
      extractedData = {
        ...extractedData,
        text: message.text,
        type: 'text'
      };
      
      // Update preview
      elements.previewText.value = message.text;
      updatePreviewStats(message.text);
      
      // Clear processed versions since source changed
      simplifiedMarkdown = null;
      translatedMarkdown = null;
      currentPreviewType = 'original';
      previewHistory = [{ type: 'original', content: message.text, language: 'en' }];
      
      // Disable buttons that need re-processing
      elements.translateBtn.disabled = true;
      
      log('Selection updated:', message.text.substring(0, 100) + '...');
    }
    return true;
  });
}

// Generate storage key for current tab
function getSessionKey(url) {
  // Use a hash of the URL for the key
  const cleanUrl = url?.replace(/[#?].*$/, '') || 'unknown';
  return STORAGE_KEY_PREFIX + cleanUrl;
}

// Save current session state
async function saveSession() {
  if (!extractedData) return;
  
  try {
    const sessionData = {
      extractedData,
      importedId,
      importResult,
      syllabusData,
      calendarEvents,
      simplifiedMarkdown,
      translatedMarkdown,
      currentLanguage,
      currentPreviewType,
      previewHistory,
      previewText: elements.previewText.value,
      timestamp: Date.now()
    };
    
    const key = getSessionKey(currentPageUrl);
    await chrome.storage.local.set({ [key]: sessionData });
    log('Session saved for:', currentPageUrl);
  } catch (e) {
    log('Error saving session:', e);
  }
}

// Restore session for current tab
async function restoreSession() {
  if (!currentPageUrl) return false;
  
  try {
    const key = getSessionKey(currentPageUrl);
    const result = await chrome.storage.local.get(key);
    const session = result[key];
    
    if (!session || !session.extractedData) {
      log('No session to restore for:', currentPageUrl);
      return false;
    }
    
    // Check if session is too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - session.timestamp > maxAge) {
      log('Session expired for:', currentPageUrl);
      await clearSession();
      return false;
    }
    
    // Restore state variables
    extractedData = session.extractedData;
    importedId = session.importedId;
    importResult = session.importResult;
    syllabusData = session.syllabusData;
    calendarEvents = session.calendarEvents;
    simplifiedMarkdown = session.simplifiedMarkdown;
    translatedMarkdown = session.translatedMarkdown;
    currentLanguage = session.currentLanguage || 'en';
    currentPreviewType = session.currentPreviewType || 'original';
    previewHistory = session.previewHistory || [];
    
    // Restore UI
    elements.previewText.value = session.previewText || '';
    updatePreviewStats(session.previewText || '');
    
    // Show post-detection UI
    showPostDetectionUI();
    enableActionButtons();
    
    // Enable translate if simplified exists
    if (simplifiedMarkdown) {
      elements.translateBtn.disabled = false;
    }
    
    // Re-highlight on page
    if (extractedData.text) {
      highlightOnPage(currentTabId, extractedData.text);
    }
    
    log('Session restored for:', currentPageUrl);
    return true;
  } catch (e) {
    log('Error restoring session:', e);
    return false;
  }
}

// Clear session for current tab
async function clearSession() {
  if (!currentPageUrl) return;
  
  try {
    const key = getSessionKey(currentPageUrl);
    await chrome.storage.local.remove(key);
    log('Session cleared for:', currentPageUrl);
  } catch (e) {
    log('Error clearing session:', e);
  }
}

async function extractHtmlContent(tabId) {
  try {
    updateState(State.EXTRACTING);
    
    // Execute content script to extract text
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageContent
    });

    if (results && results[0] && results[0].result) {
      const { text, title, isPdf, pdfUrl } = results[0].result;
      
      if (isPdf && pdfUrl) {
        // Page contains embedded PDF
        updatePageType('pdf', 'Embedded PDF');
        extractedData = {
          type: 'pdf',
          url: pdfUrl,
          title: title || 'Embedded Syllabus'
        };
        elements.previewText.value = `Embedded PDF URL: ${pdfUrl}`;
        updatePreviewStats(pdfUrl);
      } else {
        // Regular HTML content
        extractedData = {
          type: 'text',
          text: text,
          title: title,
          sourceUrl: window.location?.href
        };
        elements.previewText.value = text;
        updatePreviewStats(text);
      }
      
      updateState(State.IDLE);
    } else {
      throw new Error('No content extracted');
    }
  } catch (error) {
    log('Error extracting HTML:', error);
    updateState(State.ERROR);
    showError('Could not extract content from this page. Try downloading the PDF and uploading it directly.');
  }
}

// This function runs in the page context
function extractPageContent() {
  // Check for embedded PDFs first
  const pdfEmbed = document.querySelector('embed[type="application/pdf"], object[type="application/pdf"], iframe[src*=".pdf"]');
  if (pdfEmbed) {
    const pdfUrl = pdfEmbed.src || pdfEmbed.data;
    return {
      isPdf: true,
      pdfUrl: pdfUrl,
      title: document.title,
      text: ''
    };
  }

  // Check content type
  if (document.contentType === 'application/pdf') {
    return {
      isPdf: true,
      pdfUrl: window.location.href,
      title: document.title,
      text: ''
    };
  }

  // Extract text from HTML
  // Prioritize main content areas
  const contentSelectors = [
    'main',
    'article', 
    '[role="main"]',
    '.content',
    '.main-content',
    '#content',
    '#main',
    '.syllabus',
    '.course-content'
  ];

  let contentElement = null;
  for (const selector of contentSelectors) {
    contentElement = document.querySelector(selector);
    if (contentElement) break;
  }

  // Fallback to body
  if (!contentElement) {
    contentElement = document.body;
  }

  // Clone to avoid modifying the page
  const clone = contentElement.cloneNode(true);

  // Remove unwanted elements
  const removeSelectors = [
    'nav', 'header', 'footer', 'aside',
    '.sidebar', '.navigation', '.menu', '.nav',
    '.advertisement', '.ad', '.ads',
    'script', 'style', 'noscript',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '.cookie-banner', '.popup', '.modal'
  ];

  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get clean text
  let text = clone.innerText || clone.textContent || '';
  
  // Normalize whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return {
    isPdf: false,
    pdfUrl: null,
    title: document.title,
    text: text.substring(0, 50000) // Limit to 50k chars
  };
}

function updatePageType(type, label) {
  elements.pageTypeBadge.className = `page-type-badge ${type}`;
  elements.pageTypeBadge.querySelector('.badge-icon').textContent = type === 'pdf' ? '📑' : '📄';
  elements.pageTypeText.textContent = label;
}

function updatePreviewStats(text) {
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  elements.charCount.textContent = `${charCount.toLocaleString()} characters`;
  elements.wordCount.textContent = `${wordCount.toLocaleString()} words`;
}

function updateState(newState) {
  currentState = newState;
  
  // Reset classes
  elements.statusCard.className = 'status-card';
  elements.errorMessage.classList.add('hidden');
  
  // Reset loading states on all buttons
  elements.detectBtn.classList.remove('loading');
  elements.detectBtn.disabled = false;
  elements.simplifyBtn.classList.remove('loading');
  elements.translateBtn.classList.remove('loading');
  elements.addToCalendarBtn.classList.remove('loading');
  elements.downloadPdfBtn.classList.remove('loading');
  
  // Hide all icons (both svg and img)
  elements.statusIcon.querySelectorAll('svg, img').forEach(el => el.classList.add('hidden'));

  switch (newState) {
    case State.IDLE:
      elements.statusIcon.querySelector('.icon-idle').classList.remove('hidden');
      // Update status text based on whether we've detected content
      if (syllabusData) {
        elements.statusTitle.textContent = 'Content detected';
        elements.statusDescription.textContent = `Found ${calendarEvents?.length || 0} calendar events`;
      } else {
        elements.statusTitle.textContent = 'Ready to extract';
        elements.statusDescription.textContent = 'Click Detect to extract syllabus content';
      }
      if (simplifiedMarkdown) {
        elements.translateBtn.disabled = false;
      }
      break;

    case State.DETECTING:
      elements.statusCard.classList.add('extracting');
      elements.statusIcon.querySelector('.icon-extracting').classList.remove('hidden');
      elements.statusTitle.textContent = 'Detecting content...';
      elements.statusDescription.textContent = 'Analyzing the page for syllabus content';
      elements.detectBtn.classList.add('loading');
      elements.detectBtn.disabled = true;
      elements.detectBtn.querySelector('.btn-text').textContent = 'Detecting...';
      break;

    case State.SIMPLIFYING:
      elements.statusCard.classList.add('extracting');
      elements.statusIcon.querySelector('.icon-extracting').classList.remove('hidden');
      elements.statusTitle.textContent = 'Simplifying...';
      elements.statusDescription.textContent = 'Creating accessible version';
      elements.simplifyBtn.classList.add('loading');
      elements.simplifyBtn.disabled = true;
      break;

    case State.TRANSLATING:
      elements.statusCard.classList.add('extracting');
      elements.statusIcon.querySelector('.icon-extracting').classList.remove('hidden');
      elements.statusTitle.textContent = 'Translating...';
      elements.statusDescription.textContent = `Translating to ${supportedLanguages[currentLanguage] || currentLanguage}`;
      elements.translateBtn.classList.add('loading');
      elements.translateBtn.disabled = true;
      break;

    case State.ADDING_TO_CALENDAR:
      elements.statusCard.classList.add('extracting');
      elements.statusIcon.querySelector('.icon-extracting').classList.remove('hidden');
      elements.statusTitle.textContent = 'Adding to calendar...';
      elements.statusDescription.textContent = 'Creating calendar and adding events';
      elements.addToCalendarBtn.classList.add('loading');
      elements.addToCalendarBtn.disabled = true;
      break;

    case State.GENERATING_PDF:
      elements.statusCard.classList.add('extracting');
      elements.statusIcon.querySelector('.icon-extracting').classList.remove('hidden');
      elements.statusTitle.textContent = 'Generating PDF...';
      elements.statusDescription.textContent = 'Creating downloadable document';
      elements.downloadPdfBtn.classList.add('loading');
      elements.downloadPdfBtn.disabled = true;
      break;

    case State.SUCCESS:
      elements.statusCard.classList.add('success');
      elements.statusIcon.querySelector('.icon-success').classList.remove('hidden');
      elements.statusTitle.textContent = 'Success! 🎉';
      
      // Show details about what was extracted
      let successDesc = 'Your syllabus has been imported';
      if (importResult) {
        const eventCount = importResult.calendarEvents?.length || 0;
        const assessmentCount = importResult.syllabusData?.grading_scheme?.assessments?.length || 0;
        if (eventCount > 0 || assessmentCount > 0) {
          const parts = [];
          if (assessmentCount > 0) parts.push(`${assessmentCount} assessments`);
          if (eventCount > 0) parts.push(`${eventCount} calendar events`);
          successDesc = `Extracted ${parts.join(' and ')}`;
        }
      }
      elements.statusDescription.textContent = successDesc;
      elements.openAppBtn.classList.remove('hidden');
      break;

    case State.ERROR:
      elements.statusCard.classList.add('error');
      elements.statusIcon.querySelector('.icon-error').classList.remove('hidden');
      elements.statusTitle.textContent = 'Something went wrong';
      elements.statusDescription.textContent = 'Unable to process this page';
      elements.detectBtn.querySelector('.btn-text').textContent = 'Detect Syllabus';
      break;
  }
}

function showError(message) {
  elements.errorMessage.classList.remove('hidden');
  elements.errorText.textContent = message;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
