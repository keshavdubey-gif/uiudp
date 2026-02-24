/* ══════════════════════════════════════════════════════════════════
   engine.js  –  Campus Social Identity Experience
   Scoring engine: reads responses → computes trait vector
   → normalises → assigns archetype.

   Depends on:  scoring.js  (must load first)
   ══════════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────────
   computeTraits(responses)
   ──────────────────────────────────────────────────────────────────
   @param  responses  – the responses object from survey.js
   @returns           – { traits: {ER,CR,SI,PF,GP,SE,ED},   (0-100)
                          raw:    {ER,CR,SI,PF,GP,SE,ED},   (centred sums)
                          traitRanges: { trait: {min,max} } }
   ────────────────────────────────────────────────────────────────── */
function computeTraits(responses) {

    // ── Initialise accumulators ──────────────────────────────────────
    const raw = {};   // running weighted sum per trait
    const weightSum = {};   // max possible |contribution| per trait
    //   = Σ weight × 2   (since max |centred| = 2)
    TRAITS.forEach(t => { raw[t] = 0; weightSum[t] = 0; });

    // ── Process each scored question ─────────────────────────────────
    Object.entries(QUESTION_WEIGHTS).forEach(([field, cfg]) => {
        // Resolve raw numeric value
        let rawValue = resolveValue(field, responses);
        if (rawValue === null) return;   // question skipped → skip

        const isReverse = cfg.reverse === true;
        const centred = rawValue - 3; // –2 … +2

        TRAITS.forEach(trait => {
            const weight = cfg[trait];
            if (!weight || typeof weight !== 'number') return;

            // Determine sign: reversed unless this trait is in SPECIAL_FORWARD_TRAITS
            const isForwardException =
                SPECIAL_FORWARD_TRAITS[field] &&
                SPECIAL_FORWARD_TRAITS[field].includes(trait);

            const contribution = isReverse && !isForwardException
                ? -centred * weight
                : centred * weight;

            raw[trait] += contribution;
            weightSum[trait] += weight * 2;  // max possible for this item
        });
    });

    // ── Normalise each trait to 0–100 ────────────────────────────────
    const traits = {};
    const ranges = {};

    TRAITS.forEach(trait => {
        const minPossible = -weightSum[trait];
        const maxPossible = weightSum[trait];
        ranges[trait] = { min: minPossible, max: maxPossible };

        if (maxPossible === minPossible) {
            traits[trait] = 50;  // no data → neutral
        } else {
            const norm = (raw[trait] - minPossible) / (maxPossible - minPossible);
            traits[trait] = Math.round(Math.min(100, Math.max(0, norm * 100)));
        }
    });

    return { traits, raw, ranges };
}

/* ──────────────────────────────────────────────────────────────────
   resolveValue(field, responses)
   Converts any field to a 1–5 numeric, or null if missing/inapplicable.
   ────────────────────────────────────────────────────────────────── */
function resolveValue(field, responses) {
    const raw = responses[field];

    // Ordinal fields (text → number via map)
    if (ORDINAL_MAPS[field]) {
        const mapped = ORDINAL_MAPS[field][raw];
        return (mapped !== undefined) ? mapped : null;
    }

    // Numeric Likert or already numeric
    const num = parseInt(raw, 10);
    if (isNaN(num) || num < 1 || num > 5) return null;
    return num;
}

/* ──────────────────────────────────────────────────────────────────
   assignArchetype(traits)
   ──────────────────────────────────────────────────────────────────
   Top-2 Dominance Model.
   Returns archetype key string.
   ────────────────────────────────────────────────────────────────── */
function assignArchetype(traits) {
    // Sort traits descending
    const sorted = TRAITS
        .map(t => ({ trait: t, score: traits[t] }))
        .sort((a, b) => b.score - a.score || a.trait.localeCompare(b.trait));

    const primary = sorted[0].trait;
    const secondary = sorted[1].trait;

    // Balanced Navigator fallback conditions
    const topScore = sorted[0].score;
    const spread = topScore - sorted[sorted.length - 1].score;

    // If no dominant trait (all within 15 pts of each other)
    // or top score is mid-range (40–60), use fallback
    if (spread < 15 || (topScore > 40 && topScore < 60 && spread < 25)) {
        return 'balanced_navigator';
    }

    const pair = `${primary}-${secondary}`;
    return ARCHETYPE_MAP[pair] || 'balanced_navigator';
}

