-- ==========================================================
-- Relational Schema for Adaptive Campus Social Survey
-- ==========================================================
-- Based on the 10-core-question incident-based design

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Respondents (Metadata without strict PII)
CREATE TABLE respondents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anonymous_code VARCHAR UNIQUE,
    age_range VARCHAR,
    year_of_study VARCHAR,
    program VARCHAR,
    hosteller_or_day_scholar VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Survey Sessions (Tracks the instance of a survey)
CREATE TABLE survey_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    respondent_id UUID REFERENCES respondents(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR CHECK (status IN ('started', 'completed', 'abandoned')),
    survey_version VARCHAR DEFAULT 'v_adaptive_1.0',
    completion_time_seconds INT
);

-- 3. Questions (Master list)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_code VARCHAR UNIQUE NOT NULL, -- e.g., 'Q1', 'Q2A'
    question_text TEXT NOT NULL,
    question_type VARCHAR CHECK (question_type IN ('single_select', 'multi_select', 'scale', 'short_text', 'long_text', 'info')),
    section VARCHAR,
    objective_code VARCHAR,
    research_question_code VARCHAR,
    is_active BOOLEAN DEFAULT true,
    display_order INT
);

-- 4. Question Options (Available choices)
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_code VARCHAR NOT NULL,
    option_label TEXT NOT NULL,
    display_order INT,
    is_other_option BOOLEAN DEFAULT false
);

-- 5. Responses (The answer record per session + question)
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_session_id UUID REFERENCES survey_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,               -- For open-ended
    answer_number NUMERIC,          -- For scales
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    branch_source_question_code VARCHAR,
    branch_source_option_code VARCHAR
);

-- 6. Response Options (Multi-select / Single-select link)
CREATE TABLE response_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    question_option_id UUID REFERENCES question_options(id) ON DELETE CASCADE,
    other_text TEXT
);

-- 7. Branch Logic 
CREATE TABLE branch_logic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_question_code VARCHAR REFERENCES questions(question_code) ON DELETE CASCADE,
    source_option_code VARCHAR,
    operator VARCHAR, -- 'equals', 'in', 'lte', 'gte'
    comparison_value VARCHAR,
    target_question_code VARCHAR REFERENCES questions(question_code) ON DELETE CASCADE,
    logic_group VARCHAR
);

-- 8. Qualitative Insight Tags 
CREATE TABLE insight_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name VARCHAR UNIQUE NOT NULL
);

-- 9. Response Tags (Mapping insights)
CREATE TABLE response_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    insight_tag_id UUID REFERENCES insight_tags(id) ON DELETE CASCADE,
    coded_by VARCHAR,
    confidence_score NUMERIC
);

-- Optional: JSON Event Log table for rapid insertion / analytics backups
CREATE TABLE survey_events_json (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
