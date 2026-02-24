/* ══════════════════════════════════════════════════════════════════
   scoring.js  –  Campus Social Identity Experience
   Trait scoring configuration.  Edit weights here; no other
   files need rebuilding.
   ══════════════════════════════════════════════════════════════════

   7 Trait Dimensions
   ──────────────────
   ER  Emotional Regulation      – composure in social uncertainty
   CR  Cognitive Reflection      – depth of processing before acting
   SI  Social Initiative         – likelihood of initiating contact
   PF  Psychological Flexibility – comfort outside usual circle
   GP  Goal Persistence          – commitment to building relationships
   SE  Self-Insight              – awareness of own social patterns
   ED  Exploratory Drive         – desire for new social experiences

   Scoring Model
   ─────────────
   1. Raw Likert value (1–5) is centred:  score = value – 3  → –2 … +2
   2. If reverse: score = –score  (so high raw = low trait)
   3. Weighted contribution per trait: weighted = score × weight
   4. All weighted contributions for a trait are summed → raw_total
   5. Normalise raw_total to 0–100 using theoretical min/max
      (auto-computed by engine from this config).

   Weight range: 0.25–1.2  (no single item dominates)
   ══════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Trait IDs ─────────────────────────────────────────────────── */
const TRAITS = ['ER', 'CR', 'SI', 'PF', 'GP', 'SE', 'ED'];

/* ── Ordinal → numeric converters for non-Likert questions ─────── */
const ORDINAL_MAPS = {
    social_frequency: {
        'Never': 1, 'Rarely': 2, 'Sometimes': 3, 'Often': 4, 'Very Often': 5
    },
    friendship_ease: {
        'Very Difficult': 1, 'Difficult': 2, 'Neutral': 3, 'Easy': 4, 'Very Easy': 5
    },
    conversation_initiator: {
        'They usually start': 1,
        'It happens naturally': 3,
        'Depends on situation': 3,
        'I usually start': 5
    },
    first_interaction_comfort: {
        'Very Uncomfortable': 1, 'Uncomfortable': 2,
        'Neutral': 3, 'Comfortable': 4, 'Very Comfortable': 5
    }
};

/* ══════════════════════════════════════════════════════════════════
   QUESTION_WEIGHTS
   ────────────────
   Each key is a field name from survey.js `responses`.
   Each value is an object with:
     - trait keys  → weight (float)
     - reverse     → true if high raw score should lower the trait
   Missing reverse means forward scoring.
   ══════════════════════════════════════════════════════════════════ */
const QUESTION_WEIGHTS = {

    /* ── PANAS (Page 2) ─────────────────────────────────────────
       All PANAS weights halved vs. behavioural items.
       They modulate identity tone, not define it.
    ───────────────────────────────────────────────────────────── */
    panas_1: { ED: 0.5 },                               // Interested
    panas_2: { ER: 0.5, reverse: true },                // Distressed
    panas_3: { ED: 0.4, SI: 0.25 },                     // Excited
    panas_4: { ER: 0.5, reverse: true },                // Upset
    panas_5: { GP: 0.4 },                               // Strong
    panas_6: { SE: 0.25, reverse: true },               // Guilty
    panas_7: { ER: 0.5, PF: 0.25, reverse: true },      // Scared
    panas_8: { PF: 0.4, reverse: true },                // Hostile
    panas_9: { SI: 0.4, ED: 0.4 },                      // Enthusiastic
    panas_10: { SE: 0.5 },                               // Proud
    panas_11: { ER: 0.4, reverse: true },                // Irritable
    panas_12: { CR: 0.5 },                               // Alert
    panas_13: { SE: 0.5, reverse: true },                // Ashamed
    panas_14: { ED: 0.4, GP: 0.25 },                     // Inspired
    panas_15: { ER: 0.5, SI: 0.25, reverse: true },      // Nervous
    panas_16: { GP: 0.5 },                               // Determined
    panas_17: { CR: 0.5 },                               // Attentive
    panas_18: { ER: 0.4, reverse: true },                // Jittery
    panas_19: { SI: 0.5 },                               // Active
    panas_20: { ER: 0.5, PF: 0.25, reverse: true },      // Afraid

    /* ── Behavioural questions (Pages 4–6) ─────────────────────
       These are the primary identity drivers — full weights.
    ───────────────────────────────────────────────────────────── */

    // Q6 – Social Satisfaction
    social_satisfaction: { SE: 1.0, GP: 0.5 },

    // Q7 – Belonging
    belonging: { SE: 1.0, PF: 0.8 },

    // Q8 – Close Friends
    close_friends: { GP: 1.2 },

    // Q9 – Social Isolation (reverse: isolated → low SI, low SE)
    social_isolation: { SI: 1.0, SE: 0.8, reverse: true },

    // Q10 – Social Frequency (ordinal converted)
    social_frequency: { SI: 1.2 },

    // Q11 – Friendship Ease (ordinal converted)
    friendship_ease: { PF: 1.0, SI: 0.5 },

    // Q12 – Initiation Anxiety (reverse: anxious → low ER & SI)
    initiation_anxiety: { ER: 1.2, SI: 1.0, reverse: true },

    // Q13 – Overthinking (reverse: overthink → high CR but low ER)
    //   CR gets reverse:false here so overthinking lifts CR slightly;
    //   ER is drained via reverse on the same item via split entries.
    //   We handle split by using two logical keys in the engine —
    //   but since we share a single reverse flag, we model it as:
    //   CR slight positive (overthinking = deep processing) but ER drain.
    //   Compromise: treat the item as primarily ER-draining (reverse=true).
    //   CR gets a small non-reversed boost via the engine special-case below.
    overthinking: { ER: 0.8, CR: 0.5, reverse: true },
    // NOTE: engine will un-reverse CR for this item only (see engine.js).

    // Q14 – Avoidance (reverse: avoiding → low SI & GP)
    avoidance: { SI: 1.2, GP: 0.5, reverse: true },

    // Q15 – Judgment Concern (reverse: worried → low ER & PF)
    judgment_concern: { ER: 1.2, PF: 0.8, reverse: true },

    // Q16 – Conversation Initiator (ordinal, symmetric)
    conversation_initiator: { SI: 1.0 },

    // Q17 – First Interaction Comfort (ordinal)
    first_interaction_comfort: { ER: 1.0, PF: 0.8 },

    // Q20 – Social Expansion Desire
    social_expansion_desire: { ED: 1.2, GP: 0.8 },

    // Q21 – Online Comfort
    //   More comfort online → slightly lower in-person PF (reverse),
    //   but higher CR (digital reflection pattern).
    //   reverse applies to PF only; CR is un-reversed in engine.js.
    online_comfort: { PF: 0.6, CR: 0.5, reverse: true },
    // NOTE: engine will un-reverse CR for this item only (see engine.js).

    // Q22 – Structured Preference (prefer low-pressure → high CR, moderate ER)
    structured_preference: { CR: 0.8, ER: 0.5 },

    // Q23 – Spontaneous Value (want spontaneity → high ED, SI)
    spontaneous_value: { ED: 1.0, SI: 0.5 },
};

