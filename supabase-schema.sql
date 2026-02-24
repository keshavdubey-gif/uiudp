-- Campus Social Experience Survey
-- supabase-schema.sql

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Demographics
    age_group TEXT,
    year_of_study TEXT,
    program TEXT,
    stream TEXT,
    gender TEXT,
    residence TEXT,
    
    -- PANAS Scores
    panas_1 INT, panas_2 INT, panas_3 INT, panas_4 INT, panas_5 INT, 
    panas_6 INT, panas_7 INT, panas_8 INT, panas_9 INT, panas_10 INT,
    panas_11 INT, panas_12 INT, panas_13 INT, panas_14 INT, panas_15 INT, 
    panas_16 INT, panas_17 INT, panas_18 INT, panas_19 INT, panas_20 INT,
    panas_positive_score NUMERIC,
    panas_negative_score NUMERIC,
    
    -- Core Experience
    social_satisfaction INT,
    belonging INT,
    close_friends INT,
    social_isolation INT,
    social_frequency TEXT,
    friendship_ease TEXT,
    
    -- Friendship Mechanics
    initiation_anxiety INT,
    overthinking INT,
    avoidance INT,
    judgment_concern INT,
    conversation_initiator TEXT,
    first_interaction_comfort TEXT,
    
    -- Source of Friends (Booleans)
    fs_classes BOOLEAN DEFAULT false,
    fs_hostel BOOLEAN DEFAULT false,
    fs_clubs BOOLEAN DEFAULT false,
    fs_mutual BOOLEAN DEFAULT false,
    fs_online BOOLEAN DEFAULT false,
    fs_other BOOLEAN DEFAULT false,
    
    -- Interaction Barriers (Booleans)
    ib_fear_rejection BOOLEAN DEFAULT false,
    ib_not_knowing BOOLEAN DEFAULT false,
    ib_formed_groups BOOLEAN DEFAULT false,
    ib_no_topic BOOLEAN DEFAULT false,
    ib_low_energy BOOLEAN DEFAULT false,
    ib_nothing BOOLEAN DEFAULT false,
    ib_other BOOLEAN DEFAULT false,
    
    -- Needs & Desires
    social_expansion_desire INT,
    online_comfort INT,
    structured_preference INT,
    spontaneous_value INT,
    
    -- Qualitative
    social_friction_open TEXT,
    safety_factors TEXT,
    
    -- Trait Engine
    completion_time_seconds INT,
    trait_er NUMERIC,
    trait_cr NUMERIC,
    trait_si NUMERIC,
    trait_pf NUMERIC,
    trait_gp NUMERIC,
    trait_se NUMERIC,
    trait_ed NUMERIC,
    archetype TEXT,
    suspect_submission BOOLEAN DEFAULT false
);

-- 2. Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy: Anyone can insert (Anonymous submissions)
CREATE POLICY "Allow public insert" 
ON public.survey_responses 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 4. Create Policy: Anyone can read (For the simplified admin dashboard)
-- Note: In a production app, you'd restrict this to authenticated admins.
CREATE POLICY "Allow public read" 
ON public.survey_responses 
FOR SELECT 
TO anon 
USING (true);

-- 5. Performance Index
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.survey_responses(created_at DESC);
