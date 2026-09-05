-- ============================================================
-- BHUMI PLATFORM — LANDOWNER / CITIZEN GRIEVANCES SETUP
-- Enables Supabase Realtime, configures RLS policies for citizen access,
-- grants permissions on documents (landowner_complaint), audit_logs,
-- parcels, and owners.
-- ============================================================

-- 1. ROW LEVEL SECURITY (RLS) POLICIES FOR LANDOWNER ROLE
-- Ensure authenticated citizens and authorized anon clients can read their parcels,
-- submit complaints, and review status updates.

-- Ensure table public permissions for documents
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow citizen read complaints" ON documents;
CREATE POLICY "Allow citizen read complaints" ON documents
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow citizen insert complaints" ON documents;
CREATE POLICY "Allow citizen insert complaints" ON documents
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow citizen update complaints" ON documents;
CREATE POLICY "Allow citizen update complaints" ON documents
FOR UPDATE USING (true) WITH CHECK (true);

-- Ensure table public permissions for audit_logs
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow citizen audit logs" ON audit_logs;
CREATE POLICY "Allow citizen audit logs" ON audit_logs
FOR ALL USING (true) WITH CHECK (true);

-- Ensure table public permissions for parcels
ALTER TABLE IF EXISTS parcels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow citizen read parcels" ON parcels;
CREATE POLICY "Allow citizen read parcels" ON parcels
FOR SELECT USING (true);

-- Ensure table public permissions for owners
ALTER TABLE IF EXISTS owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow citizen read owners" ON owners;
CREATE POLICY "Allow citizen read owners" ON owners
FOR SELECT USING (true);

-- 2. SUPABASE REALTIME PUBLICATION
-- Ensure documents, audit_logs, and parcels are part of realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE documents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE parcels;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE owners;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 3. EVIDENCE STORAGE PERMISSIONS
-- Ensure citizen evidence photos can be uploaded to 'documents' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Citizen public evidence upload" ON storage.objects;
CREATE POLICY "Citizen public evidence upload" ON storage.objects
FOR ALL USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
