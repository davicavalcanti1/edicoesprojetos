-- Add 'rh' to app_role enum
-- This must be in its own transaction/commit before being used
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rh';
