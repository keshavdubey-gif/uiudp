/**
 * scoring-engine.js
 * Implementation of the Adaptive Survey Scoring Rubric
 */

'use strict';

const SCORING_CONFIG = {
    q1: {
        yes: { social_openness: 3, initiation_confidence: 2 },
        sometimes: { social_openness: 2, initiation_confidence: 1 },
        not_really: { social_openness: 0, initiation_confidence: 0 },
        prefer_known_people: { social_openness: 1, initiation_confidence: 0 }
    },
    q1a: {
        difficult_to_start: { low_pressure_preference: 2 },
        comfortable_with_familiar: { low_pressure_preference: 1 },
        prefer_small_selective_circles: { low_pressure_preference: 2 },
        unsure_what_to_say: { low_pressure_preference: 1 },
        _caps: { low_pressure_preference: 3 }
    },
    q2a: {
        class: { shared_context_reliance: 2 },
        group_assignment: { shared_context_reliance: 3 },
        club: { shared_context_reliance: 2 },
        event: { shared_context_reliance: 1 },
        mutual_friend: { shared_context_reliance: 2 },
        hostel_common_area: { shared_context_reliance: 1 },
        online_community: { shared_context_reliance: 1 }
    },
    q2b: {
        shared_task: { shared_context_reliance: 3 },
        academic_need: { shared_context_reliance: 2 },
        shared_interest: { shared_context_reliance: 2 },
        i_approached: { initiation_confidence: 3 },
        mutual_friend_introduced: { shared_context_reliance: 1 },
        casual_moment: { shared_context_reliance: 1, initiation_confidence: 1 },
        _caps: { shared_context_reliance: 4, initiation_confidence: 3 }
    },
    q2c: {
        me: { initiation_confidence: 4 },
        them: { initiation_confidence: 1 },
        both_naturally: { initiation_confidence: 3 },
        dont_remember: { initiation_confidence: 1 }
    },
    q2d: {
        "1": { initiation_confidence: 0, low_pressure_preference: 3 },
        "2": { initiation_confidence: 1, low_pressure_preference: 2 },
        "3": { initiation_confidence: 2, low_pressure_preference: 1 },
        "4": { initiation_confidence: 3, low_pressure_preference: 0 },
        "5": { initiation_confidence: 4, low_pressure_preference: 0 }
    },
    q3: {
        classes: { social_openness: 1, shared_context_reliance: 2 },
        group_assignments: { social_openness: 1, shared_context_reliance: 3 },
        clubs: { social_openness: 1, shared_context_reliance: 2 },
        events: { social_openness: 1, shared_context_reliance: 1 },
        mutual_friends: { social_openness: 1, shared_context_reliance: 2 },
        shared_hobbies: { social_openness: 1, shared_context_reliance: 2 },
        hostel_common_spaces: { social_openness: 1, shared_context_reliance: 1 },
        online_communities: { social_openness: 1, shared_context_reliance: 1 },
        _caps: { social_openness: 4, shared_context_reliance: 5 }
    },
    q4: {
        yes: { low_pressure_preference: 1, shared_context_reliance: 1 },
        sometimes: { low_pressure_preference: 1, shared_context_reliance: 1 },
        no: { low_pressure_preference: 0, shared_context_reliance: 0 }
    },
    q4a: {
        shared_activities: { shared_context_reliance: 3 },
        small_groups: { low_pressure_preference: 3 },
        one_on_one: { low_pressure_preference: 2 },
        informal_casual: { low_pressure_preference: 2 },
        someone_else_starts: { low_pressure_preference: 2 },
        online_interactions: { low_pressure_preference: 2, digital_comfort: 3 },
        common_interest: { shared_context_reliance: 2 },
        _caps: { low_pressure_preference: 5, shared_context_reliance: 4, digital_comfort: 3 }
    },
    q5: {
        yes: { initiation_confidence: 0, low_pressure_preference: 2 },
        sometimes: { initiation_confidence: 1, low_pressure_preference: 1 },
        no: { initiation_confidence: 3, low_pressure_preference: 0 }
    },
    q5a: {
        people_in_groups: { low_pressure_preference: 1, shared_context_reliance: 2 },
        dont_know_how_to_start: { low_pressure_preference: 2 },
        worry_about_judgment: { low_pressure_preference: 3 },
        no_reason_to_talk: { shared_context_reliance: 3 },
        too_formal: { low_pressure_preference: 2 },
        too_public: { low_pressure_preference: 3 },
        may_not_be_interested: { low_pressure_preference: 1 },
        _caps: { low_pressure_preference: 5, shared_context_reliance: 3 }
    },
    q5b: {
        wait_for_someone: { initiation_confidence: 1, low_pressure_preference: 2 },
        observe: { initiation_confidence: 1, low_pressure_preference: 3 },
        talk_only_if_needed: { initiation_confidence: 1, low_pressure_preference: 1 },
        leave: { initiation_confidence: 0, low_pressure_preference: 2 },
        stick_to_known_people: { initiation_confidence: 0, low_pressure_preference: 1 },
        use_phone_avoid: { initiation_confidence: 0, low_pressure_preference: 1 },
        _caps: { initiation_confidence: 2, low_pressure_preference: 4 }
    },
    q6: {
        shared_interest: { social_openness: 2, shared_context_reliance: 2 },
        academic_reason: { social_openness: 1, shared_context_reliance: 2 },
        mutual_friend: { social_openness: 1, shared_context_reliance: 1 },
        curiosity: { social_openness: 3, shared_context_reliance: 0 },
        need_for_company: { social_openness: 2, shared_context_reliance: 0 },
        networking: { social_openness: 2, shared_context_reliance: 0 },
        group_activity: { social_openness: 1, shared_context_reliance: 3 },
        approachable: { social_openness: 2, shared_context_reliance: 0 },
        _caps: { social_openness: 4, shared_context_reliance: 4 }
    },
    q6a: {
        shared_interest: { social_openness: 2, shared_context_reliance: 2 },
        academic_reason: { social_openness: 1, shared_context_reliance: 2 },
        mutual_friend: { social_openness: 1, shared_context_reliance: 1 },
        curiosity: { social_openness: 3, shared_context_reliance: 0 },
        need_for_company: { social_openness: 2, shared_context_reliance: 0 },
        networking: { social_openness: 2, shared_context_reliance: 0 },
        group_activity: { social_openness: 1, shared_context_reliance: 3 },
        approachable: { social_openness: 2, shared_context_reliance: 0 }
    },
    q7: {
        start_quickly: { initiation_confidence: 4, low_pressure_preference: 0, social_openness: 3 },
        clear_reason: { initiation_confidence: 2, low_pressure_preference: 0, social_openness: 2 },
        wait_for_someone: { initiation_confidence: 1, low_pressure_preference: 2, social_openness: 1 },
        observe_first: { initiation_confidence: 1, low_pressure_preference: 3, social_openness: 1 },
        avoid_interacting: { initiation_confidence: 0, low_pressure_preference: 2, social_openness: 0 }
    },
    q8: {
        one_on_one: { low_pressure_preference: 3, shared_context_reliance: 0 },
        group_activity: { low_pressure_preference: 1, shared_context_reliance: 3 },
        depends: { low_pressure_preference: 1, shared_context_reliance: 1 },
        neither_easy: { low_pressure_preference: 2, shared_context_reliance: 0 }
    },
    q9: {
        online: { digital_comfort: 4, low_pressure_preference: 2 },
        in_person: { digital_comfort: 0, low_pressure_preference: 0 },
        both_similar: { digital_comfort: 2, low_pressure_preference: 0 },
        neither_easy: { digital_comfort: 0, low_pressure_preference: 1 }
    },
    q9a: {
        less_pressure: { digital_comfort: 2, low_pressure_preference: 3 },
        more_time: { digital_comfort: 2, low_pressure_preference: 2 },
        easier_common_interest: { digital_comfort: 2, low_pressure_preference: 0 },
        less_judgment: { digital_comfort: 2, low_pressure_preference: 3 },
        easier_approach: { digital_comfort: 2, low_pressure_preference: 1 },
        _caps: { digital_comfort: 5, low_pressure_preference: 5 }
    }
};

