/**
 * Syllabus Kitty Extension - Service Worker
 * Background script for Chrome extension
 */

import { log } from '../shared/logger.js';

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First install
    log('Welcome to Syllabus Kitty! 🐱');
  } else if (details.reason === 'update') {
    // Extension updated
    log('Syllabus Kitty updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('Message received:', message.type);
  
  switch (message.type) {
    case 'EXTRACT_PAGE':
      handleExtractPage(sender.tab?.id, sendResponse);
      return true; // Keep channel open for async response
      
    case 'OPEN_APP':
      handleOpenApp(message.syllabusId, message.view);
      sendResponse({ success: true });
      break;
    
    case 'SELECTION_CHANGED':
      // Relay selection change from content script to popup
      chrome.runtime.sendMessage(message).catch(() => {
        // Popup might not be open - that's fine
      });
      sendResponse({ success: true });
      break;
    
    case 'HIGHLIGHT_TEXT':
      // Forward highlight request to content script
      if (message.tabId) {
        chrome.tabs.sendMessage(message.tabId, {
          action: 'highlightText',
          text: message.text
        }).catch(err => log('Highlight error:', err));
      }
      sendResponse({ success: true });
      break;
    
    case 'CLEAR_HIGHLIGHTS':
      // Forward clear request to content script
      if (message.tabId) {
        chrome.tabs.sendMessage(message.tabId, {
          action: 'clearHighlights'
        }).catch(err => log('Clear highlights error:', err));
      }
      sendResponse({ success: true });
      break;
      
    default:
      log('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

async function handleExtractPage(tabId, sendResponse) {
  if (!tabId) {
    sendResponse({ error: 'No active tab' });
    return;
  }
  
  try {
    // Execute content script
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/contentScript.js']
    });
    
    sendResponse({ success: true, result: results[0]?.result });
  } catch (error) {
    log('Error executing content script:', error);
    sendResponse({ error: error.message });
  }
}

function handleOpenApp(syllabusId, view = 'simplified') {
  const appUrl = syllabusId 
    ? `http://localhost:3000/syllabus/${syllabusId}?view=${view}`
    : 'http://localhost:3000';
  
  chrome.tabs.create({ url: appUrl });
}

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  log('Port connected:', port.name);
});

log('Service worker initialized');
