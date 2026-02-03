/** Syllabus Kitty Extension - API Client **/

import { log } from '../shared/logger.js';

const BACKEND_URL = 'http://localhost:8000';
const APP_URL = 'http://localhost:3000';

/**
 * Send extracted content to the backend
 * @param {Object} data - Extracted data object
 * @param {string} data.type - 'text' or 'pdf'
 * @param {string} data.text - Extracted text (for text type)
 * @param {string} data.url - PDF URL (for pdf type)
 * @param {string} data.title - Page/document title
 * @param {string} data.sourceUrl - Source URL
 * @param {string} data.language - Target language (default: 'en')
 * @returns {Promise<Object>} - Backend response with syllabus data, simplified version, and calendar events
 */
export async function extractContent(data) {
  log('Sending to backend:', data.type);
  
  try {
    if (data.type === 'pdf') {
      return await importPdfUrl(data);
    } else {
      return await importText(data);
    }
  } catch (error) {
    log('API error:', error);
    throw error;
  }
}

async function importText(data) {
  const response = await fetch(`${BACKEND_URL}/api/extension/import-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: data.sourceUrl || '',
      title: data.title || 'Untitled Syllabus',
      extracted_text: data.text || ''
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  
  const result = await response.json();
  
  // Transform response for popup
  return {
    success: result.success,
    id: result.syllabus_id,
    importId: result.import_id,
    syllabusData: result.syllabus_data,
    calendarEvents: result.calendar_events,
    message: result.message
  };
}

async function importPdfUrl(data) {
  const response = await fetch(`${BACKEND_URL}/api/extension/import-pdf-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: data.sourceUrl || data.url || '',
      pdf_url: data.url,
      title: data.title || 'Syllabus PDF',
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  
  const result = await response.json();
  
  // Transform response for popup
  return {
    success: result.success,
    id: result.syllabus_id,
    importId: result.import_id,
    syllabusData: result.syllabus_data,
    calendarEvents: result.calendar_events,
    message: result.message
  };
}

/**
 * Simplify syllabus data into readable markdown
 * @param {Object} syllabusData - Extracted syllabus data from extractContent
 * @param {string} title - Document title
 * @returns {Promise<Object>} - { success: boolean, simplifiedMarkdown: string }
 */
export async function simplifyContent(syllabusData, title) {
  const response = await fetch(`${BACKEND_URL}/api/extension/simplify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      syllabus_data: syllabusData,
      title: title
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Translate simplified markdown to target language
 * @param {string} simplifiedMarkdown - Simplified markdown from simplifyContent
 * @param {string} targetLanguage - Target language code (e.g., 'en', 'es')
 * @returns {Promise<Object>} - { success: boolean, translatedMarkdown: string, language: string }
 */
export async function translateContent(simplifiedMarkdown, targetLanguage) {
  const response = await fetch(`${BACKEND_URL}/api/extension/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      simplified_content: simplifiedMarkdown,
      target_language: targetLanguage
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  return await response.json();
}

/** 
 * Add events to Google Calendar
 * @param {string} calendarName - Name for the new calendar
 * @param {Array} events - Calendar events from extractContent
 * @param {string} googleToken - Google access token from chrome.identity
 * @returns {Promise<Object>} - { success: boolean, calendarId: string, calendar_url: string, events_added: number }
 */
export async function addToCalendar(calendarName, events, googleToken) {
  const response = await fetch(`${BACKEND_URL}/api/extension/add-to-calendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-google-access-token': googleToken // Custom header for Google token
    },
    body: JSON.stringify({
      calendar_name: calendarName,
      events: events
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Generate and download PDF from markdown
 * @param {string} markdownContent - Markdown to convert to PDF (simplified or translated)
 * @param {string} title - PDF title
 */
export async function downloadPdf(markdownContent, title) {
  const response = await fetch(`${BACKEND_URL}/api/extension/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      markdown_content: markdownContent,
      title: title
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  // Response is binary PDF, not JSON
  const blob = await response.blob();
  
  // Trigger browser download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_') || 'syllabus'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  return { success: true, message: 'PDF downloaded' };
}

/**
 * Get URL to open syllabus in web app
 * @param {string} syllabusId - Syllabus ID
 * @param {string} view - View mode ('original' or 'simplified')
 * @returns {Promise<Object>} - { url, syllabus_id, view }
 */
export async function getAppUrl(syllabusId, view = 'original') {
  const response = await fetch(
    `${BACKEND_URL}/api/extension/get-app-url?syllabus_id=${syllabusId}&view=${view}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Open the app in a new tab
 * @param {string} syllabusId - Optional syllabus ID to open directly
 * @param {string} view - View mode ('original' or 'simplified')
 */
export function openInApp(syllabusId, view = 'original') {
  const url = syllabusId 
    ? `${APP_URL}/syllabus/${syllabusId}?view=${view}`
    : APP_URL;
  chrome.tabs.create({ url });
}

/**
 * Get import status
 * @param {string} importId - Import ID
 */
export async function getImportStatus(importId) {
  const response = await fetch(`${BACKEND_URL}/api/extension/import/${importId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
}

export async function getSupportedLanguages() {
  const response = await fetch(`${BACKEND_URL}/api/extension/languages`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
}
