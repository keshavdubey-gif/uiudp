/**
 * Campus Social Experience Survey
 * admin.js — Auth, analytics, CSV/Excel export
 */

'use strict';

/* ═══════════════════════════════════════
   AUTH
══════════════════════════════════════ */
const ADMIN_CREDS = { user: 'admin', pass: 'survey2024' };

function checkAuth() {
    const u = document.getElementById('auth-user').value.trim();
    const p = document.getElementById('auth-pass').value;
    const err = document.getElementById('auth-error');

    if (u === ADMIN_CREDS.user && p === ADMIN_CREDS.pass) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        initAdmin();
    } else {
        err.classList.add('show');
    }
}

// Also allow Enter key in password field
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('auth-pass')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAuth();
    });
    document.getElementById('auth-user')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('auth-pass')?.focus();
    });
});

/* ═══════════════════════════════════════
   LOAD DATA
══════════════════════════════════════ */
function loadResponsesLocal() {
    try {
        const raw = localStorage.getItem('survey_responses');
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

/**
 * Normalise Supabase rows (snake_case DB columns → camelCase keys
 * the admin charts expect, e.g. trait_er → trait_ER, created_at → timestamp).
 */
function normaliseRow(r) {
    return {
        ...r,
        timestamp: r.created_at || r.timestamp,
        // Map trait columns if they are snake_case in DB
        trait_ER: r.trait_er ?? r.trait_ER,
        trait_CR: r.trait_cr ?? r.trait_CR,
        trait_SI: r.trait_si ?? r.trait_SI,
        trait_PF: r.trait_pf ?? r.trait_PF,
        trait_GP: r.trait_gp ?? r.trait_GP,
        trait_SE: r.trait_se ?? r.trait_SE,
        trait_ED: r.trait_ed ?? r.trait_ED,
        // Map legacy/mismatched keys to the schema
        belonging_score: r.belonging,
        initiation_ease_score: r.initiation_anxiety,
        digital_openness: r.social_expansion_desire,
        comfort_approaching: r.first_interaction_comfort,
        approached_recently: r.social_frequency,
        wanted_talk_no_action: r.overthinking,
        safe_features_text: r.safety_factors
    };
}

/* ═══════════════════════════════════════
   CHART DEFAULTS
══════════════════════════════════════ */
// Apple system font stack for charts
Chart.defaults.font = { family: "-apple-system,'SF Pro Text','Helvetica Neue',sans-serif", size: 12 };
Chart.defaults.color = 'rgba(60,60,67,0.60)'; // iOS secondary label

// iOS system colors (light theme)
const PALETTE = [
    '#007AFF', // System Blue
    '#34C759', // System Green
    '#FF9500', // System Orange
    '#AF52DE', // System Purple
    '#FF2D55', // System Pink
    '#5AC8FA', // System Teal
    '#FFCC00', // System Yellow
];
const GRID_COLOR = 'rgba(60,60,67,0.10)'; // iOS separator on white
const TICK_COLOR = 'rgba(60,60,67,0.50)';
const TOOLTIP_OPTS = {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: 'rgba(60,60,67,0.15)',
    borderWidth: 1,
    titleColor: '#000',
    bodyColor: 'rgba(60,60,67,0.70)',
    cornerRadius: 10,
    padding: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
};

function baseBarOpts(indexAxis = 'x') {
    return {
        indexAxis,
        responsive: true,
        plugins: { legend: { display: false }, tooltip: TOOLTIP_OPTS },
        scales: {
            x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
            y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
        },
    };
}

/* ═══════════════════════════════════════
   INIT ADMIN
══════════════════════════════════════ */
async function initAdmin() {
    let data = null;

    // Try Supabase first
    if (typeof fetchFromSupabase === 'function') {
        try {
            const rows = await fetchFromSupabase();
            if (rows && rows.length > 0) {
                data = rows.map(normaliseRow);
                console.log(`[Admin] Using ${data.length} rows from Supabase`);
            }
        } catch (e) {
            console.warn('[Admin] Supabase fetch failed, using localStorage:', e);
        }
    }


    // Fallback to localStorage
    if (!data) {
        data = loadResponsesLocal();
        console.log(`[Admin] Using ${data.length} rows from localStorage`);
    }

    renderStats(data);
    renderLikertChart(data);
    renderBelongingDonut(data);
    renderBarriersChart(data);
    renderYearBelongingChart(data);
    renderTable(data);
}

/* ═══════════════════════════════════════
   STATS CARDS
══════════════════════════════════════ */
function avg(data, key) {
    const vals = data.map(r => parseFloat(r[key])).filter(v => !isNaN(v) && v > 0);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

function renderStats(data) {
    document.getElementById('stat-total').textContent = data.length;

    const belonging = avg(data, 'belonging');
    const initAnx = avg(data, 'initiation_anxiety');
    const isolation = avg(data, 'social_isolation');
    const panasPos = avg(data, 'panas_positive_score');
    const panasNeg = avg(data, 'panas_negative_score');

    document.getElementById('stat-belonging').textContent = belonging || '—';
    document.getElementById('stat-initiation').textContent = initAnx || '—';
    document.getElementById('stat-digital').textContent = isolation || '—';

    const posEl = document.getElementById('stat-panas-pos');
    const negEl = document.getElementById('stat-panas-neg');
    if (posEl) posEl.textContent = panasPos || '—';
    if (negEl) negEl.textContent = panasNeg || '—';

    // Disconnected = belonging <= 2
    const disconnected = data.filter(r => parseInt(r.belonging) <= 2).length;
    const pct = data.length ? Math.round(disconnected / data.length * 100) : 0;
    document.getElementById('stat-disconnected').textContent = data.length ? `${pct}%` : '—%';
}

/* ═══════════════════════════════════════
   CHART 1 – LIKERT AVERAGES
══════════════════════════════════════ */
function renderLikertChart(data) {
    const keys = ['social_satisfaction', 'belonging', 'close_friends', 'social_isolation',
        'initiation_anxiety', 'overthinking', 'avoidance', 'judgment_concern',
        'social_expansion_desire', 'online_comfort', 'structured_preference', 'spontaneous_value'];
    const labels = ['Social Satisfaction', 'Belonging', 'Close Friends', 'Social Isolation',
        'Init. Anxiety', 'Overthinking', 'Avoidance', 'Judgment Concern',
        'Expand Circle', 'Online Comfort', 'Structured Pref.', 'Spontaneous Value'];
    const values = keys.map(k => {
        const a = avg(data, k);
        return a ? parseFloat(a) : 0;
    });

    const ctx = document.getElementById('chart-likert')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: PALETTE.slice(0, 4).map(c => c + '33'),
                borderColor: PALETTE.slice(0, 4),
                borderWidth: 2,
                borderRadius: 8,
            }],
        },
        options: {
            ...baseBarOpts(),
            scales: {
                x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
                y: { min: 0, max: 5, grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, stepSize: 1 } },
            },
        },
    });
}

