# @zovo/scan-api

REST API for the Zovo Permissions Scanner

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8787/api` |
| Production  | `https://api.zovo.one/api` |

---

## Endpoints

### GET /api/health

Returns the current health status and version of the API.

**Response**

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

**Example**

```bash
curl https://api.zovo.one/api/health
# {"status":"ok","version":"1.0.0"}
```

---

### POST /api/scan

Triggers a fresh permissions scan for a Chrome extension. You can provide either an extension ID (to fetch the manifest from the Chrome Web Store) or supply the manifest directly.

**Request Body**

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `extension_id` | string | One of   | Chrome Web Store extension ID |
| `manifest`     | object | One of   | Raw Chrome extension manifest JSON |

**Rate Limit:** 10 requests per minute per IP.

**Response:** Full `ScanReport` JSON (see [Response Format](#response-format) below).

**Examples**

Scan by extension ID:

```bash
curl -X POST https://api.zovo.one/api/scan \
  -H "Content-Type: application/json" \
  -d '{"extension_id":"cjpalhdlnbpafiamejdnhcphjbkeiagm"}'
```

Scan by manifest:

```bash
curl -X POST https://api.zovo.one/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "manifest": {
      "name": "My Extension",
      "version": "1.0.0",
      "manifest_version": 3,
      "permissions": ["storage", "tabs"],
      "host_permissions": ["https://*/*"]
    }
  }'
```

---

### GET /api/report/:extension_id

Returns a cached scan report for the given extension. If the cached report is older than 24 hours, a fresh scan is triggered automatically before returning the result.

**Path Parameters**

| Parameter      | Type   | Description |
|----------------|--------|-------------|
| `extension_id` | string | Chrome Web Store extension ID |

**Response:** Full `ScanReport` JSON (see [Response Format](#response-format) below).

**Example**

```bash
curl https://api.zovo.one/api/report/cjpalhdlnbpafiamejdnhcphjbkeiagm
```

---

### GET /api/badge/:extension_id

Returns an SVG badge image showing the extension's Zovo privacy score and grade. Useful for embedding in README files, websites, and documentation.

**Path Parameters**

| Parameter      | Type   | Description |
|----------------|--------|-------------|
| `extension_id` | string | Chrome Web Store extension ID |

**Query Parameters**

| Parameter | Type   | Default | Description |
|-----------|--------|---------|-------------|
| `style`   | string | `flat`  | Badge style: `flat`, `plastic`, or `for-the-badge` |

**Response:** `image/svg+xml`

**Example**

```bash
curl https://api.zovo.one/api/badge/cjpalhdlnbpafiamejdnhcphjbkeiagm?style=flat
```

**Markdown Usage**

```markdown
![Zovo Score](https://api.zovo.one/api/badge/EXTENSION_ID)
```

With a specific style:

```markdown
![Zovo Score](https://api.zovo.one/api/badge/EXTENSION_ID?style=for-the-badge)
```

---

### GET /api/compare/:id1/:id2

Returns a side-by-side comparison of two extensions' scan reports, including score differences and permission deltas.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id1`     | string | First extension's Chrome Web Store ID |
| `id2`     | string | Second extension's Chrome Web Store ID |

**Response:** Comparison JSON containing both reports and a diff summary.

**Example**

```bash
curl https://api.zovo.one/api/compare/cjpalhdlnbpafiamejdnhcphjbkeiagm/gighmmpiobklfepjocnamgkkbiglidom
```

**Response Example**

```json
{
  "extension_a": {
    "extension_id": "cjpalhdlnbpafiamejdnhcphjbkeiagm",
    "name": "uBlock Origin",
    "score": 82,
    "grade": "A"
  },
  "extension_b": {
    "extension_id": "gighmmpiobklfepjocnamgkkbiglidom",
    "name": "AdBlock",
    "score": 65,
    "grade": "B"
  },
  "diff": {
    "score_difference": 17,
    "permissions_only_in_a": ["webNavigation"],
    "permissions_only_in_b": ["contextMenus", "notifications"],
    "shared_permissions": ["storage", "tabs", "webRequest"]
  }
}
```

---

## Response Format

All scan endpoints return a `ScanReport` JSON object. Below is the full schema with a realistic example.

### ScanReport Schema

| Field           | Type     | Description |
|-----------------|----------|-------------|
| `extension_id`  | string   | Chrome Web Store extension ID |
| `name`          | string   | Extension display name |
| `version`       | string   | Extension version string |
| `score`         | integer  | Privacy score from 0 (worst) to 100 (best) |
| `grade`         | string   | Letter grade: A, B, C, D, or F |
| `label`         | string   | Human-readable label: "Safe", "Caution", "Warning", or "Danger" |
| `report`        | object   | Detailed breakdown of the scan results |
| `scanned_at`    | string   | ISO 8601 timestamp of when the scan was performed |

### Example Response

```json
{
  "extension_id": "cjpalhdlnbpafiamejdnhcphjbkeiagm",
  "name": "uBlock Origin",
  "version": "1.56.0",
  "score": 82,
  "grade": "A",
  "label": "Safe",
  "report": {
    "permissions": {
      "declared": ["storage", "tabs", "webNavigation", "webRequest", "webRequestBlocking"],
      "host_permissions": ["<all_urls>"],
      "optional_permissions": [],
      "risk_breakdown": [
        {
          "permission": "webRequest",
          "risk": "medium",
          "reason": "Can observe all browser HTTP requests"
        },
        {
          "permission": "webRequestBlocking",
          "risk": "high",
          "reason": "Can modify or block HTTP requests before they complete"
        },
        {
          "permission": "<all_urls>",
          "risk": "high",
          "reason": "Host permission grants access to all websites"
        },
        {
          "permission": "storage",
          "risk": "low",
          "reason": "Extension-scoped storage only"
        },
        {
          "permission": "tabs",
          "risk": "medium",
          "reason": "Can read tab URLs and metadata"
        }
      ]
    },
    "data_access": {
      "can_read_browsing_history": true,
      "can_read_page_content": true,
      "can_modify_requests": true,
      "can_access_cookies": false,
      "can_access_downloads": false
    },
    "signals": {
      "has_content_scripts": true,
      "has_background_service_worker": true,
      "has_devtools_page": false,
      "uses_remote_code": false,
      "content_security_policy": "script-src 'self'; object-src 'self'"
    },
    "scoring": {
      "base_score": 100,
      "deductions": [
        { "reason": "Host permission: <all_urls>", "points": -8 },
        { "reason": "Permission: webRequestBlocking", "points": -5 },
        { "reason": "Permission: webRequest", "points": -3 },
        { "reason": "Permission: tabs", "points": -2 }
      ],
      "final_score": 82
    }
  },
  "scanned_at": "2026-03-01T12:00:00.000Z"
}
```

---

## Rate Limits

All endpoints are rate-limited. Exceeding the limit returns a `429 Too Many Requests` response.

| Endpoint         | Limit              |
|------------------|--------------------|
| General          | 60 requests/min per IP |
| POST /api/scan   | 10 requests/min per IP |
| GET /api/badge   | 300 requests/min   |

---

## Error Responses

All errors follow a consistent JSON format:

```json
{
  "error": "description of the error",
  "code": 400
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request -- Invalid or missing parameters |
| 404  | Not Found -- Extension not found in Chrome Web Store |
| 429  | Too Many Requests -- Rate limit exceeded |
| 500  | Internal Server Error -- Something went wrong on our end |

**Examples**

```json
{
  "error": "Missing required field: extension_id or manifest",
  "code": 400
}
```

```json
{
  "error": "Extension not found: xyz123",
  "code": 404
}
```

```json
{
  "error": "Rate limit exceeded. Try again in 45 seconds.",
  "code": 429
}
```

---

## Development

```bash
cd packages/api
npm install
npm run dev   # starts wrangler dev on localhost:8787
```

The dev server runs on `http://localhost:8787` with hot-reload enabled via Wrangler.

---

## Deployment

```bash
npm run deploy  # deploys to Cloudflare Workers
```

This runs `wrangler deploy` under the hood. Make sure your Cloudflare account is authenticated via `wrangler login` before deploying.

---

## Environment Variables

| Variable        | Description |
|-----------------|-------------|
| `SUPABASE_URL`  | Supabase project URL |
| `SUPABASE_KEY`  | Supabase service role key |
| `SCAN_CACHE`    | Cloudflare KV namespace (configured in `wrangler.toml`) |

Set secrets for Cloudflare Workers:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
```

The `SCAN_CACHE` KV namespace is configured in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SCAN_CACHE"
id = "your-kv-namespace-id"
```

---

Powered by Zovo -- https://zovo.one
