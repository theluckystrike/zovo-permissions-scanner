-- Zovo Permissions Scanner — Supabase Schema

CREATE TABLE scan_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  extension_id TEXT NOT NULL,
  name TEXT,
  version TEXT,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  label TEXT NOT NULL,
  report JSONB NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(extension_id, version)
);

CREATE INDEX idx_scan_reports_extension_id ON scan_reports(extension_id);
CREATE INDEX idx_scan_reports_score ON scan_reports(score);

CREATE TABLE verified_extensions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  extension_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT now(),
  last_scanned TIMESTAMPTZ DEFAULT now(),
  badge_displayed BOOLEAN DEFAULT false
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE scan_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_extensions ENABLE ROW LEVEL SECURITY;

-- Public (anon) read access to scan_reports
CREATE POLICY "Allow public read on scan_reports"
  ON scan_reports
  FOR SELECT
  USING (true);

-- Only the service role can insert/update/delete scan_reports
CREATE POLICY "Service role can insert scan_reports"
  ON scan_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update scan_reports"
  ON scan_reports
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete scan_reports"
  ON scan_reports
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Public (anon) read access to verified_extensions
CREATE POLICY "Allow public read on verified_extensions"
  ON verified_extensions
  FOR SELECT
  USING (true);

-- Only the service role can insert/update/delete verified_extensions
CREATE POLICY "Service role can insert verified_extensions"
  ON verified_extensions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update verified_extensions"
  ON verified_extensions
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete verified_extensions"
  ON verified_extensions
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- Views
-- ============================================================

-- Returns only the latest scan report per extension_id
CREATE VIEW scan_reports_latest AS
SELECT DISTINCT ON (extension_id) *
FROM scan_reports
ORDER BY extension_id, scanned_at DESC;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE scan_reports IS
  'Stores the full scan report for every extension+version combination analysed by the Zovo Permissions Scanner.';

COMMENT ON TABLE verified_extensions IS
  'Extensions that have been verified by Zovo and may display a trust badge.';

COMMENT ON VIEW scan_reports_latest IS
  'Convenience view that returns only the most recent scan report for each extension_id.';
