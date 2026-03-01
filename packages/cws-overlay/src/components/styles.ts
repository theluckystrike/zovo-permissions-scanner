/**
 * Shadow DOM styles for the Zovo CWS Overlay.
 * All class names are prefixed with "zovo-" to avoid collisions.
 */
export function getStyles(): string {
  return `
    #zovo-container {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      box-sizing: border-box;
    }

    #zovo-container *, #zovo-container *::before, #zovo-container *::after {
      box-sizing: border-box;
    }

    /* ── Badge (collapsed pill) ── */

    .zovo-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      border: none;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: zovo-fade-in 0.3s ease-out;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      user-select: none;
      white-space: nowrap;
    }

    .zovo-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .zovo-badge:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    /* ── Loading badge ── */

    .zovo-badge-loading {
      animation: zovo-fade-in 0.3s ease-out, zovo-pulse 1.5s ease-in-out infinite;
      cursor: default;
    }

    .zovo-badge-loading:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    /* ── Card (expanded) ── */

    .zovo-card {
      width: 320px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 16px;
      animation: zovo-fade-in 0.3s ease-out;
      color: #1f2937;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      line-height: 1.5;
    }

    .zovo-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .zovo-card-header-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zovo-card-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #9ca3af;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      line-height: 1;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .zovo-card-close:hover {
      color: #4b5563;
      background-color: #f3f4f6;
    }

    /* ── Score area ── */

    .zovo-card-score {
      text-align: center;
      margin-bottom: 2px;
    }

    .zovo-card-score-number {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.2;
    }

    .zovo-card-score-max {
      font-size: 18px;
      font-weight: 400;
      color: #9ca3af;
    }

    .zovo-card-grade {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .zovo-card-label {
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
      margin-bottom: 14px;
    }

    /* ── Risks / Bonuses sections ── */

    .zovo-card-section {
      margin-bottom: 10px;
    }

    .zovo-card-section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .zovo-card-risk {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12.5px;
      color: #374151;
      padding: 3px 0;
      line-height: 1.4;
    }

    .zovo-card-risk-emoji {
      flex-shrink: 0;
    }

    .zovo-card-risk-more {
      font-size: 12px;
      color: #9ca3af;
      padding: 2px 0;
      font-style: italic;
    }

    .zovo-card-bonus {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12.5px;
      color: #374151;
      padding: 3px 0;
      line-height: 1.4;
    }

    /* ── Divider ── */

    .zovo-card-divider {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 12px 0;
    }

    /* ── Link ── */

    .zovo-card-link {
      display: block;
      text-align: center;
      font-size: 12.5px;
      font-weight: 600;
      color: #2563eb;
      text-decoration: none;
      padding: 4px 0;
      transition: color 0.15s ease;
    }

    .zovo-card-link:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }

    /* ── Footer ── */

    .zovo-card-footer {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      margin-top: 8px;
    }

    .zovo-card-footer a {
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .zovo-card-footer a:hover {
      color: #6b7280;
      text-decoration: underline;
    }

    .zovo-card-scanned {
      text-align: center;
      font-size: 10.5px;
      color: #b0b7c3;
      margin-top: 4px;
    }

    /* ── Keyframes ── */

    @keyframes zovo-fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes zovo-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
}
