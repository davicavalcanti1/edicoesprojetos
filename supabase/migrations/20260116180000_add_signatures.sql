
-- Add signature columns to administrative_occurrences
ALTER TABLE administrative_occurrences
ADD COLUMN IF NOT EXISTS coordinator_signature_path text,
ADD COLUMN IF NOT EXISTS employee_signature_path text,
ADD COLUMN IF NOT EXISTS signed_at timestamp with time zone;

-- Ensure RHDashboard stats query still works (it selects status/created_at so it's fine)
-- But we might want to ensure 'concluido' status is consistent.
-- The app used "concluido" in one place and "concluida" in another (statusConfig).
-- Let's stick to what's in the DB.
