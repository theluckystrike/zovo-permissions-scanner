import { ScanReport, Risk } from './types';

/**
 * Generate a 2-3 sentence human-readable summary from a scan report.
 */
export function generateSummary(report: Omit<ScanReport, 'summary'>): string {
  const { risks, bonuses, name, grade } = report;

  if (risks.length === 0) {
    return `${name || 'This extension'} requests minimal permissions and poses very low privacy risk. It earned a ${grade} grade.`;
  }

  // Group risks by severity
  const critical = risks.filter((r) => r.severity === 'critical');
  const high = risks.filter((r) => r.severity === 'high');
  const medium = risks.filter((r) => r.severity === 'medium');

  const sentences: string[] = [];
  const extensionName = name || 'This extension';

  // First sentence: main findings
  if (critical.length > 0) {
    const concerns = critical.slice(0, 2).map(describeRisk).join(' and ');
    sentences.push(`${extensionName} ${concerns}.`);
  } else if (high.length > 0) {
    const concerns = high.slice(0, 2).map(describeRisk).join(' and ');
    sentences.push(`${extensionName} ${concerns}.`);
  } else if (medium.length > 0) {
    const concerns = medium.slice(0, 2).map(describeRisk).join(' and ');
    sentences.push(`${extensionName} ${concerns}.`);
  }

  // Second sentence: severity summary
  if (critical.length + high.length > 0) {
    const parts: string[] = [];
    if (critical.length > 0) parts.push(`${critical.length} critical`);
    if (high.length > 0) parts.push(`${high.length} high-risk`);
    if (medium.length > 0) parts.push(`${medium.length} medium-risk`);
    sentences.push(`Found ${parts.join(', ')} permission issue(s).`);
  }

  // Third sentence: positive notes or recommendation
  if (bonuses.length > 0 && grade !== 'F' && grade !== 'D') {
    sentences.push(
      `On the positive side, it ${bonuses[0].reason.toLowerCase().replace(/^uses /, 'uses ')}.`
    );
  } else if (critical.length > 0 || high.length >= 3) {
    sentences.push('These are significant privacy risks — review carefully before installing.');
  }

  return sentences.join(' ');
}

function describeRisk(risk: Risk): string {
  const subject = risk.permission.toLowerCase();

  if (subject.includes('<all_urls>') || subject.includes('*://*/*')) {
    return 'requests access to all websites';
  }
  if (subject.includes('cookies')) {
    return 'can read and write your cookies';
  }
  if (subject.includes('history')) {
    return 'can access your full browsing history';
  }
  if (subject.includes('webrequest')) {
    return 'can intercept network requests';
  }
  if (subject.includes('tabs')) {
    return 'can see all your open tabs';
  }
  if (subject.includes('debugger')) {
    return 'has full browser debugging access';
  }
  if (subject.includes('management')) {
    return 'can manage other extensions';
  }
  if (subject.includes('nativemessaging')) {
    return 'can communicate with local applications';
  }
  if (subject.includes('proxy')) {
    return 'can intercept all network traffic';
  }
  if (subject.includes('downloads')) {
    return 'can monitor your downloads';
  }
  if (subject.includes('bookmarks')) {
    return 'can read your bookmarks';
  }

  return `requests the "${risk.permission}" permission`;
}
