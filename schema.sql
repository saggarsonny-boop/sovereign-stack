-- D1 Database Schemas for Sovereign System Analytics & Support

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,          -- 'pageview', 'click', 'signup'
  page_path TEXT NOT NULL,           -- e.g. '/sales-ai-course-review.html'
  referrer TEXT,                     -- document.referrer
  campaign_source TEXT DEFAULT 'direct', -- URL ?source= parameter
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,           -- session_id
  client_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',        -- 'open', 'replied', 'closed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_replies (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender TEXT NOT NULL,              -- 'admin', 'client'
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