/* ══════════════════════════════════════════════════════════════════
   SPECIAL_FORWARD_TRAITS
   Items where reverse = true for most traits but specific traits
   should still score forward (not reversed).
   Format: { questionKey: [traitId, ...] }
   ══════════════════════════════════════════════════════════════════ */
const SPECIAL_FORWARD_TRAITS = {
    overthinking: ['CR'],  // overthinking ↑ → CR ↑ (not reversed)
    online_comfort: ['CR'],  // online comfort ↑ → CR ↑ (not reversed)
};

/* ══════════════════════════════════════════════════════════════════
   ARCHETYPES
   ──────────────────────────────────────────────────────────────────
   Assignment: find highest + second-highest trait scores,
   then look up pair in ARCHETYPE_MAP.  Fallback: Balanced Navigator.

   Each archetype has:
     label       – display title
     tagline     – 1-line identity hook
     symbol      – Unicode glyph for visual
     gradient    – CSS gradient string
     tone        – writing tone key (used by insight templates)
     typicalHigh – trait pair that triggers this (primary, secondary)
   ══════════════════════════════════════════════════════════════════ */
const ARCHETYPES = {
    inner_architect: {
        label: 'The Inner Architect',
        tagline: 'You think before you move — and that\'s your strength.',
        symbol: '🏛',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        tone: 'reflective',
        typicalHigh: ['CR', 'ER'],
    },
    catalyst: {
        label: 'The Catalyst',
        tagline: 'Energy finds you — and others follow.',
        symbol: '⚡',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        tone: 'energetic',
        typicalHigh: ['SI', 'ED'],
    },
    steady_anchor: {
        label: 'The Steady Anchor',
        tagline: 'Where others drift, you hold ground.',
        symbol: '⚓',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        tone: 'grounded',
        typicalHigh: ['ER', 'GP'],
    },
    reflective_observer: {
        label: 'The Reflective Observer',
        tagline: 'You notice what others miss.',
        symbol: '🔭',
        gradient: 'linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)',
        tone: 'introspective',
        typicalHigh: ['CR', 'SE'],
    },
    quiet_explorer: {
        label: 'The Quiet Explorer',
        tagline: 'Curiosity pulls you forward, quietly.',
        symbol: '🌱',
        gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
        tone: 'curious',
        typicalHigh: ['ED', 'CR'],   // high ED, lower SI
    },
    bridge_builder: {
        label: 'The Bridge Builder',
        tagline: 'You connect worlds others keep apart.',
        symbol: '🌉',
        gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
        tone: 'warm',
        typicalHigh: ['PF', 'SI'],
    },
    intentional_connector: {
        label: 'The Intentional Connector',
        tagline: 'Every friendship you build is built to last.',
        symbol: '🤝',
        gradient: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
        tone: 'purposeful',
        typicalHigh: ['GP', 'SE'],
    },
    reserved_strategist: {
        label: 'The Reserved Strategist',
        tagline: 'You choose your moments — and make them count.',
        symbol: '♟',
        gradient: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
        tone: 'strategic',
        typicalHigh: ['CR', 'ER'],   // high CR, low SI variant
    },
    expansive_initiator: {
        label: 'The Expansive Initiator',
        tagline: 'The room shifts when you decide to show up.',
        symbol: '🚀',
        gradient: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
        tone: 'bold',
        typicalHigh: ['SI', 'PF'],
    },
    balanced_navigator: {
        label: 'The Balanced Navigator',
        tagline: 'You read the room and move with it.',
        symbol: '🧭',
        gradient: 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
        tone: 'adaptive',
        typicalHigh: [],             // fallback archetype
    },
};