/* ═══════════════════════════════════════
   CHART 2 – BELONGING DONUT
══════════════════════════════════════ */
function renderBelongingDonut(data) {
    const connected = data.filter(r => parseInt(r.belonging) >= 3).length;
    const disconnected = data.filter(r => parseInt(r.belonging) <= 2 && r.belonging !== null).length;
    const unanswered = data.filter(r => r.belonging === null || r.belonging === undefined).length;

    const ctx = document.getElementById('chart-belonging-donut')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Connected (3–5)', 'Disconnected (1–2)', 'Not answered'],
            datasets: [{
                data: [connected, disconnected, unanswered],
                backgroundColor: ['#007AFF33', '#FF3B3033', '#8E8E9333'],
                borderColor: ['#007AFF', '#FF3B30', '#8E8E93'],
                borderWidth: 2,
                hoverOffset: 8,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { padding: 16, color: 'rgba(60,60,67,0.60)', boxWidth: 14, borderRadius: 4 } },
                tooltip: TOOLTIP_OPTS,
            },
            cutout: '65%',
        },
    });
}

/* ═══════════════════════════════════════
   CHART 3 – TOP BARRIERS
══════════════════════════════════════ */
function renderBarriersChart(data) {
    const barrierMap = {
        'top_barrier_academics': 'Academic Pressure',
        'top_barrier_spaces': 'No Shared Spaces',
        'top_barrier_introv': 'Introversion',
        'top_barrier_cliques': 'Clique Dynamics',
        'top_barrier_screens': 'Phone Distraction',
        'top_barrier_judgment': 'Fear of Judgment',
        'top_barrier_opportunities': 'No Events / Opps',
    };

    const labels = Object.values(barrierMap);
    const counts = Object.keys(barrierMap).map(k => data.filter(r => r[k] === true).length);

    const ctx = document.getElementById('chart-barriers')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: counts,
                backgroundColor: PALETTE.map(c => c + '33'),
                borderColor: PALETTE,
                borderWidth: 2,
                borderRadius: 8,
            }],
        },
        options: {
            ...baseBarOpts('y'),
            scales: {
                x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, stepSize: 1 } },
                y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
            },
        },
    });
}

/* ═══════════════════════════════════════
   CHART 4 – YEAR × BELONGING CROSS-TAB
══════════════════════════════════════ */
function renderYearBelongingChart(data) {
    const yearOrder = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'PG Year 1', 'PG Year 2', 'PhD'];
    const grouped = {};

    data.forEach(r => {
        const y = r.year_of_study;
        const b = parseFloat(r.belonging);
        if (!y || isNaN(b)) return;
        if (!grouped[y]) grouped[y] = [];
        grouped[y].push(b);
    });

    const labels = yearOrder.filter(y => grouped[y]);
    const values = labels.map(y => {
        const arr = grouped[y];
        return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    });

    const ctx = document.getElementById('chart-year-belonging')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Avg Belonging',
                data: values,
                backgroundColor: '#007AFF33',
                borderColor: '#007AFF',
                borderWidth: 2,
                borderRadius: 8,
            }],
        },
        options: {
            ...baseBarOpts(),
            plugins: {
                legend: { display: true, labels: { color: 'rgba(60,60,67,0.60)', boxWidth: 12, borderRadius: 4 } },
                tooltip: TOOLTIP_OPTS,
            },
            scales: {
                x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
                y: { min: 0, max: 5, grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, stepSize: 1 } },
            },
        },
    });
}

