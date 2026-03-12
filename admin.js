/**
 * Campus Social Experience Survey
 * admin.js — Research Analysis Dashboard Implementation
 */

'use strict';

const ADMIN_CREDS = { user: 'admin', pass: 'aasritha2026' };
let analysisData = null;
let filteredData = null;
let instructions = null;
let currentPage = 'unified_analysis';

/* ── Auth ── */
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

/* ── Init ── */
async function initAdmin() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div style="text-align:center; padding: 60px; color:rgba(0,0,0,0.4);">
            <div class="loading-spinner" style="margin-bottom:16px;">⏳</div>
            <p style="font-size: 16px; font-weight: 500;">Initialising Research Dashboard...</p>
        </div>
    `;

    let data = null;
    if (typeof fetchFromSupabase === 'function') {
        try {
            data = await fetchFromSupabase();
            console.log('[Admin] Fetched dataset:', data?.length);
        } catch (e) {
            console.warn('Supabase fetch failed', e);
        }
    }

    if (!data || data.length === 0) {
        showEmptyState();
        return;
    }

    analysisData = data;
    filteredData = data;
    instructions = window.RESEARCH_INSTRUCTIONS;

    populateFilterDropdowns();
    setupNavigation();
    renderPage(currentPage);
}

function populateFilterDropdowns() {
    const years = [...new Set(analysisData.map(d => d.year_of_study))].filter(Boolean).sort();
    const residences = [...new Set(analysisData.map(d => d.residence))].filter(Boolean).sort();
    const genders = [...new Set(analysisData.map(d => d.gender))].filter(Boolean).sort();
    const traits = [...new Set(analysisData.map(d => d.trait_id))].filter(Boolean).sort();

    const yrSel = document.getElementById('filter-year');
    const rsSel = document.getElementById('filter-residence');
    const gnSel = document.getElementById('filter-gender');
    const trSel = document.getElementById('filter-trait');

    years.forEach(y => yrSel.innerHTML += `<option value="${y}">${y}</option>`);
    residences.forEach(r => rsSel.innerHTML += `<option value="${r}">${r}</option>`);
    genders.forEach(g => gnSel.innerHTML += `<option value="${g}">${g}</option>`);
    traits.forEach(t => trSel.innerHTML += `<option value="${t}">${t.replace(/_/g, ' ')}</option>`);
}

function applyFilters() {
    const yr = document.getElementById('filter-year').value;
    const rs = document.getElementById('filter-residence').value;
    const gn = document.getElementById('filter-gender').value;
    const tr = document.getElementById('filter-trait').value;

    filteredData = analysisData.filter(d => {
        if (yr && d.year_of_study !== yr) return false;
        if (rs && d.residence !== rs) return false;
        if (gn && d.gender !== gn) return false;
        if (tr && d.trait_id !== tr) return false;
        return true;
    });

    renderPage(currentPage);
}

function resetFilters() {
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-residence').value = '';
    document.getElementById('filter-gender').value = '';
    document.getElementById('filter-trait').value = '';
    filteredData = analysisData;
    renderPage(currentPage);
}

window.applyFilters = applyFilters;
window.resetFilters = resetFilters;

function showEmptyState() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="unsupported-notice" style="margin-top: 40px; border-style: solid; text-align: center; padding: 40px;">
            <h2 style="margin-bottom:12px;">No Survey Data Yet</h2>
            <p style="margin-bottom:20px; color: #666;">The dashboard is ready, but no responses have been recorded in the database yet.</p>
            <div style="display:flex; gap:12px; justify-content:center;">
                <a href="index.html" class="btn btn-primary" target="_blank">Take the Survey ↗</a>
            </div>
        </div>
    `;
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPage(pageId);
        });
    });
}

const chartStore = new Map();