const TRAITS = [
    'social_openness',
    'initiation_confidence',
    'low_pressure_preference',
    'shared_context_reliance',
    'digital_comfort'
];

/**
 * Calculates adaptive scores based on user responses
 */
function calculateAdaptiveScores(responses) {
    const raw_points = {};
    TRAITS.forEach(t => { raw_points[t] = { earned: 0, possible_seen: 0 }; });

    // Iterate through all questions in SCORING_CONFIG
    for (const qId in SCORING_CONFIG) {
        const rules = SCORING_CONFIG[qId];
        const userValue = responses[qId];

        // Only score if the question was seen/answered
        if (userValue === undefined || userValue === null) continue;

        const caps = rules._caps || {};
        const traitContributions = {};
        TRAITS.forEach(t => traitContributions[t] = 0);

        // Calculate earned points for this question
        if (Array.isArray(userValue)) {
            // Multi-select
            userValue.forEach(optionId => {
                const points = rules[optionId];
                if (points) {
                    for (const trait in points) {
                        traitContributions[trait] += points[trait];
                    }
                }
            });
            // Apply caps
            for (const trait in caps) {
                if (traitContributions[trait] > caps[trait]) {
                    traitContributions[trait] = caps[trait];
                }
            }
        } else {
            // Single select or scale
            const points = rules[userValue];
            if (points) {
                for (const trait in points) {
                    traitContributions[trait] += points[trait];
                }
            }
        }

        // Add to totals
        for (const trait in traitContributions) {
            if (!raw_points[trait]) continue; // Safety check
            raw_points[trait].earned += traitContributions[trait];
        }

        // Calculate max possible points for questions seen
        // (Highest points any SINGLE valid pathway in this question could have yielded)
        // For simplicity in this logic, we look at all options defined for this question
        // and find the max sum possible for each trait.
        for (const trait of TRAITS) {
            let maxForThisTrait = 0;
            if (Array.isArray(userValue)) {
                // For multi-select, it's the cap if exists, or a realistic max (sum of top 2-3 options)
                if (caps[trait]) {
                    maxForThisTrait = caps[trait];
                } else {
                    const allVals = [];
                    for (const optId in rules) {
                        if (optId.startsWith('_')) continue;
                        const v = rules[optId][trait] || 0;
                        if (v > 0) allVals.push(v);
                    }
                    // Take sum of top 2 values as the "possible" baseline for a strong match
                    allVals.sort((a, b) => b - a);
                    maxForThisTrait = (allVals[0] || 0) + (allVals[1] || 0);
                }
            } else {
                // For single-select, it's the max single value
                for (const optId in rules) {
                    if (optId.startsWith('_')) continue;
                    const p = rules[optId][trait] || 0;
                    if (p > maxForThisTrait) maxForThisTrait = p;
                }
            }
            raw_points[trait].possible_seen += maxForThisTrait;
        }
    }

    // Normalize
    const scores = {};
    TRAITS.forEach(t => {
        const { earned, possible_seen } = raw_points[t];
        scores[t] = possible_seen > 0 ? Math.round((earned / possible_seen) * 100) : 0;
    });

    // Derive Primary Style
    const style = deriveInteractionStyle(scores, responses);

    // Detect key social signals
    const signals = detectSignals(scores, responses);

    return {
        primary_style: style.id,
        style_label: style.label,
        style_description: style.description,
        scores,
        raw_points,
        signals
    };
}

