/**
 * Campus Social Research Intelligence Configuration
 * instructions.js - Blueprint for the Research Intelligence Dashboard
 */

window.RESEARCH_INSTRUCTIONS = {
    "engine_meta": {
        "name": "campus_social_interaction_dashboard",
        "version": "3.0.0",
        "goal": "To understand how university students build social connections on campus, including how they initiate conversations, what motivates them, and what factors influence their willingness to engage."
    },
    "pages": [
        {
            "id": "unified_analysis",
            "title": "1. Master Question Analysis (Unified)",
            "summary": "This section merges data from both the Adaptive and Traditional survey databases to show question-level metrics side-by-side.",
            "insights": [
                "Combines responses from the previous year (Traditional) and current year (Adaptive).",
                "Identifies shifting trends in social anxiety and connection barriers.",
                "Provides the most comprehensive view of the student social landscape."
            ],
            "widgets": [
                { "id": "ua_overall", "title": "Dataset Composition", "type": "pie", "field": "source" },
                { "id": "ua_questions", "title": "Complete Question Breakdown", "type": "unified_question_list" }
            ]
        },
        {
            "id": "respondent_profile",
            "title": "2. Respondent Profile",
            "summary": "This tells us whether emerging patterns are campus-wide or specific to student subgroups.",
            "insights": [
                "Identifies demographic biases in the dataset.",
                "Allows for comparison between hostellers vs day-scholars.",
                "Segments students by Year of Study to see if seniors experience less anxiety."
            ],
            "widgets": [
                { "id": "rp_1", "title": "Year of Study Breakdown", "type": "pie", "field": "year_of_study" },
                { "id": "rp_2", "title": "Residence Type Distribution", "type": "bar", "field": "residence" },
                { "id": "rp_3", "title": "Gender Representation", "type": "donut", "field": "gender" },
                { "id": "rp_4", "title": "Academic Program Split", "type": "horizontal_bar", "field": "program" }
            ]
        },
        {
            "id": "initiation_insights",
            "title": "3. Conversation Initiation Insights",
            "summary": "Investigates how students currently bridge the gap to strangers.",
            "insights": [
                "Most students wait for a reason or an 'observer' anchor before talking.",
                "Spontaneous interaction is rarer than task-based interaction.",
                "Initiation anxiety is high even for those with high social openness."
            ],
            "widgets": [
                { "id": "in_1", "title": "General Openness to Talking to Strangers", "type": "bar", "field": "q1" },
                { "id": "in_2", "title": "Trigger for Last New Interaction", "type": "horizontal_bar", "field": "q2b" },
                { "id": "in_3", "title": "Interaction Initiator (Self vs Other)", "type": "pie", "field": "q2c" },
                { "id": "in_4", "title": "Behaviour When Entering New Groups", "type": "bar", "field": "q7" },
                { "id": "in_5", "title": "Interaction Comfort Score (1-5)", "type": "bar", "field": "q2d" }
            ]
        },
        {
            "id": "context_insights",
            "title": "4. Interaction Context & Environment",
            "summary": "Answers where and how students feel safest meeting people.",
            "insights": [
                "Common interest activities appear to be the strongest social bridge.",
                "Small groups are consistently preferred over large unstructured events.",
                "Online communities serve as a 'warm-up' layer for many students."
            ],
            "widgets": [
                { "id": "cx_1", "title": "Most Common Meeting Environments", "type": "multi_bar", "field": "q3" },
                { "id": "cx_2", "title": "Contexts Rated as 'Easier'", "type": "horizontal_bar", "field": "q4a" },
                { "id": "cx_3", "title": "One-on-One vs Group Activity Preference", "type": "donut", "field": "q8" },
                { "id": "cx_4", "title": "Online vs In-Person Ease", "type": "bar", "field": "q9" }
            ]
        },
        {
            "id": "barriers_insights",
            "title": "5. Barriers, Hesitation & Comfort",
            "summary": "Reveals the factors that prevent students from initiating.",
            "insights": [
                "Judgment worry and lack of a 'social entry point' are primary blockers.",
                "Being in existing groups acts as a signal of 'unapproachability' to others.",
                "The 'phone-avoidance' behavior is a major signal of initiation anxiety."
            ],
            "widgets": [
                { "id": "br_1", "title": "Frequency of Hesitation/Avoidance", "type": "bar", "field": "q5" },
                { "id": "br_2", "title": "Top Barriers to Entry", "type": "ranked_bar", "field": "q5a" },
                { "id": "br_3", "title": "Fallback Avoidance Behaviours", "type": "horizontal_bar", "field": "q5b" }
            ]
        },
        {
            "id": "motivation_insights",
            "title": "6. Motivation Insights",
            "summary": "What is the primary driver for students to break their silence?",
            "insights": [
                "Students often need a practical or shared reason to talk.",
                "Curiosity is high, but needs a 'trigger' to turn into action.",
                "Networking is a weak motivator compared to peer academic support."
            ],
            "widgets": [
                { "id": "mt_1", "title": "Primary Interaction Motivations", "type": "multi_bar", "field": "q6" },
                { "id": "mt_2", "title": "Strongest Driver", "type": "pie", "field": "q6" } // Using count of entries
            ]
        },
        {
            "id": "trait_insights",
            "title": "7. Social Style & Trait Insights",
            "summary": "High-level profiling of the student body based on the scoring engine.",
            "insights": [
                "Maps dominance of 'Context-Based Connectors' on campus.",
                "Identifies the 'Initiation Gap' (High drive, Low confidence).",
                "Distribution of trait scores reveals the need for digital mediation."
            ],
            "widgets": [
                { "id": "tr_1", "title": "Average Trait Scores (0-100)", "type": "radar", "fields": ["trait_social_openness", "trait_initiation_confidence", "trait_low_pressure_preference", "trait_shared_context_reliance", "trait_digital_comfort"] },
                { "id": "tr_2", "title": "Interaction Style Distribution", "type": "pie", "field": "primary_style" },
                { "id": "tr_3", "title": "Signal Prevalence (High Potential Markers)", "type": "signal_panel" }
            ]
        },
        {
            "id": "qualitative_themes",
            "title": "8. Qualitative Themes & Quotes",
            "summary": "Deep dive into student voices to humanize the data.",
            "insights": [
                "Student suggestions often center around interest-matching.",
                "Personal stories reveal high emotional tension in group entry.",
                "Word cloud surfaces the 'shared task' vocabulary."
            ],
            "widgets": [
                { "id": "ql_1", "title": "Top Suggestion Keywords (Q10)", "type": "word_cloud", "field": "q10" },
                { "id": "ql_2", "title": "Recent Interaction Stories (Q2)", "type": "quote_list", "field": "q2" },
                { "id": "ql_3", "title": "Design Opportunity Suggestions (Q10)", "type": "quote_list", "field": "q10" }
            ]
        },
        {
            "id": "hmw_validation",
            "title": "9. HMW Validation & Synthesis",
            "summary": "The final conclusion layer mapping data to research assumptions.",
            "insights": [
                "Validates if the target problem truly exists at scale.",
                "Informs the next phase of Product Design.",
                "Confirms the necessity of interest-based social entry points."
            ],
            "widgets": [
                { "id": "hmw_1", "title": "HMW Assumption Validation Matrix", "type": "validation_matrix" },
                { "id": "hmw_2", "title": "Design Recommendations", "type": "opportunity_panel", "field": "q10" }
            ]
        },
        {
            "id": "item_analysis",
            "title": "10. Item Analysis & Data Quality",
            "summary": "Detailed breakdown of every question to identify data skews or high-engagement items.",
            "insights": [
                "Identifies questions with low response rates (skipped).",
                "Shows the distribution of answers across all multiple-choice questions.",
                "High-level mean and variance for scale-based questions."
            ],
            "widgets": [
                { "id": "ia_1", "title": "Section A: Screening Performance", "type": "question_metrics", "fields": ["q1"] },
                { "id": "ia_2", "title": "Section B: Interaction Contexts", "type": "question_metrics", "fields": ["q2a", "q2b", "q2c", "q2d"] },
                { "id": "ia_3", "title": "Section C: Natural Situations", "type": "question_metrics", "fields": ["q4", "q4a", "q4b"] },
                { "id": "ia_4", "title": "Section D: Barriers & Motivations", "type": "question_metrics", "fields": ["q5", "q5a", "q5b", "q6"] },
                { "id": "ia_5", "title": "Section E: Behavioural Patterns", "type": "question_metrics", "fields": ["q7", "q8", "q9"] },
                { "id": "ia_6", "title": "Legacy: Core Experience & Affect", "type": "question_metrics", "fields": ["social_satisfaction", "belonging", "initiation_anxiety", "overthinking", "avoidance", "judgment_concern"] }
            ]
        }
    ],
    "assumptions": [
        {
            "id": "a1",
            "label": "Students hesitate to initiate conversations",
            "test": "q5 in ['yes', 'sometimes']",
            "threshold": 50
        },
        {
            "id": "a2",
            "label": "Low-pressure environments are preferred",
            "test": "trait_low_pressure_preference > 50",
            "threshold": 60
        },
        {
            "id": "a3",
            "label": "Shared context makes interaction easier",
            "test": "trait_shared_context_reliance > 50",
            "threshold": 60
        },
        {
            "id": "a4",
            "label": "There is a need for better social entry points",
            "test": "q5a in ['no_reason_to_talk', 'dont_know_how_to_start', 'people_in_groups']",
            "threshold": 40
        },
        {
            "id": "a5",
            "label": "Digital support helps bridge the initial gap",
            "test": "q9 in ['online', 'both_similar']",
            "threshold": 30
        }
    ]
};