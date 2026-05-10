-- Admin migration: ban, plan, site_settings, admin_logs

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS plano text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plano_expira timestamptz;

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

INSERT INTO site_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('global_announcement', ''),
  ('announcement_active', 'false'),
  ('admin_username', ''),
  ('admin_password_plain', '')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  target_id text,
  details text,
  created_at timestamptz DEFAULT now()
);
