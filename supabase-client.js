/**
 * Campus Social Experience Survey
 * supabase-client.js
 */

'use strict';

/* ═══════════════════════════════════════════════════════
    CONFIG
 ═══════════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://qshyjapgnhspphqimfcp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzaHlqYXBnbmhzcHBocWltZmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTY2OTMsImV4cCI6MjA4NzQ3MjY5M30.6ZYUTkuZwp5wJIIMOPoYZUIPRZ_5Fzzzr8UbiWZjBpw';

// Will be set once the CDN script loads
let _supabase = null;

/**
 * Get or initialise the Supabase client
 */
function getSupabase() {
    if (_supabase) return _supabase;

    if (typeof supabase === 'undefined') {
        console.error('[Supabase] CDN script not found. Check your index.html script tags.');
        return null;
    }

    try {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('[Supabase] Client initialised');
        return _supabase;
    } catch (err) {
        console.error('[Supabase] Initialisation error:', err);
        return null;
    }
}

/**
 * Convenience for manual init if needed
 */
function initSupabase() {
    return getSupabase();
}

/* ═══════════════════════════════════════════════════════
    INSERTION LOGIC
 ═══════════════════════════════════════════════════════ */

/**
 * Normalises and saves a record.
 */
async function saveToSupabase(record) {
    const sb = getSupabase();
    if (!sb) return;

    const dbRecord = sanitiseForDB(record);
    console.log('[Supabase] Preparing to save record:', dbRecord);

    try {
        const { data, error } = await sb
            .from('survey_responses')
            .insert([dbRecord])
            .select();

        if (error) {
            console.error('[Supabase] Insert error:', error);
            throw error;
        }
        console.log('[Supabase] Success: Saved response to cloud', data);
        return data;
    } catch (err) {
        console.error('[Supabase] Save failed:', err);
        throw err;
    }
}

/**
 * Maps JS camelCase object to SQL snake_case columns
 */
function sanitiseForDB(record) {
    const toInt = (v) => parseInt(v) || 0;
    const toNum = (v) => parseFloat(v) || 0;

    return {
        // Demographics
        age_group: record.age_group || null,
        year_of_study: record.year_of_study || null,
        program: record.program || null,
        stream: record.stream || null,
        gender: record.gender || null,
        residence: record.residence || null,

        // PANAS Score
        panas_1: toInt(record.panas_1), panas_2: toInt(record.panas_2),
        panas_3: toInt(record.panas_3), panas_4: toInt(record.panas_4),
        panas_5: toInt(record.panas_5), panas_6: toInt(record.panas_6),
        panas_7: toInt(record.panas_7), panas_8: toInt(record.panas_8),
        panas_9: toInt(record.panas_9), panas_10: toInt(record.panas_10),
        panas_11: toInt(record.panas_11), panas_12: toInt(record.panas_12),
        panas_13: toInt(record.panas_13), panas_14: toInt(record.panas_14),
        panas_15: toInt(record.panas_15), panas_16: toInt(record.panas_16),
        panas_17: toInt(record.panas_17), panas_18: toInt(record.panas_18),
        panas_19: toInt(record.panas_19), panas_20: toInt(record.panas_20),
        panas_positive_score: toNum(record.panas_positive_score),
        panas_negative_score: toNum(record.panas_negative_score),

        // Core Experience
        social_satisfaction: toInt(record.social_satisfaction),
        belonging: toInt(record.belonging),
        close_friends: toInt(record.close_friends),
        social_isolation: toInt(record.social_isolation),
        social_frequency: record.social_frequency || null,
        friendship_ease: record.friendship_ease || null,

        // Friendship Mechanics
        initiation_anxiety: toInt(record.initiation_anxiety),
        overthinking: toInt(record.overthinking),
        avoidance: toInt(record.avoidance),
        judgment_concern: toInt(record.judgment_concern),
        conversation_initiator: record.conversation_initiator || null,
        first_interaction_comfort: record.first_interaction_comfort || null,

        // Source of Friends (JSON/Boolean map)
        fs_classes: !!record.fs_classes,
        fs_hostel: !!record.fs_hostel,
        fs_clubs: !!record.fs_clubs,
        fs_mutual: !!record.fs_mutual,
        fs_online: !!record.fs_online,
        fs_other: !!record.fs_other,

        // Interaction Barriers
        ib_fear_rejection: !!record.ib_fear_rejection,
        ib_not_knowing: !!record.ib_not_knowing,
        ib_formed_groups: !!record.ib_formed_groups,
        ib_no_topic: !!record.ib_no_topic,
        ib_low_energy: !!record.ib_low_energy,
        ib_nothing: !!record.ib_nothing,
        ib_other: !!record.ib_other,

        // Needs & Desires
        social_expansion_desire: toInt(record.social_expansion_desire),
        online_comfort: toInt(record.online_comfort),
        structured_preference: toInt(record.structured_preference),
        spontaneous_value: toInt(record.spontaneous_value),

        // Qualitative
        social_friction_open: record.social_friction_open || null,
        safety_factors: record.safety_factors || null,

        // ── Trait Engine ──
        completion_time_seconds: toInt(record.completion_time_seconds),
        trait_er: toNum(record.trait_ER),
        trait_cr: toNum(record.trait_CR),
        trait_si: toNum(record.trait_SI),
        trait_pf: toNum(record.trait_PF),
        trait_gp: toNum(record.trait_GP),
        trait_se: toNum(record.trait_SE),
        trait_ed: toNum(record.trait_ED),
        archetype: record.archetype || null,
        suspect_submission: !!record.suspect_submission,
    };
}