function detectSignals(scores, responses) {
    const signals = [];
    const { social_openness: so, initiation_confidence: ic, low_pressure_preference: lp, shared_context_reliance: sc, digital_comfort: dc } = scores;

    // Based on User Feedback and Rules.json signals logic
    if (so > 60 && ic < 50) {
        signals.push({ id: 'initiation_gap', label: 'Initiation Gap', desc: 'You have a high drive to meet people but find the first step challenging.' });
    }
    if (sc > 55) {
        signals.push({ id: 'context_anchor', label: 'Context Anchor', desc: 'Situational triggers (like classes or tasks) are your primary social bridge.' });
    }
    if (lp > 60) {
        signals.push({ id: 'safety_first', label: 'Safety Seeker', desc: 'You prioritize low-judgment, low-pressure environments for interaction.' });
    }
    if (dc > 50) {
        signals.push({ id: 'digital_first', label: 'Digital First', desc: 'You feel significantly more comfortable building initial bridges online.' });
    }
    if (responses.q8 === 'one_on_one') {
        signals.push({ id: 'depth_seeker', label: 'Depth Seeker', desc: 'You excel in 1-on-1 settings where you can build deeper individual connections.' });
    }
    if (responses.q7 === 'wait_for_someone' || responses.q7 === 'observe_first') {
        signals.push({ id: 'patience_observer', label: 'Patient Observer', desc: 'You prefer to read the room and let the social momentum build before engaging.' });
    }

    return signals;
}

