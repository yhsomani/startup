-- ==============================================
-- Service Migration Tracking Table
-- ==============================================
-- This table tracks migration versions for all services

CREATE TABLE IF NOT EXISTS public.service_migrations (
    service_name character varying(255) NOT NULL PRIMARY KEY,
    version character varying(50) NOT NULL,
    applied_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    checksum character varying(64)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_service_migrations_applied_at 
ON public.service_migrations(applied_at);