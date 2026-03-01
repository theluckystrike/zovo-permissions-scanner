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

-- Row Level Security
ALTER TABLE scan_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON scan_reports FOR SELECT USING (true);
CREATE POLICY "Service role write" ON scan_reports FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access" ON verified_extensions FOR SELECT USING (true);
CREATE POLICY "Service role write" ON verified_extensions FOR ALL USING (auth.role() = 'service_role');

-- View: latest scan per extension
CREATE VIEW scan_reports_latest AS
SELECT DISTINCT ON (extension_id) *
FROM scan_reports
ORDER BY extension_id, scanned_at DESC;

-- Table comments
COMMENT ON TABLE scan_reports IS 'Stores every scan report per extension+version';
COMMENT ON TABLE verified_extensions IS 'Extensions verified by the Zovo Verified program';
COMMENT ON VIEW scan_reports_latest IS 'Latest scan report per extension';
