# Zovo --- Extension Privacy Scanner

> See privacy scores for Chrome extensions before you install them

Zovo adds privacy and safety grades directly to Chrome Web Store listing pages. Before you click "Add to Chrome", you can see at a glance whether an extension requests dangerous permissions, lacks a privacy policy, or has other red flags.

## What It Does

When you visit a Chrome Web Store extension page, Zovo:

1. Detects the extension ID from the URL.
2. Checks the local cache for a recent scan report.
3. If no cached report exists, requests one from the Zovo API (via the background service worker).
4. Renders a privacy badge inside a Shadow DOM container on the page, showing the extension's grade, score, and risk summary.

## How It Works

```
CWS Page Load
    |
    v
Content Script (parser.ts)
    |--- extracts extension ID from URL
    |
    v
Cache Check (cache.ts)
    |--- hit?  --> render badge
    |--- miss? --> continue
    |
    v
API Request (api.ts)
    |--- sends SCAN_EXTENSION message
    |
    v
Background Service Worker (background.ts)
    |--- GET  /api/report/:id  (cached on server?)
    |--- POST /api/scan         (fallback: fresh scan)
    |
    v
Cache + Render
    |--- store report in chrome.storage.local (24h TTL)
    |--- inject Shadow DOM badge with grade
```

## Installation (Developer Mode)

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/nicepkg/zovo-permissions-scanner.git
   cd zovo-permissions-scanner
   npm install
   npm run build
   ```

2. Open Chrome and navigate to `chrome://extensions`.

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **Load unpacked** and select the `packages/cws-overlay/dist/` folder.

5. Visit any Chrome Web Store extension page to see the privacy badge.

## Permissions

| Permission | Why It's Needed |
|---|---|
| `storage` | Cache scan reports locally for 24 hours to avoid redundant API calls. |
| `activeTab` | Interact with the active Chrome Web Store tab to inject the privacy badge. |
| `host_permissions` (`https://chromewebstore.google.com/*`) | Run the content script on CWS listing pages to detect extension IDs and render the badge. |

## Architecture

### Content Script

Runs on `chromewebstore.google.com/detail/*` pages. Parses the extension ID from the URL, checks the local cache, requests a report from the API if needed, and renders the badge inside a Shadow DOM to avoid style collisions with the CWS page.

### Background Service Worker

Handles cross-origin API requests to `api.zovo.one`. Content scripts cannot make requests to external origins, so they send a `SCAN_EXTENSION` message to the service worker, which performs the fetch and returns the result.

### Shadow DOM Isolation

The privacy badge is rendered inside a closed Shadow DOM attached to a custom element. This guarantees that CWS page styles do not leak into the badge, and badge styles do not affect the host page.

### Key Files

```
packages/cws-overlay/
  src/
    background.ts        # Service worker -- handles API calls
    utils/
      parser.ts          # Extracts extension ID from CWS URL
      cache.ts           # chrome.storage.local cache with 24h TTL
      api.ts             # Sends messages to the service worker
  dist/                  # Built extension (load this in Chrome)
  manifest.json          # Extension manifest (MV3)
```

## Icons

Placeholder icons are needed in three sizes:

- `icons/icon-16.png` (16x16) -- toolbar
- `icons/icon-48.png` (48x48) -- extensions page
- `icons/icon-128.png` (128x128) -- Chrome Web Store listing

## Chrome Web Store Listing

| Field | Value |
|---|---|
| **Title** | Zovo -- Extension Privacy Scanner |
| **Short Description** | See privacy scores for Chrome extensions before you install them. |
| **Category** | Developer Tools |
| **Language** | English |

**Detailed Description:**

Zovo scans Chrome extensions for risky permissions, missing privacy policies, and other red flags, then shows you a clear privacy grade right on the Chrome Web Store page. No more guessing whether an extension is safe to install.

- Letter grades (A+ to F) based on permission analysis
- Risk breakdown with severity levels and recommendations
- Bonus points for good practices (privacy policy, open source, small permission set)
- Results cached locally for fast repeat visits
- Zero data collection -- the extension only sends the public extension ID to the Zovo API

## Links

- **Scanner Dashboard**: [scan.zovo.dev](https://scan.zovo.dev)
- **Zovo Home**: [zovo.dev](https://zovo.dev)
- **GitHub**: [github.com/nicepkg/zovo-permissions-scanner](https://github.com/nicepkg/zovo-permissions-scanner)

## License

MIT
