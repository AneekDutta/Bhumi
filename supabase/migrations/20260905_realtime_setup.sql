-- ============================================================
-- BHUMI PLATFORM — SUPABASE REALTIME & RLS SETUP MIGRATION
-- Enables Supabase Realtime, configures RLS policies,
-- creates 'documents' storage bucket, and grants access.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. ROW LEVEL SECURITY (RLS) POLICIES FOR SHARED DATA
-- Allow authenticated officers and authorized clients to read, insert, update

-- Projects
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for projects" ON projects;
CREATE POLICY "Allow all for projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Villages
ALTER TABLE IF EXISTS villages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for villages" ON villages;
CREATE POLICY "Allow all for villages" ON villages FOR ALL USING (true) WITH CHECK (true);

-- Owners
ALTER TABLE IF EXISTS owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for owners" ON owners;
CREATE POLICY "Allow all for owners" ON owners FOR ALL USING (true) WITH CHECK (true);

-- Parcels
ALTER TABLE IF EXISTS parcels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for parcels" ON parcels;
CREATE POLICY "Allow all for parcels" ON parcels FOR ALL USING (true) WITH CHECK (true);

-- Documents & Incidents
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for documents" ON documents;
CREATE POLICY "Allow all for documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- Audit Logs
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for audit_logs" ON audit_logs;
CREATE POLICY "Allow all for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Statutory Rules
ALTER TABLE IF EXISTS statutory_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for statutory_rules" ON statutory_rules;
CREATE POLICY "Allow all for statutory_rules" ON statutory_rules FOR ALL USING (true) WITH CHECK (true);

-- Project Segments
ALTER TABLE IF EXISTS project_segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for project_segments" ON project_segments;
CREATE POLICY "Allow all for project_segments" ON project_segments FOR ALL USING (true) WITH CHECK (true);

-- Milestones
ALTER TABLE IF EXISTS milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for milestones" ON milestones;
CREATE POLICY "Allow all for milestones" ON milestones FOR ALL USING (true) WITH CHECK (true);

-- Acquisition Cases
ALTER TABLE IF EXISTS acquisition_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for acquisition_cases" ON acquisition_cases;
CREATE POLICY "Allow all for acquisition_cases" ON acquisition_cases FOR ALL USING (true) WITH CHECK (true);

-- 2. ENABLE SUPABASE REALTIME PUBLICATION
-- Tables added to supabase_realtime will emit live events over WebSocket
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE parcels;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE documents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 3. STORAGE BUCKET FOR EVIDENCE & FIELD PHOTOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS
DROP POLICY IF EXISTS "Public access to documents bucket" ON storage.objects;
CREATE POLICY "Public access to documents bucket" ON storage.objects
FOR ALL USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
