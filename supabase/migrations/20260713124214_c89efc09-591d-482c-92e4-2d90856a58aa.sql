
CREATE TABLE public.pta_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  qualification TEXT NOT NULL,
  college TEXT NOT NULL,
  year TEXT,
  applying_position TEXT NOT NULL,
  motivation TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  application_status TEXT NOT NULL DEFAULT 'Applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT motivation_length CHECK (char_length(motivation) BETWEEN 100 AND 1000)
);

GRANT ALL ON public.pta_applications TO service_role;

ALTER TABLE public.pta_applications ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: applications are private and only accessible via service_role server functions.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER pta_applications_set_updated_at
BEFORE UPDATE ON public.pta_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX pta_applications_created_at_idx ON public.pta_applications (created_at DESC);
