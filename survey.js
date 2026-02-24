/* ══════════════════════════════════════════════════════
   survey.js  –  IIIT Campus Social Experience Survey
   Pages: 1 Consent · 2 PANAS · 3 Demographics ·
          4 Social Exp & Behavior · 5 Initiation ·
          6 Context & Insights · 7 Completion
════════════════════════════════════════════════════ */

'use strict';

/* ── Page metadata ───────────────────────────────── */
const PAGE_META = {
    2: { label: 'Mood Check – PANAS (1 of 5)', pct: 16 },
    3: { label: 'Demographics (2 of 5)', pct: 33 },
    4: { label: 'Social Experience (3 of 5)', pct: 50 },
    5: { label: 'Initiation (4 of 5)', pct: 66 },
    6: { label: 'Context & Insights (5 of 5)', pct: 83 },
    7: { label: 'Complete', pct: 100 },
};

const TOTAL_PAGES = 7;
const DRAFT_KEY = 'survey_draft_v3';

let currentPage = 1;
let surveyStartTime = Date.now();

/* ── PANAS scoring config ────────────────────────── */
const PANAS_POSITIVE_ITEMS = [1, 3, 5, 9, 10, 12, 14, 16, 17, 19];
const PANAS_NEGATIVE_ITEMS = [2, 4, 6, 7, 8, 11, 13, 15, 18, 20];

/* ── Response state ──────────────────────────────── */
const responses = {
    timestamp: '',
    // PANAS (items 1–20)
    panas_1: '', panas_2: '', panas_3: '', panas_4: '', panas_5: '',
    panas_6: '', panas_7: '', panas_8: '', panas_9: '', panas_10: '',
    panas_11: '', panas_12: '', panas_13: '', panas_14: '', panas_15: '',
    panas_16: '', panas_17: '', panas_18: '', panas_19: '', panas_20: '',
    panas_positive_score: null,
    panas_negative_score: null,
    // Demographics (Q1–Q6)
    age_group: '', year_of_study: '', program: '', stream: '',
    gender: '', residence: '',
    // Social Experience (Q6s–Q9)
    social_satisfaction: '', belonging: '', close_friends: '', social_isolation: '',
    // Social Behavior (Q10–Q11)
    social_frequency: '', friendship_ease: '',
    // Initiation Anxiety (Q12–Q15)
    initiation_anxiety: '', overthinking: '', avoidance: '', judgment_concern: '',
    // Initiation Behavior & Comfort (Q16–Q17)
    conversation_initiator: '', first_interaction_comfort: '',
    // Context & Alternatives – friendship source (Q18 multi-select)
    fs_classes: false, fs_hostel: false, fs_clubs: false,
    fs_mutual: false, fs_online: false, fs_other: false,
    // Context & Barriers – initiation barriers (Q19 multi-select)
    ib_fear_rejection: false, ib_not_knowing: false, ib_formed_groups: false,
    ib_no_topic: false, ib_low_energy: false, ib_nothing: false, ib_other: false,
    // Context & Desire (Q20)
    social_expansion_desire: '',
    // Opportunity Testing (Q21–Q23)
    online_comfort: '', structured_preference: '', spontaneous_value: '',
    // Open Insights (Q24–Q25)
    social_friction_open: '', safety_factors: '',
};

/* ══════════════════════════════════════════════════
   PANAS SCORING
════════════════════════════════════════════════════ */
function computePanasScores() {
    const posVals = PANAS_POSITIVE_ITEMS
        .map(i => Number(responses[`panas_${i}`]))
        .filter(v => v >= 1 && v <= 5);
    const negVals = PANAS_NEGATIVE_ITEMS
        .map(i => Number(responses[`panas_${i}`]))
        .filter(v => v >= 1 && v <= 5);

    responses.panas_positive_score = posVals.length === 10
        ? posVals.reduce((a, b) => a + b, 0) : null;
    responses.panas_negative_score = negVals.length === 10
        ? negVals.reduce((a, b) => a + b, 0) : null;
}

