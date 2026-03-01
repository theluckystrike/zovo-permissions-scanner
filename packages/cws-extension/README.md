# Zovo Extension Scanner — Chrome Web Store Overlay

A Chrome extension that overlays [Zovo](https://zovo.dev) privacy scan results directly on Chrome Web Store extension pages. When you browse an extension on the CWS, you instantly see its privacy grade, score, and key risks — right on the page.

## How It Works

1. Visit any extension page on `chromewebstore.google.com`
2. The extension extracts the extension ID from the URL
3. It calls the Zovo API to fetch (or trigger) a privacy scan
4. A floating badge appears on the page showing the grade, score, and risks
5. Click the extension icon to see results in a popup as well

## Features

- Privacy grade badge (A+ through F) injected directly onto CWS pages
- Shadow DOM overlay to avoid style conflicts with the Web Store
- Popup with scan details when clicking the extension icon
- 24-hour local cache to avoid unnecessary re-scans
- Handles SPA navigation (CWS uses client-side routing)
- Graceful error handling when the API is unavailable
- Link to full report on [scan.zovo.dev](https://scan.zovo.dev)

## Installation (Developer Mode)

Since this extension is not published on the Chrome Web Store, you need to load it as an unpacked extension:

1. Clone this repository and navigate to `packages/cws-extension/`
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `packages/cws-extension/` directory
6. The extension icon should appear in your toolbar

> **Note:** You may see a warning about missing icon files. See the Icons section below.

## Icons

The `icons/` directory contains a `.gitkeep` placeholder. To use the extension without warnings, add PNG icon files:

- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

You can generate these from any shield/scanner icon. The extension will function without them, but Chrome will show a default puzzle-piece icon.

## Project Structure

```
packages/cws-extension/
├── manifest.json          # MV3 manifest
├── src/
│   ├── content.js         # Content script injected into CWS pages
│   ├── background.js      # Service worker for API calls & caching
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styles
├── icons/
│   └── .gitkeep           # Placeholder for icon files
├── styles/
│   └── overlay.css        # Host styles for the injected overlay
└── README.md
```

## API

The extension communicates with the Zovo Permissions Scanner API:

- **GET** `https://api.scan.zovo.dev/api/report/{extension_id}` — Fetch a cached report
- **POST** `https://api.scan.zovo.dev/api/scan` — Trigger a fresh scan (fallback if GET returns 404)

## Links

- [Zovo](https://zovo.dev) — Main site
- [Zovo Scanner](https://scan.zovo.dev) — Web-based scanner
- [Full Report](https://scan.zovo.dev/report/{extension_id}) — View detailed reports

## Screenshots

> Screenshots will be added once icon assets and final UI polish are complete.

## License

Part of the Zovo Permissions Scanner project.