/* ══════════════════════════════════════════════════════════════════
   ARCHETYPE_MAP
   ──────────────────────────────────────────────────────────────────
   Maps [primary, secondary] pair → archetype key.
   Primary = highest trait,  Secondary = second-highest.
   If no pair matches → balanced_navigator.
   ══════════════════════════════════════════════════════════════════ */
const ARCHETYPE_MAP = {
    'CR-ER': 'inner_architect',
    'ER-CR': 'inner_architect',
    'SI-ED': 'catalyst',
    'ED-SI': 'catalyst',
    'ER-GP': 'steady_anchor',
    'GP-ER': 'steady_anchor',
    'CR-SE': 'reflective_observer',
    'SE-CR': 'reflective_observer',
    'ED-CR': 'quiet_explorer',     // curiosity without high SI
    'CR-ED': 'quiet_explorer',
    'PF-SI': 'bridge_builder',
    'SI-PF': 'bridge_builder',
    'GP-SE': 'intentional_connector',
    'SE-GP': 'intentional_connector',
    'CR-PF': 'reserved_strategist', // reflective + flexible but less initiative
    'PF-CR': 'reserved_strategist',
    'SI-ER': 'expansive_initiator',
    'ER-SI': 'expansive_initiator',
    'ED-PF': 'expansive_initiator', // exploration + flexibility
    'PF-ED': 'expansive_initiator',
    'GP-ED': 'catalyst',            // driven + exploratory
    'ED-GP': 'catalyst',
    'SE-ER': 'reflective_observer',
    'ER-SE': 'reflective_observer',
    'GP-SI': 'bridge_builder',
    'SI-GP': 'bridge_builder',
};

/* ══════════════════════════════════════════════════════════════════
   INSIGHT_TEMPLATES
   ──────────────────────────────────────────────────────────────────
   Dynamic personalised text based on trait thresholds.
   Array of { condition: fn(traits) → bool, text: string }
   First matching condition is shown.
   ══════════════════════════════════════════════════════════════════ */
const INSIGHT_TEMPLATES = {
    high: {
        ER: 'Social uncertainty rarely rattles you — you process pressure quietly and move through it.',
        CR: 'You tend to think before you speak, which makes your words land with more precision.',
        SI: 'You have a natural pull toward connection — conversations often start because of you.',
        PF: 'You drift comfortably between different groups and contexts without losing yourself.',
        GP: 'When you decide someone matters to you, you show up consistently \u2014 and that\'s rare.',
        SE: 'You have an unusually clear window into your own emotions and social tendencies.',
        ED: 'New social territory feels like invitation, not threat — you actively seek it out.',
    },
    low: {
        ER: 'Social tension can knock you off balance — but that sensitivity also makes you perceptive.',
        CR: 'You lead with instinct over analysis. Sometimes that energy is exactly what a moment needs.',
        SI: 'You may wait for the right moment rather than create it — patience is also a strategy.',
        PF: 'You thrive in familiar environments and relationships. Depth over breadth.',
        GP: 'Long-term relationship investment doesn\'t come naturally right now — that can shift.',
        SE: 'Mapping your own patterns in social situations is still a developing skill for you.',
        ED: 'New social experiences feel more uncertain than exciting right now.',
    },
};

/* ══════════════════════════════════════════════════════════════════
   TRAIT_LABELS  –  Display-friendly names + micro-descriptions
   ══════════════════════════════════════════════════════════════════ */
const TRAIT_META = {
    ER: { label: 'Emotional Regulation', desc: 'Composure in social uncertainty' },
    CR: { label: 'Cognitive Reflection', desc: 'Depth of processing before acting' },
    SI: { label: 'Social Initiative', desc: 'Likelihood of starting connections' },
    PF: { label: 'Psychological Flexibility', desc: 'Comfort outside your usual circle' },
    GP: { label: 'Goal Persistence', desc: 'Commitment to meaningful relationships' },
    SE: { label: 'Self-Insight', desc: 'Awareness of your own social patterns' },
    ED: { label: 'Exploratory Drive', desc: 'Desire for new social experiences' },
};