/* ═══════════════════════════════════════
   RESPONSE TABLE
══════════════════════════════════════ */
function renderTable(data) {
    const tbody = document.getElementById('response-tbody');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted)">No responses yet. Share the survey to collect data.</td></tr>`;
        return;
    }

    const rows = [...data].reverse().map((r, i) => {
        const ts = r.timestamp ? new Date(r.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        const truncate = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : (s || '—');
        return `<tr>
      <td>${data.length - i}</td>
      <td>${ts}</td>
      <td>${r.year_of_study || '—'}</td>
      <td>${r.gender || '—'}</td>
      <td>${r.residence || '—'}</td>
      <td style="text-align:center;">${r.initiation_ease_score || '—'}</td>
      <td style="text-align:center;">${r.belonging_score || '—'}</td>
      <td style="text-align:center;">${r.digital_openness || '—'}</td>
      <td style="text-align:center;">${r.comfort_approaching || '—'}</td>
      <td style="text-align:center;">${r.approached_recently || '—'}</td>
      <td style="text-align:center;">${r.wanted_talk_no_action || '—'}</td>
      <td title="${r.safe_features_text || ''}">${truncate(r.safe_features_text, 40)}</td>
    </tr>`;
    });

    tbody.innerHTML = rows.join('');
}

/* ═══════════════════════════════════════
   CSV EXPORT
══════════════════════════════════════ */
const CSV_COLUMNS = [
    'timestamp',
    // PANAS items (1–20)
    'panas_1', 'panas_2', 'panas_3', 'panas_4', 'panas_5',
    'panas_6', 'panas_7', 'panas_8', 'panas_9', 'panas_10',
    'panas_11', 'panas_12', 'panas_13', 'panas_14', 'panas_15',
    'panas_16', 'panas_17', 'panas_18', 'panas_19', 'panas_20',
    // PANAS computed
    'panas_positive_score', 'panas_negative_score',
    // Demographics (Q1–Q6)
    'age_group', 'year_of_study', 'program', 'stream', 'gender', 'residence',
    // Social Experience (Q6s–Q9)
    'social_satisfaction', 'belonging', 'close_friends', 'social_isolation',
    // Social Behavior (Q10–Q11)
    'social_frequency', 'friendship_ease',
    // Initiation Anxiety (Q12–Q15)
    'initiation_anxiety', 'overthinking', 'avoidance', 'judgment_concern',
    // Initiation Behavior (Q16–Q17)
    'conversation_initiator', 'first_interaction_comfort',
    // Friendship Source – Q18 checkboxes
    'fs_classes', 'fs_hostel', 'fs_clubs', 'fs_mutual', 'fs_online', 'fs_other',
    // Initiation Barriers – Q19 checkboxes
    'ib_fear_rejection', 'ib_not_knowing', 'ib_formed_groups',
    'ib_no_topic', 'ib_low_energy', 'ib_nothing', 'ib_other',
    // Q20–Q23 Likerts
    'social_expansion_desire', 'online_comfort', 'structured_preference', 'spontaneous_value',
    // Open text Q24–Q25
    'social_friction_open', 'safety_factors',
];


function toCSVRow(row) {
    return CSV_COLUMNS.map(col => {
        const val = row[col] ?? '';
        const s = String(val);
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
    }).join(',');
}

function exportCSV() {
    const data = loadResponsesLocal();
    if (!data.length) { alert('No responses to export yet.'); return; }

    const header = CSV_COLUMNS.join(',');
    const rows = data.map(toCSVRow);
    const csv = [header, ...rows].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `iiit_survey_responses_${dateTag()}.csv`);
}

/* ═══════════════════════════════════════
   EXCEL EXPORT (SheetJS)
══════════════════════════════════════ */
function exportExcel() {
    const data = loadResponsesLocal();
    if (!data.length) { alert('No responses to export yet.'); return; }

    const rows = data.map(r => {
        const out = {};
        CSV_COLUMNS.forEach(col => { out[col] = r[col] ?? ''; });
        return out;
    });

    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows, { header: CSV_COLUMNS });
        XLSX.utils.book_append_sheet(wb, ws, 'Responses');
        XLSX.writeFile(wb, `iiit_survey_responses_${dateTag()}.xlsx`);
    } catch (e) {
        alert('Excel export failed. Please use CSV export instead.\n\n' + e.message);
    }
}

/* ═══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function dateTag() {
    return new Date().toISOString().slice(0, 10);
}