/* ══════════════════════════════════════════════════
   PAGE NAVIGATION
════════════════════════════════════════════════════ */
function goToPage(n) {
    const prev = document.getElementById(`page-${currentPage}`);
    const next = document.getElementById(`page-${n}`);
    if (!next) return;

    if (prev) prev.classList.remove('active');
    next.classList.add('active');
    currentPage = n;

    updateProgress(n);
    saveDraft();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(n) {
    const wrapper = document.getElementById('progress-wrapper');
    if (!wrapper) return;

    if (n === 1 || n === 7) {
        wrapper.style.display = 'none';
        return;
    }
    wrapper.style.display = 'block';

    const meta = PAGE_META[n] || {};
    const labelEl = document.getElementById('progress-label');
    const pctEl = document.getElementById('progress-pct');
    const fillEl = document.getElementById('progress-fill');

    if (labelEl) labelEl.textContent = meta.label || '';
    if (pctEl) pctEl.textContent = `${meta.pct || 0}%`;
    if (fillEl) fillEl.style.width = `${meta.pct || 0}%`;
}

/* ══════════════════════════════════════════════════
   CONSENT GATE
════════════════════════════════════════════════════ */
function initConsent() {
    const cb = document.getElementById('consent-checkbox');
    const btn = document.getElementById('consent-btn');
    const row = document.getElementById('consent-row');
    if (!cb || !btn) return;

    cb.addEventListener('change', () => {
        btn.disabled = !cb.checked;
        if (row) row.classList.toggle('checked', cb.checked);
    });

    btn.addEventListener('click', () => {
        if (!btn.disabled) goToPage(2);
    });
}

/* ══════════════════════════════════════════════════
   INPUT WIRING
════════════════════════════════════════════════════ */
function wireInputs() {
    // ── Selects + text inputs ──────────────────────
    const textFields = [
        'age_group', 'year_of_study', 'program', 'stream',
    ];
    textFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            responses[id] = el.value;
            saveDraft();
        });
    });

    // ── Generic: all radios ────────────────────────
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const name = radio.name;
            if (name.startsWith('panas_')) {
                responses[name] = parseInt(radio.value, 10);
                computePanasScores();
            } else if (name in responses) {
                responses[name] = radio.value;
            }
            saveDraft();
        });
    });

    // ── Multi-select checkboxes ────────────────────
    const CHECKBOX_MAP = {
        friendship_source: {
            'Classes': 'fs_classes',
            'Hostel/Living space': 'fs_hostel',
            'Clubs/Events': 'fs_clubs',
            'Mutual friends': 'fs_mutual',
            'Online platforms': 'fs_online',
            'Other': 'fs_other',
        },
        initiation_barriers: {
            'Fear of rejection': 'ib_fear_rejection',
            'Not knowing what to say': 'ib_not_knowing',
            'Already formed friend groups': 'ib_formed_groups',
            'Lack of common topic': 'ib_no_topic',
            'Low energy': 'ib_low_energy',
            'Nothing stops me': 'ib_nothing',
            'Other': 'ib_other',
        },
    };

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const map = CHECKBOX_MAP[cb.name];
            if (map && map[cb.value] !== undefined) {
                responses[map[cb.value]] = cb.checked;
            }
            saveDraft();
        });
    });

    // ── Textareas ─────────────────────────────────
    wireTextarea('social_friction_open', 'q24-counter');
    wireTextarea('safety_factors', 'q25-counter');

    // ── Gender + residence radios ──────────────────
    ['gender', 'residence'].forEach(name => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
            r.addEventListener('change', () => {
                responses[name] = r.value;
                saveDraft();
            });
        });
    });
}

function wireTextarea(id, counterId) {
    const el = document.getElementById(id);
    const counter = document.getElementById(counterId);
    if (!el) return;
    el.addEventListener('input', () => {
        responses[id] = el.value;
        if (counter) counter.textContent = `${el.value.length} / ${el.maxLength}`;
        saveDraft();
    });
}

/* ══════════════════════════════════════════════════
   AUTO-SAVE  (localStorage draft)
════════════════════════════════════════════════════ */
function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ page: currentPage, responses }));
    showToast();
}