function deriveInteractionStyle(scores, responses) {
    const { social_openness: so, initiation_confidence: ic, low_pressure_preference: lp, shared_context_reliance: sc, digital_comfort: dc } = scores;

    // Rule 1: Direct Initiator
    if (ic >= 60 && so >= 55) {
        return {
            id: 'direct_initiator',
            label: 'Direct Initiator',
            description: 'You seem comfortable taking the first step in social situations. You may find it easier than most people to begin conversations and build momentum quickly.'
        };
    }

    // Rule 2: Low-Pressure Connector
    if (lp >= 60 && dc >= 50) {
        return {
            id: 'low_pressure_connector',
            label: 'Low-Pressure Connector',
            description: 'You appear to prefer spaces where interaction feels less intense, less public, and less judgment-heavy. Smaller groups or online-first settings may work best.'
        };
    }

    // Rule 3: Context-Based Connector
    if (sc >= 55 && lp < 65) {
        return {
            id: 'context_based_connector',
            label: 'Context-Based Connector',
            description: 'You seem to connect best when there’s a shared reason to interact, such as classes, activities, or common interests. Structured settings may make social interaction easier.'
        };
    }

    // Rule 4: Warm-Up Socializer
    if (lp >= 55 && ic >= 25 && ic <= 70 && (responses.q7 === 'wait_for_someone' || responses.q7 === 'observe_first')) {
        return {
            id: 'warm_up_socializer',
            label: 'Warm-Up Socializer',
            description: 'You tend to ease into new interactions rather than jumping in immediately. You may feel most comfortable when there’s time to observe, a shared context, or a lower-pressure environment.'
        };
    }

    // Rule 5: Selective Socializer
    if (so >= 35 && so <= 75 && sc >= 35 && sc <= 75 && (responses.q1 === 'sometimes' || responses.q1 === 'prefer_known_people')) {
        return {
            id: 'selective_socializer',
            label: 'Selective Socializer',
            description: 'You are open to connection but prefer the right context. You may favor meaningful or relevant interactions rather than casual small talk.'
        };
    }

    // Rule 6: Familiar-Circle Preferer
    if (so < 45 && ic < 45) {
        return {
            id: 'familiar_circle_preferer',
            label: 'Familiar-Circle Preferer',
            description: 'You thrive in familiar environments and relationships. You prefer depth over breadth and usually stick to people you already know well.'
        };
    }

    // Fallback
    return {
        id: 'balanced_navigator',
        label: 'Balanced Navigator',
        description: 'You read the room and move with it, adapting your social approach to the specific context and people around you.'
    };
}
