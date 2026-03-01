import { getExtensionId } from './utils/parser';
import { getCachedReport, cacheReport } from './utils/cache';
import { fetchReport } from './utils/api';
import { getStyles } from './components/styles';
import { createBadge, createLoadingBadge, createErrorBadge } from './components/badge';
import { createCard } from './components/card';

interface ScanReport {
  extension_id: string;
  name: string;
  version: string;
  score: number;
  grade: string;
  label: string;
  color: string;
  risks: { permission: string; severity: string; reason: string; recommendation?: string }[];
  bonuses: { type: string; reason: string }[];
  summary: string;
  scanned_at: string;
}

function main(): void {
  const extensionId = getExtensionId();
  if (!extensionId) return;

  // Create Shadow DOM host
  const host = document.createElement('div');
  host.id = 'zovo-scanner-root';
  host.style.cssText =
    'all: initial; position: fixed; top: 16px; right: 16px; z-index: 2147483647;';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getStyles();
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.id = 'zovo-container';
  shadow.appendChild(container);

  document.body.appendChild(host);

  // --- Helpers ---

  function clearContainer(): void {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function showLoading(): void {
    clearContainer();
    container.appendChild(createLoadingBadge());
  }

  function renderBadge(report: ScanReport): void {
    clearContainer();
    container.appendChild(
      createBadge(report, () => renderCard(report)),
    );
  }

  function renderCard(report: ScanReport): void {
    clearContainer();
    container.appendChild(
      createCard(report, () => renderBadge(report)),
    );
  }

  function renderError(id: string): void {
    clearContainer();
    container.appendChild(
      createErrorBadge(() => loadReport(id)),
    );
  }

  // --- Data loading (cache-first) ---

  async function loadReport(id: string): Promise<void> {
    // Try cache first
    let report = await getCachedReport(id);
    if (report) {
      renderBadge(report);
      return;
    }

    // Fetch from API via background
    try {
      report = await fetchReport(id);
      await cacheReport(id, report);
      renderBadge(report);
    } catch {
      renderError(id);
    }
  }

  // --- Show loading state and kick off initial load ---

  showLoading();
  loadReport(extensionId);

  // --- Handle CWS SPA navigation ---

  let currentExtensionId = extensionId;

  const observer = new MutationObserver(() => {
    const newId = getExtensionId();
    if (newId && newId !== currentExtensionId) {
      currentExtensionId = newId;
      showLoading();
      loadReport(newId);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

main();
