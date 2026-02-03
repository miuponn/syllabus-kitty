# Syllabus Kitty Extension

Chrome Extension for Syllabus Kitty - AI-powered syllabus extraction and calendar generation with embedded PDF and HTML in browser detection.

## Features

- **Detect Syllabus** - Auto-detect syllabi on your browser in PDF, embedded, preview, or HTML pages
- **Simplify** - Generate versions of syllabi in simplified English 
- **Translate** - Translate simplified content in 15+ languages
- **Add to Calendar** - Send auto-detected events directly to Google Calendar
- **Download PDF** - Export content from any version to PDF

## Quick Start

### 1. Start the Backend Server

See [Backend README](../backend/README.md) for setup instructions.

```bash
cd backend
source venv/bin/activate
python main.py
```

### 2. Load Extension in Chrome

1. Navigate to `chrome://extensions/` in your browser
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `/extension` folder from this repository

### How to Use the Extension

1. Navigate to any syllabus page (PDF or HTML)
2. Click the Syllabus Kitty icon in the toolbar
3. Click **Detect Syllabus** to extract content
4. Use **Simplify**, **Translate**, or **Add to Calendar** as needed

## Project Structure

```
extension/
├── manifest.json          # MV3 Chrome extension manifest
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic & state management
├── background/
│   ├── serviceWorker.js   # Background service worker
│   └── apiClient.js       # API communication with backend
├── content/
│   └── contentScript.js   # Page content extraction & highlighting
├── shared/
│   └── logger.js          # Shared logging utilities
├── icons/                 # Extension icons (16, 48, 128px)
└── images/                # UI images and assets
```

## Configuration

### Google Calendar Integration

The extension uses Chrome Identity API for Google authentication. To enable calendar features:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 Client ID** (Chrome Extension type)
5. Update `manifest.json` with your client ID:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/calendar"]
}
```

## Troubleshooting

### Extension not loading
- Make sure Developer mode is enabled in `chrome://extensions/`
- Check for errors in the extension card
- Verify all files are present in the extension folder

### "Failed to detect syllabus content"
- Ensure the backend server is running on `http://localhost:8000`
- Check browser console for CORS or network errors
- Try refreshing the page before detecting

### Calendar button not working
- Make sure you've configured the OAuth client ID in manifest.json
- Check that Google Calendar API is enabled in your Google Cloud project
- Try signing out and back into Chrome

### Session not persisting
- The extension stores session data per-page URL
- Sessions expire after 24 hours
- Use "Clear Detection" to manually reset