/* ──────────────────────────────────────────────────────────────────
   buildInsight(traits, archetypeKey)
   ──────────────────────────────────────────────────────────────────
   Returns { primaryInsight, growthEdge, socialCuriosity }
   ────────────────────────────────────────────────────────────────── */
function buildInsight(traits, archetypeKey) {
    const sorted = TRAITS
        .map(t => ({ trait: t, score: traits[t] }))
        .sort((a, b) => b.score - a.score);

    const highestTrait = sorted[0].trait;
    const lowestTrait = sorted[sorted.length - 1].trait;

    // Primary insight: combine top 2 trait texts
    const t1 = sorted[0].trait;
    const t2 = sorted[1].trait;
    const primaryInsight = [
        traits[t1] >= 60
            ? INSIGHT_TEMPLATES.high[t1]
            : INSIGHT_TEMPLATES.low[t1],
        traits[t2] >= 55
            ? INSIGHT_TEMPLATES.high[t2]
            : INSIGHT_TEMPLATES.low[t2],
    ].join(' ');

    // Growth edge: lowest trait, encouraging tone
    const growthEdge = INSIGHT_TEMPLATES.low[lowestTrait];

    // Social curiosity trigger
    const archetype = ARCHETYPES[archetypeKey];
    const typicalHigh = archetype.typicalHigh || [];
    let socialCuriosity = '';

    if (typicalHigh.includes('SI') && traits['SI'] !== undefined) {
        const siScore = traits['SI'];
        if (siScore >= 65) {
            socialCuriosity = `${archetype.label}s tend to initiate often. Your Social Initiative score of ${siScore} puts you above the typical range for your type.`;
        } else {
            socialCuriosity = `${archetype.label}s often score moderately on Social Initiative. At ${siScore}, you sit right in the heart of your type.`;
        }
    } else if (traits['ER'] !== undefined) {
        const erScore = traits['ER'];
        socialCuriosity = `Emotional Regulation often separates archetypes in social performance. Your score of ${erScore} ${erScore >= 60 ? 'sits above the midpoint — a quiet advantage' : 'shows room for building resilience under social pressure'}.`;
    }

    return { primaryInsight, growthEdge, socialCuriosity };
}

/* ──────────────────────────────────────────────────────────────────
   flagSuspectSubmission(responses, completionTimeSeconds)
   Returns true if the submission looks rushed or invalid.
   ────────────────────────────────────────────────────────────────── */
function flagSuspectSubmission(responses, completionTimeSeconds) {
    if (completionTimeSeconds && completionTimeSeconds < 30) return true;

    // Count skipped scored questions
    let answered = 0;
    let total = 0;
    Object.keys(QUESTION_WEIGHTS).forEach(field => {
        total++;
        if (resolveValue(field, responses) !== null) answered++;
    });

    // Flag if < 60 % answered
    return (answered / total) < 0.60;
}

/* ──────────────────────────────────────────────────────────────────
   runEngine(responses, completionTimeSeconds)
   ──────────────────────────────────────────────────────────────────
   Main entry point.  Returns full result object.
   ────────────────────────────────────────────────────────────────── */
function runEngine(responses, completionTimeSeconds) {
    const { traits, raw, ranges } = computeTraits(responses);
    const archetypeKey = assignArchetype(traits);
    const archetype = ARCHETYPES[archetypeKey];
    const insight = buildInsight(traits, archetypeKey);
    const suspect = flagSuspectSubmission(responses, completionTimeSeconds);

    // Sorted traits for display (highest first)
    const traitRanked = TRAITS
        .map(t => ({
            id: t,
            label: TRAIT_META[t].label,
            desc: TRAIT_META[t].desc,
            score: traits[t],
        }))
        .sort((a, b) => b.score - a.score);

    return {
        traits,
        traitRanked,
        archetypeKey,
        archetype,
        insight,
        suspect,
        raw,
        ranges,
    };
}
