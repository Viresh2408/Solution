-- TrustNet AI — New Tables Migration (Features F1, F2, F7, F8)
-- Run these in your Supabase SQL editor

-- F1: Behavioral Biometrics Events
CREATE TABLE IF NOT EXISTS public.biometric_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "orgId"     text NOT NULL,
  "employeeName" text,
  "anomalyScore" integer NOT NULL DEFAULT 0,
  "triggerType" text NOT NULL DEFAULT 'normal',
  timestamp   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_biometric_orgId ON public.biometric_events("orgId");
ALTER TABLE public.biometric_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.biometric_events FOR ALL USING (true);

-- F2: Vishing / Call Analysis Logs
CREATE TABLE IF NOT EXISTS public.vishing_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "orgId"     text NOT NULL,
  "callId"    text,
  transcript  text,
  "riskScore" integer DEFAULT 0,
  "riskLevel" text DEFAULT 'SAFE',
  signals     text[] DEFAULT '{}',
  patterns    text[] DEFAULT '{}',
  summary     text,
  timestamp   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vishing_orgId ON public.vishing_logs("orgId");
ALTER TABLE public.vishing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.vishing_logs FOR ALL USING (true);

-- F7: Zero-Trust Override Requests
CREATE TABLE IF NOT EXISTS public.override_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "orgId"         text NOT NULL,
  "employeeName"  text,
  domain          text NOT NULL,
  "riskScore"     integer DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending',  -- pending | approved | denied
  otp             text,
  "requestedAt"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_override_orgId ON public.override_requests("orgId");
CREATE INDEX idx_override_status ON public.override_requests(status);
ALTER TABLE public.override_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.override_requests FOR ALL USING (true);

-- F8: Red Team Simulation Results
CREATE TABLE IF NOT EXISTS public.redteam_simulations (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "orgId"         text NOT NULL,
  "simId"         text,
  channels        text[] DEFAULT '{}',
  "sentCount"     integer DEFAULT 0,
  "clickedCount"  integer DEFAULT 0,
  "failRate"      numeric DEFAULT 0,
  "completedAt"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_redteam_orgId ON public.redteam_simulations("orgId");
ALTER TABLE public.redteam_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.redteam_simulations FOR ALL USING (true);

-- Optional: Add slackNotified columns to alerts table
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS "slackNotified" boolean DEFAULT false;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS "slackChannel" text;
