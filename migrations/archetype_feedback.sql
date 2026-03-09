-- Create archetype_feedback table
CREATE TABLE IF NOT EXISTS public.archetype_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    archetype TEXT NOT NULL,
    relates BOOLEAN NOT NULL,
    response_id UUID REFERENCES public.survey_responses(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.archetype_feedback ENABLE ROW LEVEL SECURITY;

-- Allow public insert
CREATE POLICY "Allow public insert" 
ON public.archetype_feedback 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow public read (for admin)
CREATE POLICY "Allow public read" 
ON public.archetype_feedback 
FOR SELECT 
TO anon 
USING (true);