function showToast() {
    const t = document.getElementById('autosave-toast');
    if (!t) return;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

function restoreDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
        const saved = JSON.parse(raw);

        // Restore response values
        Object.keys(saved.responses || {}).forEach(key => {
            if (key in responses) responses[key] = saved.responses[key];
        });

        // Radios (including PANAS)
        document.querySelectorAll('input[type="radio"]').forEach(r => {
            const saved_val = responses[r.name];
            if (saved_val !== '' && saved_val !== null &&
                String(r.value) === String(saved_val)) {
                r.checked = true;
            }
        });

        // Selects
        ['age_group', 'year_of_study', 'program'].forEach(id => {
            const el = document.getElementById(id);
            if (el && responses[id]) el.value = responses[id];
        });

        // Text input
        const streamEl = document.getElementById('stream');
        if (streamEl && responses.stream) streamEl.value = responses.stream;

        // Textareas
        ['social_friction_open', 'safety_factors'].forEach(id => {
            const el = document.getElementById(id);
            const counter = document.getElementById(id === 'social_friction_open' ? 'q24-counter' : 'q25-counter');
            if (el && responses[id]) {
                el.value = responses[id];
                if (counter) counter.textContent = `${el.value.length} / ${el.maxLength}`;
            }
        });

        // Checkboxes
        const RESTORE_MAP = {
            fs_classes: { name: 'friendship_source', value: 'Classes' },
            fs_hostel: { name: 'friendship_source', value: 'Hostel/Living space' },
            fs_clubs: { name: 'friendship_source', value: 'Clubs/Events' },
            fs_mutual: { name: 'friendship_source', value: 'Mutual friends' },
            fs_online: { name: 'friendship_source', value: 'Online platforms' },
            fs_other: { name: 'friendship_source', value: 'Other' },
            ib_fear_rejection: { name: 'initiation_barriers', value: 'Fear of rejection' },
            ib_not_knowing: { name: 'initiation_barriers', value: 'Not knowing what to say' },
            ib_formed_groups: { name: 'initiation_barriers', value: 'Already formed friend groups' },
            ib_no_topic: { name: 'initiation_barriers', value: 'Lack of common topic' },
            ib_low_energy: { name: 'initiation_barriers', value: 'Low energy' },
            ib_nothing: { name: 'initiation_barriers', value: 'Nothing stops me' },
            ib_other: { name: 'initiation_barriers', value: 'Other' },
        };

        Object.entries(RESTORE_MAP).forEach(([key, { name, value }]) => {
            if (responses[key]) {
                const cb = document.querySelector(
                    `input[type="checkbox"][name="${name}"][value="${value}"]`
                );
                if (cb) cb.checked = true;
            }
        });

        // Navigate to saved page (but not completion)
        const p = saved.page;
        if (p && p > 1 && p < 7) goToPage(p);

    } catch (e) {
        console.warn('Draft restore failed:', e);
    }
}

/* ══════════════════════════════════════════════════
   SUBMIT MODAL
════════════════════════════════════════════════════ */
function openSubmitModal() {
    const modal = document.getElementById('submit-modal');
    if (modal) modal.classList.add('open');
}

function initModal() {
    const cancel = document.getElementById('modal-cancel');
    const confirm = document.getElementById('modal-confirm');
    const modal = document.getElementById('submit-modal');

    if (cancel) cancel.addEventListener('click', () => modal.classList.remove('open'));
    if (confirm) confirm.addEventListener('click', submitSurvey);
}

/* ══════════════════════════════════════════════════
   SUBMISSION
════════════════════════════════════════════════════ */
function submitSurvey() {
    responses.timestamp = new Date().toISOString();
    computePanasScores();

    // ── Run trait engine ────────────────────────────────────────
    const completionSecs = Math.round((Date.now() - surveyStartTime) / 1000);
    let engineResult = null;
    try {
        engineResult = runEngine(responses, completionSecs);
    } catch (e) {
        console.warn('Engine error:', e);
    }

    // Build final record
    const record = {
        ...responses,
        completion_time_seconds: completionSecs,
        // Trait vector (0–100 per trait)
        trait_ER: engineResult?.traits?.ER ?? null,
        trait_CR: engineResult?.traits?.CR ?? null,
        trait_SI: engineResult?.traits?.SI ?? null,
        trait_PF: engineResult?.traits?.PF ?? null,
        trait_GP: engineResult?.traits?.GP ?? null,
        trait_SE: engineResult?.traits?.SE ?? null,
        trait_ED: engineResult?.traits?.ED ?? null,
        archetype: engineResult?.archetypeKey ?? null,
        suspect_submission: engineResult?.suspect ?? false,
    };

    // Store result separately so result page can read it without parsing all responses
    try {
        localStorage.setItem('last_result', JSON.stringify(engineResult));
    } catch (_) { }

    // Load existing responses, append new one (localStorage fallback)
    const allKey = 'survey_responses';
    let all = [];
    try { all = JSON.parse(localStorage.getItem(allKey) || '[]'); } catch (_) { }
    all.push(record);
    localStorage.setItem(allKey, JSON.stringify(all));

    // ── Save to Google Sheets (non-blocking) ────────────────────
    if (typeof saveToGoogleSheets === 'function') {
        saveToGoogleSheets(record).catch(err =>
            console.warn('[Google Sheets] Background save failed:', err)
        );
    }


    // Clear draft
    localStorage.removeItem(DRAFT_KEY);

    // Close modal
    const modal = document.getElementById('submit-modal');
    if (modal) modal.classList.remove('open');

    // Redirect to identity result page
    window.location.href = 'result.html';
}

/* ══════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    initConsent();
    wireInputs();
    initModal();
    restoreDraft();
});