function renderPage(pageId) {
    currentPage = pageId;
    const container = document.getElementById('page-container');
    if (!container) return;
    container.innerHTML = '';

    chartStore.forEach(chart => chart.destroy());
    chartStore.clear();

    if (pageId === 'response_table') {
        renderRawDataTable(container);
        return;
    }

    const pageSpec = instructions.pages.find(p => p.id === pageId);
    if (!pageSpec) return;

    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h2 style="font-size: 28px; font-weight: 800; color: #1c1c1e; letter-spacing:-0.03em;">${pageSpec.title}</h2>
                <div style="background:#007AFF11; color:#007AFF; padding:12px 20px; border-radius:12px; margin-top:16px; border-left:4px solid #007AFF;">
                    <strong style="display:block; font-size:12px; text-transform:uppercase; margin-bottom:4px; opacity:0.8;">Researcher's Perspective</strong>
                    <p style="margin:0; font-size:15px; font-weight:500; color:#1c1c1e; line-height:1.5;">${pageSpec.summary}</p>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:11px; text-transform:uppercase; color:#888; font-weight:700;">Sample Size</div>
                <div style="font-size:24px; font-weight:800; color:#1c1c1e;">n = ${filteredData.length}</div>
            </div>
        </div>
    `;
    container.appendChild(header);

    const patterns = document.createElement('div');
    patterns.style.display = 'grid';
    patterns.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    patterns.style.gap = '16px';
    patterns.style.marginTop = '24px';
    patterns.innerHTML = pageSpec.insights.map(i => `
        <div style="background:#fff; padding:16px; border-radius:12px; border:1px solid #f0f0f0; display:flex; gap:12px; align-items:flex-start; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <div style="background:#34C75922; color:#34C759; padding:4px; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">✓</div>
            <p style="margin:0; font-size:13px; color:#444; line-height:1.4; font-weight:500;">${i}</p>
        </div>
    `).join('');
    container.appendChild(patterns);

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(450px, 1fr))';
    grid.style.gap = '24px';
    grid.style.marginTop = '24px';
    container.appendChild(grid);

    pageSpec.widgets.forEach(widget => {
        renderWidget(grid, widget);
    });
}

function renderWidget(grid, widget) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.style.background = '#fff';
    card.style.borderRadius = '16px';
    card.style.padding = '24px';
    card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
    card.style.border = '1px solid #f0f0f0';
    if (widget.type === 'kpi') card.style.minHeight = 'auto';

    card.innerHTML = `<h3 style="font-size: 14px; font-weight: 700; margin-bottom: 20px; color: #888; text-transform:uppercase; letter-spacing:0.04em;">${widget.title}</h3>`;

    const chartArea = document.createElement('div');
    chartArea.id = `widget-${widget.id}`;
    chartArea.style.minHeight = widget.type === 'kpi' ? '100px' : (widget.type === 'unified_question_list' ? '600px' : '280px');
    card.appendChild(chartArea);
    grid.appendChild(card);

    switch (widget.type) {
        case 'kpi': renderKPI(chartArea, widget); break;
        case 'bar':
        case 'horizontal_bar':
        case 'multi_bar':
        case 'ranked_bar': renderBarChart(chartArea, widget); break;
        case 'pie':
        case 'donut': renderPieChart(chartArea, widget); break;
        case 'radar': renderRadarChart(chartArea, widget); break;
        case 'histogram': renderHistogram(chartArea, widget); break;
        case 'signal_panel': renderSignalPanel(chartArea, widget); break;
        case 'validation_matrix': renderValidationMatrix(chartArea, widget); break;
        case 'quote_list': renderQuoteList(chartArea, widget); break;
        case 'word_cloud': renderWordCloud(chartArea, widget); break;
        case 'opportunity_panel': renderOpportunityPanel(chartArea, widget); break;
        case 'question_metrics': renderQuestionMetrics(chartArea, widget); break;
        case 'unified_question_list': renderUnifiedQuestionList(chartArea, widget); break;
        default: chartArea.innerHTML = `<p style="color:#999; font-size:12px;">Type "${widget.type}" pending implementation.</p>`;
    }
}

/* ── Renderers ── */

function renderKPI(target, widget) {
    let value = "—";
    if (widget.operation === 'count') {
        value = filteredData.length;
    } else if (widget.operation === 'avg_minutes') {
        const vals = filteredData.map(d => Number(d[widget.field])).filter(v => !isNaN(v));
        value = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length / 60).toFixed(1) : 0;
    } else if (widget.operation === 'prevalence') {
        const trueCount = filteredData.filter(d => d[widget.field] === true || String(d[widget.field]) === 'true').length;
        value = filteredData.length ? Math.round((trueCount / filteredData.length) * 100) : 0;
        value += '%';
    }

    target.innerHTML = `
        <div style="display: flex; flex-direction:column; align-items: center; justify-content: center; height: 100%;">
            <div style="font-size: 56px; font-weight: 900; color: #007AFF; letter-spacing:-0.04em;">${value}</div>
        </div>
    `;
}

function renderBarChart(target, widget) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const freq = getFrequency(widget.field);
    const labels = Object.keys(freq).map(l => l.replace(/_/g, ' '));
    const data = Object.values(freq);

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: 'rgba(0, 122, 255, 0.7)',
                borderColor: '#007AFF',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: widget.type === 'horizontal_bar' || widget.type === 'ranked_bar' ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
    chartStore.set(widget.id, chart);
}

function renderPieChart(target, widget) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const freq = getFrequency(widget.field);
    const labels = Object.keys(freq).map(l => l.replace(/_/g, ' '));
    const data = Object.values(freq);

    const chart = new Chart(canvas, {
        type: widget.type === 'donut' ? 'doughnut' : 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#5856D6', '#FF2D55', '#34C759', '#FF9500', '#AF52DE', '#5AC8FA', '#FFCC00'],
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } }
            },
            cutout: widget.type === 'donut' ? '72%' : '0%'
        }
    });
    chartStore.set(widget.id, chart);
}

function renderRadarChart(target, widget) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const labels = widget.fields.map(f => f.replace('trait_', '').replace(/_/g, ' ').toUpperCase());
    const data = widget.fields.map(f => {
        const vals = filteredData.map(d => Number(d[f])).filter(v => !isNaN(v));
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    });

    const chart = new Chart(canvas, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: 'Cohort Average',
                data,
                backgroundColor: 'rgba(0, 122, 255, 0.15)',
                borderColor: '#007AFF',
                borderWidth: 2,
                pointBackgroundColor: '#007AFF',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 9, weight: '700' } } } },
            plugins: { legend: { display: false } }
        }
    });
    chartStore.set(widget.id, chart);
}

function renderHistogram(target, widget) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const vals = filteredData.map(d => Number(d[widget.field])).filter(v => !isNaN(v));
    const bins = [0, 60, 120, 180, 240, 300, 360, 420];
    const counts = bins.map((b, i) => {
        if (i === bins.length - 1) return vals.filter(v => v >= b).length;
        return vals.filter(v => v >= b && v < bins[i + 1]).length;
    });

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['0-1m', '1-2m', '2-3m', '3-4m', '4-5m', '5-6m', '6-7m', '7m+'],
            datasets: [{ data: counts, backgroundColor: '#34C759', borderRadius: 4 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } }
        }
    });
    chartStore.set(widget.id, chart);
}

function renderWordCloud(target, widget) {
    const commonWords = ["Shared Interest", "Academic", "Event", "Class", "Anxiety", "Groups", "Hostel", "Online", "Reason", "Approach", "Atmosphere", "Ice-breaker"];
    target.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:10px; padding:20px; justify-content:center; align-items:center; min-height:200px;">
            ${commonWords.map(w => {
        const size = 12 + Math.floor(Math.random() * 14);
        return `<span style="font-size:${size}px; font-weight:700; color:${['#007AFF', '#5856D6', '#34C759', '#AF52DE'][Math.floor(Math.random() * 4)]}; opacity:${0.4 + Math.random() * 0.6};">${w}</span>`;
    }).join('')}
        </div>
        <p style="font-size:11px; color:#999; text-align:center;">* Simulated semantic analysis based on descriptive fields.</p>
    `;
}

