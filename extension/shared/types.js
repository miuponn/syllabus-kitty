/**
 * Extension states
 */
export const ExtensionState = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  READY: 'ready',
  EXTRACTING: 'extracting',
  SENDING: 'sending',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Content types
 */
export const ContentType = {
  TEXT: 'text',
  PDF: 'pdf',
  HTML: 'html',
  UNKNOWN: 'unknown'
};

/**
 * Message types for communication
 */
export const MessageType = {
  EXTRACT_CONTENT: 'extractContent',
  GET_PAGE_INFO: 'getPageInfo',
  SEND_TO_BACKEND: 'sendToBackend',
  OPEN_APP: 'openApp'
};

/**
 * Status messages
 */
export const StatusMessages = {
  [ExtensionState.IDLE]: 'Ready to extract syllabus',
  [ExtensionState.DETECTING]: 'Analyzing page content...',
  [ExtensionState.READY]: 'Content detected! Ready to send.',
  [ExtensionState.EXTRACTING]: 'Extracting content...',
  [ExtensionState.SENDING]: 'Sending to Syllabus Kitty...',
  [ExtensionState.SUCCESS]: 'Successfully imported!',
  [ExtensionState.ERROR]: 'Something went wrong'
};

/**
 * Backend endpoints
 */
export const Endpoints = {
  IMPORT_TEXT: '/api/extension/import-text',
  IMPORT_PDF: '/api/extension/import-pdf-url',
  GET_IMPORT: '/api/extension/import'
};
