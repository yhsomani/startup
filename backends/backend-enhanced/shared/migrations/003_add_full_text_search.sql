-- Add Full-Text Search Index for Job Listings

-- 1. Add generated column for tsvector (simpler to maintain than a trigger)
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(skills, '')), 'B')
) STORED;

-- 2. Create GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_job_listings_search_vector ON job_listings USING GIN(search_vector);

-- 3. Analyze to update stats
ANALYZE job_listings;