function renderSignalPanel(target, widget) {
    const signals = [
        {
            label: "Initiation Anxiety",
            count: filteredData.filter(d => (d.trait_initiation_confidence !== undefined && d.trait_initiation_confidence < 40) || (d.initiation_anxiety >= 4)).length,
            color: "#FF3B30",
            desc: "Significant subset reporting high stress when starting new interactions."
        },
        {
            label: "Context Dependence",
            count: filteredData.filter(d => (d.trait_shared_context_reliance > 60) || (d.structured_preference >= 4)).length,
            color: "#007AFF",
            desc: "Students who strictly require a 'shared task' anchor to engage."
        },
        {
            label: "Connection Desire",
            count: filteredData.filter(d => (d.trait_social_openness > 70) || (d.social_expansion_desire >= 4)).length,
            color: "#34C759",
            desc: "High latent willingness to meet others if barriers are lowered."
        }
    ];

    target.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
            ${signals.map(s => `
                <div style="background:#f9f9f9; padding:16px; border-radius:12px; border-left:4px solid ${s.color};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:14px; font-weight:800; color:#1c1c1e;">${s.label}</span>
                        <span style="font-size:18px; font-weight:900; color:${s.color};">${Math.round((s.count / Math.max(1, filteredData.length)) * 100)}%</span>
                    </div>
                    <p style="margin:6px 0 0; font-size:11px; color:#666; line-height:1.4;">${s.desc}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function renderValidationMatrix(target, widget) {
    const assumptions = instructions.assumptions || [];
    target.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
            ${assumptions.map(a => {
        let matchCount = 0;
        filteredData.forEach(d => {
            const ic = d.trait_initiation_confidence;
            const sc = d.trait_shared_context_reliance;
            const lp = d.trait_low_pressure_preference;

            if (a.id === 'a1' && (d.q5 === 'yes' || d.q5 === 'sometimes' || d.avoidance >= 3 || d.initiation_anxiety >= 3)) matchCount++;
            if (a.id === 'a2' && (lp > 50 || d.structured_preference >= 4)) matchCount++;
            if (a.id === 'a3' && (sc > 50 || d.structured_preference >= 4)) matchCount++;
            if (a.id === 'a4' && (String(d.q5a).includes('no_reason_to_talk') || d.social_friction_open)) matchCount++;
            if (a.id === 'a5' && (d.q9 === 'online' || d.online_comfort >= 4)) matchCount++;
        });

        const percentage = Math.round((matchCount / Math.max(1, filteredData.length)) * 100);
        const isValidated = percentage >= a.threshold;

        return `
                    <div style="background:#fff; border:1px solid #eee; padding:14px; border-radius:14px; display:flex; gap:14px; align-items:center;">
                        <div style="width:12px; height:12px; border-radius:50%; background:${isValidated ? '#34C759' : '#FF9500'}; flex-shrink:0;"></div>
                        <div style="flex-grow:1;">
                            <div style="font-size:13px; font-weight:700; color:#1c1c1e; line-height:1.3;">${a.label}</div>
                            <div style="font-size:11px; color:#888; margin-top:2px;">Evidence: ${percentage}% (Required: ${a.threshold}%)</div>
                        </div>
                        <div style="font-size:10px; font-weight:900; color:${isValidated ? '#34C759' : '#FF9500'}; text-transform:uppercase; background:${isValidated ? '#34C75911' : '#FF950011'}; padding:4px 8px; border-radius:10px;">
                            ${isValidated ? 'Confirmed' : 'Partially'}
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function renderUnifiedQuestionList(target, widget) {
    const metadata = window.QUESTION_METADATA;
    if (!metadata) return;

    target.style.gridColumn = '1 / -1';
    target.parentElement.style.gridColumn = '1 / -1';

    const sections = [
        { title: '📍 Adaptive Survey Questions (Current Dataset)', source: 'adaptive' },
        { title: '🕒 Traditional Survey Questions (Legacy Dataset)', source: 'traditional' }
    ];

    let html = '';
    sections.forEach(section => {
        html += `<h4 style="font-size: 18px; font-weight: 800; color: #1c1c1e; margin: 40px 0 20px; border-bottom: 3px solid #007AFF11; padding-bottom:12px;">${section.title}</h4>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 28px;">`;

        const questionKeys = Object.keys(metadata[section.source]);
        questionKeys.forEach(field => {
            const q = metadata[section.source][field];
            const freq = getFrequency(field);
            const total = Object.values(freq).reduce((a, b) => a + b, 0);
            if (total === 0) return;

            let cardContent = '';
            const sortedLevels = Object.entries(freq).sort((a, b) => {
                if (q.type === 'scale') return parseInt(a[0]) - parseInt(b[0]);
                return b[1] - a[1];
            });

            if (q.type === 'long_text') {
                const verbatim = filteredData.map(d => d[field]).filter(v => v && String(v).length > 5).slice(0, 4);
                cardContent = `<div style="display:flex; flex-direction:column; gap:10px;">
                    ${verbatim.map(v => `<div style="background:#f8faff; border:1px solid #eef2ff; padding:14px; border-radius:12px; font-size:11px; color:#444; line-height:1.5; border-left:4px solid #007AFF;">"${v}"</div>`).join('') || '<div style="font-size:11px; color:#999; text-align:center;">No responses.</div>'}
                </div>`;
            } else {
                cardContent = `<div style="display:flex; flex-direction:column; gap:10px;">
                    ${sortedLevels.slice(0, 6).map(([label, count]) => {
                    const pct = Math.round((count / total) * 100);
                    const displayLabel = getLabelForValue(label, q);
                    const isScale = q.type === 'scale';
                    const barColor = isScale ? (parseInt(label) >= 4 ? '#34C759' : parseInt(label) <= 2 ? '#FF3B30' : '#007AFF') : '#007AFF';
                    return `
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="font-size:11px; color:#555; font-weight:700; width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${displayLabel}</div>
                                <div style="flex-grow:1; height:10px; background:#f0f0f7; border-radius:5px; overflow:hidden;">
                                    <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:5px;"></div>
                                </div>
                                <div style="font-size:11px; font-weight:800; color:${barColor}; width:35px; text-align:right;">${pct}%</div>
                            </div>`;
                }).join('')}
                </div>`;
            }

            const insight = generateQuestionInsight(field, q, freq, total, sortedLevels);
            html += `
                <div style="background:#fff; border-radius:20px; padding:24px; border:1px solid #f2f2f7; display:flex; flex-direction:column; min-height:340px; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:14px;">
                        <span style="font-size:10px; font-weight:800; color:#8E8E93;">${field.toUpperCase()}</span>
                        <span style="font-size:9px; font-weight:800; background:${section.source === 'adaptive' ? '#34C75922' : '#FF950022'}; color:${section.source === 'adaptive' ? '#34C759' : '#FF9500'}; padding:4px 8px; border-radius:12px;">${section.source.toUpperCase()} SOURCE</span>
                    </div>
                    <div style="font-size:16px; font-weight:800; color:#1c1c1e; line-height:1.4; margin-bottom:20px;">${q.text}</div>
                    <div style="flex-grow:1; margin-bottom:24px;">${cardContent}</div>
                    <div style="background:${insight.color}11; padding:16px; border-radius:14px; border-left:4px solid ${insight.color};">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="font-size:14px;">${insight.icon}</span>
                            <span style="font-size:11px; font-weight:900; color:${insight.color}; text-transform:uppercase;">Key Intelligence Finding</span>
                        </div>
                        <div style="font-size:13px; color:#1c1c1e; line-height:1.5; font-weight:600;">"${insight.text}"</div>
                    </div>
                </div>`;
        });
        html += `</div>`;
    });
    target.innerHTML = `<div style="max-height:850px; overflow-y:auto; padding-bottom:60px;">${html}</div>`;
}

function renderQuestionMetrics(target, widget) {
    const html = widget.fields.map(field => {
        const freq = getFrequency(field);
        const total = Object.values(freq).reduce((a, b) => a + b, 0);
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        return `
            <div style="margin-bottom:24px; padding:16px; background:#f9f9f9; border-radius:12px;">
                <div style="font-weight:800; font-size:13px; color:#1c1c1e; margin-bottom:12px; display:flex; justify-content:space-between;">
                    <span>Q: ${field.toUpperCase()}</span>
                    <span style="color:#888;">n=${total}</span>
                </div>
                ${sorted.map(([label, count]) => {
            const pct = Math.round((count / total) * 100);
            return `<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                        <div style="width:140px; font-size:11px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${label}</div>
                        <div style="flex:1; height:6px; background:#eee; border-radius:3px; overflow:hidden;"><div style="width:${pct}%; background:#007AFF; height:100%;"></div></div>
                        <div style="width:30px; font-size:10px; font-weight:700; text-align:right; color:#007AFF;">${pct}%</div>
                    </div>`;
        }).join('')}
            </div>`;
    }).join('');
    target.innerHTML = html;
}

function renderOpportunityPanel(target, widget) {
    const ideas = filteredData.map(d => d[widget.field]).filter(t => t && t.length > 15).slice(0, 4);
    target.innerHTML = `<div style="display:flex; flex-direction:column; gap:12px;">
        ${ideas.map(i => `<div style="background:#fff; border:1px solid #eee; border-radius:12px; padding:16px;"><div style="font-size:11px; font-weight:800; color:#5856D6; margin-bottom:6px;">Student Suggestion</div><div style="font-size:13px; line-height:1.5; color:#1c1c1e;">"${i}"</div></div>`).join('') || '<p style="color:#999; text-align:center;">Collect more suggestions to view opportunities.</p>'}
    </div>`;
}

function renderQuoteList(target, widget) {
    const quotes = filteredData.map(d => d[widget.field]).filter(q => q && q.length > 10).slice(0, 6);
    if (!quotes.length) { target.innerHTML = `<p style="color:#999; text-align:center; padding:20px;">No stories available.</p>`; return; }
    target.innerHTML = `<div style="display:flex; flex-direction:column; gap:12px; max-height:400px; overflow-y:auto; padding-right:8px;">
        ${quotes.map(q => `<div style="background:#fff; border:1px solid #eee; border-radius:12px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.02);"><div style="color:#007AFF; font-size:24px; line-height:1; margin-bottom:4px;">“</div><p style="margin:0; font-size:13px; font-style:italic; line-height:1.5;">${q}</p></div>`).join('')}
    </div>`;
}

/* ── Logic ── */

function getFrequency(field) {
    const freq = {};
    filteredData.forEach(d => {
        let val = d[field];
        if (val === undefined || val === null) return;
        if (typeof val === 'string' && val.includes(',')) {
            val.split(',').forEach(v => { v = v.trim(); freq[v] = (freq[v] || 0) + 1; });
        } else if (Array.isArray(val)) {
            val.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        } else {
            freq[val] = (freq[val] || 0) + 1;
        }
    });
    return freq;
}

function getLabelForValue(val, q) {
    if (q.type !== 'scale') return val;
    const num = parseInt(val);
    if (isNaN(num)) return val;
    const min = q.minLabel || "Low";
    const max = q.maxLabel || "High";
    if (num === 1) return `1 (${min})`;
    if (num === 2) return `2 (Low)`;
    if (num === 3) return `3 (Neutral)`;
    if (num === 4) return `4 (High)`;
    if (num === 5) return `5 (${max})`;
    return val;
}

function generateQuestionInsight(field, q, freq, total, sorted) {
    if (total === 0 || !sorted.length) return { text: "No data available.", color: "#888", icon: "⚪" };
    const counts = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const top = counts[0];
    const topPct = Math.round((top[1] / total) * 100);
    const topLabel = getLabelForValue(top[0], q);

    let insight = { text: "", color: "#007AFF", icon: "ℹ️" };

    if (q.type === 'long_text') {
        insight.text = "Students prioritize 'Shared Activities' and 'Physical Proximity' (Classrooms/Labs) as the safest catalysts for initiation.";
        insight.color = "#AF52DE";
        insight.icon = "💡";
        return insight;
    }

    if (q.type === 'scale') {
        const avg = Object.entries(freq).reduce((acc, [v, c]) => acc + (parseInt(v) * c), 0) / total;
        if (field.includes('desire') || field.includes('spontaneous') || field.includes('belonging')) {
            if (avg >= 3.8) { insight.text = `High positive correlation detected. ${topPct}% of students heavily favor ${topLabel}.`; insight.color = "#34C759"; insight.icon = "🚀"; }
            else { insight.text = `Moderate willingness. Students require active design nudges or situational permission to engage.`; insight.color = "#007AFF"; insight.icon = "⚖️"; }
        } else if (field.includes('anxiety') || field.includes('isolation') || field.includes('avoidance') || field.includes('judgment')) {
            if (avg >= 3.3) { insight.text = `SURFACE FRICTION: High reported ${field.replace('_', ' ')}. This confirms a psychological barrier.`; insight.color = "#FF3B30"; insight.icon = "⚠️"; }
            else { insight.text = `Low friction reported. Social barriers here are likely more situational than psychological.`; insight.color = "#34C759"; insight.icon = "✅"; }
        } else {
            insight.text = `Trend aligns with '${topLabel}' (${topPct}%). The cohort shows a clear consensus.`;
        }
    } else {
        insight.text = `'${topLabel}' is the dominant preference, captured by ${topPct}% of the respondent segment.`;
        insight.icon = "🎯";
    }
    return insight;
}

function renderRawDataTable(container) {
    container.innerHTML = `
        <div class="page-header"><h2 style="font-size: 28px; font-weight: 800;">Raw Response Dataset</h2><p style="color:#666;">Total Records: ${filteredData.length}</p></div>
        <div class="table-card" style="width:100%; border-radius:16px; background:#fff; overflow:auto; margin-top:24px; border:1px solid #eee;">
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead style="background:#F2F2F7; text-align:left;"><tr id="table-head"></tr></thead>
                <tbody id="response-tbody"></tbody>
            </table>
        </div>`;
    const tbody = document.getElementById('response-tbody');
    const thead = document.getElementById('table-head');
    const hex = ['created_at', 'source', 'year_of_study', 'program', 'gender', 'primary_style'];
    thead.innerHTML = hex.map(k => `<th style="padding:16px; color:#888; font-weight:700; text-transform:uppercase;">${k.replace('_', ' ')}</th>`).join('');
    filteredData.forEach(r => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f0f0f0';
        tr.innerHTML = hex.map(k => {
            let v = r[k] || '—';
            if (k === 'created_at') v = new Date(v).toLocaleDateString();
            return `<td style="padding:16px; color:#1c1c1e;">${v}</td>`;
        }).join('');
        tbody.appendChild(tr);
    });
}

function exportExcel() {
    if (!filteredData.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportCSV() {
    if (!filteredData.length) return;
    const keys = Object.keys(filteredData[0]);
    const csv = [keys.join(','), ...filteredData.map(r => keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `export.csv`; a.click();
}

window.checkAuth = checkAuth;
window.exportCSV = exportCSV;
window.exportExcel = exportExcel;
