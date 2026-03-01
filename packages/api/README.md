# Zovo Permissions Scanner — API

REST API for scanning, scoring, and reporting on Chrome extension permissions.

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8787/api` |
| Staging | `https://zovo-scan-api.{account}.workers.dev/api` |
| Production | `https://api.scan.zovo.dev` *(planned)* |

---

## Endpoints

### GET /api/health

Returns the current health status of the API.

**Response**

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

**Example**

```bash
curl https://api.scan.zovo.dev/api/health
```

---

### POST /api/scan

Scan an extension by its Chrome Web Store ID **or** by providing a raw manifest.

**Request Body**

Provide **one** of:

| Field | Type | Description |
|-------|------|-------------|
| `extension_id` | `string` | Chrome Web Store extension ID |
| `manifest` | `object` | A raw `manifest.json` object to analyse |

**Rate Limit:** 10 requests / minute per IP

**Response** — Full `ScanReport` (see [Response Format](#response-format) below).

**Example**

```bash
# Scan by extension ID
curl -X POST https://api.scan.zovo.dev/api/scan \
  -H "Content-Type: application/json" \
  -d '{ "extension_id": "abc123def456" }'

# Scan by raw manifest
curl -X POST https://api.scan.zovo.dev/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "manifest": {
      "name": "My Extension",
      "version": "1.0.0",
      "permissions": ["storage", "tabs"],
      "host_permissions": ["https://*/*"]
    }
  }'
```

---

### GET /api/report/:extension_id

Retrieve the cached scan report for an extension. If no cached report exists (or if the cache has expired), a new scan is triggered automatically.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `extension_id` | `string` | Chrome Web Store extension ID |

**Cache:** 24 hours

**Response** — Full `ScanReport` (see [Response Format](#response-format) below).

**Example**

```bash
curl https://api.scan.zovo.dev/api/report/abc123def456
```

---

### GET /api/badge/:extension_id

Returns an SVG badge image showing the extension's Zovo score and grade.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `extension_id` | `string` | Chrome Web Store extension ID |

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `style` | `string` | `flat` | Badge style: `flat`, `plastic`, or `for-the-badge` |

**Cache:** 24 hours

**Response:** `image/svg+xml`

**Usage in Markdown**

```markdown
![Zovo Score](https://api.scan.zovo.dev/api/badge/abc123def456)
![Zovo Score](https://api.scan.zovo.dev/api/badge/abc123def456?style=for-the-badge)
```

**Example**

```bash
curl https://api.scan.zovo.dev/api/badge/abc123def456?style=flat
```

---

### GET /api/compare/:id1/:id2

Compare two extensions side-by-side.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id1` | `string` | First extension ID |
| `id2` | `string` | Second extension ID |

**Response**

```json
{
  "extensions": [
    { "...ScanReport for id1..." },
    { "...ScanReport for id2..." }
  ],
  "comparison": {
    "winner_id": "abc123def456",
    "score_diff": 15,
    "summary": "Extension A requests fewer permissions and avoids remote code execution, earning a higher trust score."
  }
}
```

**Example**

```bash
curl https://api.scan.zovo.dev/api/compare/abc123def456/xyz789ghi012
```

---

## Response Format

All scan-related endpoints return a **ScanReport** JSON object:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "extension_id": "abc123def456",
  "name": "My Extension",
  "version": "1.0.0",
  "score": 72,
  "grade": "B",
  "label": "Moderate Risk",
  "scanned_at": "2026-03-01T12:00:00.000Z",
  "report": {
    "permissions": {
      "requested": ["storage", "tabs", "activeTab"],
      "risky": ["tabs"],
      "safe": ["storage", "activeTab"],
      "score_impact": -8
    },
    "host_permissions": {
      "patterns": ["https://*/*"],
      "scope": "broad",
      "score_impact": -15
    },
    "content_security_policy": {
      "has_csp": true,
      "allows_eval": false,
      "allows_remote_code": false,
      "score_impact": 0
    },
    "manifest_version": 3,
    "data_exposure": {
      "sends_data_externally": false,
      "third_party_domains": [],
      "score_impact": 0
    },
    "findings": [
      {
        "severity": "warning",
        "code": "BROAD_HOST_PERMISSIONS",
        "message": "Extension requests access to all HTTPS sites.",
        "score_impact": -15
      },
      {
        "severity": "info",
        "code": "TABS_PERMISSION",
        "message": "The 'tabs' permission allows reading tab URLs and titles.",
        "score_impact": -8
      }
    ],
    "recommendations": [
      "Narrow host_permissions to only the domains the extension needs.",
      "Consider using activeTab instead of the tabs permission."
    ]
  }
}
```

### ScanReport Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique report identifier |
| `extension_id` | `string` | Chrome Web Store extension ID |
| `name` | `string \| null` | Extension display name |
| `version` | `string \| null` | Extension version string |
| `score` | `integer` | Trust score from 0 (dangerous) to 100 (safe) |
| `grade` | `string` | Letter grade: `A+`, `A`, `B`, `C`, `D`, `F` |
| `label` | `string` | Human-readable risk label (e.g. "Safe", "Low Risk", "Moderate Risk", "High Risk", "Dangerous") |
| `scanned_at` | `ISO 8601` | Timestamp of the scan |
| `report` | `object` | Detailed breakdown (see below) |
| `report.permissions` | `object` | Analysis of declared permissions |
| `report.host_permissions` | `object` | Analysis of host permission patterns and scope |
| `report.content_security_policy` | `object` | CSP analysis (eval, remote code) |
| `report.manifest_version` | `integer` | Manifest version (2 or 3) |
| `report.data_exposure` | `object` | External data-sending analysis |
| `report.findings` | `array` | List of individual findings with severity, code, message, and score impact |
| `report.recommendations` | `array` | Actionable suggestions to improve the extension's score |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Public API (general) | 60 requests / minute per IP |
| `POST /api/scan` | 10 requests / minute per IP |
| `GET /api/badge/:id` | 300 requests / minute |

Rate-limited responses return HTTP `429 Too Many Requests` with a `Retry-After` header.

---

## Error Responses

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No scan report found for extension ID 'xyz'."
  }
}
```

| HTTP Status | Code | Description |
|-------------|------|-------------|
| `400` | `BAD_REQUEST` | Missing or invalid request body |
| `404` | `NOT_FOUND` | Extension or report not found |
| `429` | `RATE_LIMITED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Unexpected server error |

---

## Development

```bash
cd packages/api
npm install
npm run dev  # starts wrangler dev server on http://localhost:8787
```

## Deployment

```bash
npm run deploy  # deploys to Cloudflare Workers
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `SCAN_CACHE` | Cloudflare KV namespace (configured in `wrangler.toml`) |

---

Powered by **Zovo** · [https://zovo.dev](https://zovo.dev)