/**
 * Saves adaptive survey responses to the JSON event log (from new adaptive survey model).
 */
async function saveAdaptiveToSupabase(responses) {
    const sb = getSupabase();
    if (!sb) return;

    // Calculate completion time
    const completed_at = Date.now();
    const started_at = responses.started_at || completed_at;
    const completion_time_seconds = Math.round((completed_at - started_at) / 1000);

    // Extract demographics
    const age_group = responses.d1 || null;
    const year_of_study = responses.d2 || null;
    const program = responses.d3 || null;
    const gender = responses.d4 || null;
    const residence = responses.d5 || null;

    // Clean payload of started_at, demographics, and timestamps so "answers" is just questions
    const cleanResponses = { ...responses };
    const timestamps = cleanResponses.timestamps || {};
    delete cleanResponses.started_at;
    delete cleanResponses.timestamps;
    delete cleanResponses.d1;
    delete cleanResponses.d2;
    delete cleanResponses.d3;
    delete cleanResponses.d4;
    delete cleanResponses.d5;
    const computedProfile = cleanResponses.computed_profile || null;
    delete cleanResponses.computed_profile;

    // We use a structured JSON log for the MVP of the adaptive survey
    const jsonPayload = {
        survey_session_id: 'sess_' + Math.random().toString(36).substr(2, 9),
        respondent_id: 'anon_' + Math.random().toString(36).substr(2, 9),
        computed_profile: computedProfile,
        answers: Object.keys(cleanResponses).map(key => {
            const planDef = typeof SURVEY_PLAN !== 'undefined' ? SURVEY_PLAN[key] : null;
            const qType = planDef ? planDef.type : 'unknown';
            let ansValue = cleanResponses[key];

            // Cast numeric scale responses to integer
            if (qType === 'scale') {
                ansValue = Number(ansValue);
            }

            const ansTimestamp = timestamps[key] || null;

            return {
                question_code: key.toUpperCase(),
                type: qType,
                answer: ansValue,
                answered_at: ansTimestamp
            };
        })
    };

    const dbRow = {
        payload: jsonPayload,
        trait_id: computedProfile ? computedProfile.id : null,
        age_group,
        year_of_study,
        program,
        gender,
        residence,
        completion_time_seconds
    };

    console.log('[Supabase] Preparing to save adaptive record:', dbRow);

    try {
        const { data, error } = await sb
            .from('survey_events_json')
            .insert([dbRow])
            .select();

        if (error) {
            console.error('[Supabase] Insert error for adaptive survey:', error);
            throw error;
        }
        console.log('[Supabase] Success: Saved adaptive response tracking event', data);
        return data && data[0] ? data[0] : true;
    } catch (err) {
        console.error('[Supabase] Adaptive save failed:', err);
        throw err;
    }
}

/**
 * Updates a survey result with user alignment feedback
 */
async function updateFeedbackInSupabase(recordId, feedback) {
    const sb = getSupabase();
    if (!sb || !recordId) return;

    try {
        const { error } = await sb
            .from('survey_events_json')
            .update({
                feedback_rating: feedback.rating,
                feedback_relatable: feedback.relatable,
                feedback_relevant: feedback.relevant,
                feedback_comment: feedback.comment || ''
            })
            .eq('id', recordId);

        if (error) throw error;
        console.log('[Supabase] Feedback recorded for record:', recordId);
        return true;
    } catch (err) {
        console.error('[Supabase] Feedback update failed:', err);
        return false;
    }
}

/* ═══════════════════════════════════════════════════════
    FETCHING LOGIC (For Admin Dashboard)
 ═══════════════════════════════════════════════════════ */

/**
 * Fetches all responses. Used in admin.js
 */
async function fetchFromSupabase() {
    const sb = getSupabase();
    if (!sb) return null;

    try {
        const { data, error } = await sb
            .from('survey_responses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('[Supabase] Fetch failed:', err);
        return null;
    }
}

/**
 * Fetches behavioral pattern aggregates directly from the SQL views
 */
async function fetchBehaviourPatterns() {
    const sb = getSupabase();
    if (!sb) return null;

    try {
        const [contextsRes, initiationRes, barriersRes, digitalRes] = await Promise.all([
            sb.from('interaction_contexts').select('*'),
            sb.from('initiation_style').select('*'),
            sb.from('barriers_to_entry').select('*'),
            sb.from('digital_preference').select('*')
        ]);

        if (contextsRes.error) throw contextsRes.error;
        if (initiationRes.error) throw initiationRes.error;
        if (barriersRes.error) throw barriersRes.error;
        if (digitalRes.error) throw digitalRes.error;

        return {
            contexts: contextsRes.data,
            initiation: initiationRes.data,
            barriers: barriersRes.data,
            digital: digitalRes.data
        };
    } catch (err) {
        console.error('[Supabase] Failed to fetch behaviour patterns:', err);
        return null;
    }
}
