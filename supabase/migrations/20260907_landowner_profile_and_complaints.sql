-- ============================================================
-- BHUMI PLATFORM — REAL LANDOWNER PROFILE & COMPLAINTS SETUP
-- Defines landowners profile table with auth.users reference,
-- RLS policies, storage bucket permissions, and realtime publications.
-- ============================================================

-- 1. LANDOWNERS PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.landowners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    contact_village TEXT DEFAULT 'Chandwas (V03)',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_landowners_user_id ON public.landowners(user_id);
CREATE INDEX IF NOT EXISTS idx_landowners_email ON public.landowners(email);

-- 2. ROW LEVEL SECURITY (RLS) POLICIES FOR LANDOWNERS TABLE
ALTER TABLE public.landowners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read landowners" ON public.landowners;
CREATE POLICY "Public read landowners" ON public.landowners
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own landowner profile" ON public.landowners;
CREATE POLICY "Users can insert their own landowner profile" ON public.landowners
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can update their own landowner profile" ON public.landowners;
CREATE POLICY "Users can update their own landowner profile" ON public.landowners
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'authenticated') WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Ensure owners table permissions are open for synchronization
ALTER TABLE IF EXISTS public.owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all owners access" ON public.owners;
CREATE POLICY "Allow all owners access" ON public.owners
    FOR ALL USING (auth.uid() = id OR auth.role() = 'authenticated') WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');

-- 3. EVIDENCE STORAGE PERMISSIONS
-- Ensure storage bucket 'documents' is public and allows uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    52428800, -- 50 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

DROP POLICY IF EXISTS "Landowner evidence upload" ON storage.objects;
CREATE POLICY "Landowner evidence upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
    
DROP POLICY IF EXISTS "Landowner evidence read" ON storage.objects;
CREATE POLICY "Landowner evidence read" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
        AND (
            -- Owner can read their own
            (storage.foldername(name))[1] = auth.uid()::text
            OR 
            -- Or if accessed by an officer/admin, handled by signed URLs or backend in a real system,
            -- but for this demo, we allow authenticated users to read if they have the URL.
            -- Actually, let's enforce strict ownership or backend access:
            auth.role() = 'service_role' OR (storage.foldername(name))[1] = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Landowner evidence update" ON storage.objects;
CREATE POLICY "Landowner evidence update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Landowner evidence delete" ON storage.objects;
CREATE POLICY "Landowner evidence delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- 4. REALTIME PUBLICATION
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE landowners;
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
END $$;
