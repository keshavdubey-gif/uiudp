/**
 * Campus Social Experience Survey
 * admin.js — Research Analysis Layer Implementation
 */

'use strict';

const ADMIN_CREDS = { user: 'admin', pass: 'aasritha2026' };
let analysisData = null;
let instructions = null;
let engine = null;
let currentPage = 'dashboard_01';

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
        <div style="text-align:center; padding: 40px; color:rgba(0,0,0,0.4);">
            <div class="loading-spinner" style="margin-bottom:16px;">⏳</div>
            <p>Initialising Research Engine...</p>
        </div>
    `;

    // 1. Load Instructions (Prefer pre-loaded global, then fetch)
    if (window.RESEARCH_INSTRUCTIONS) {
        instructions = window.RESEARCH_INSTRUCTIONS;
    } else {
        try {
            const resp = await fetch('instructions.json');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            instructions = await resp.json();
        } catch (e) {
            container.innerHTML = `
                <div class="unsupported-notice" style="border-color:#FF3B30; color:#FF3B30;">
                    <p><strong>Fatal Error:</strong> Failed to load research configuration.</p>
                    <p style="font-size:12px; margin-top:8px;">Reason: ${e.message}. Ensure <code>instructions.js</code> is in the current directory.</p>
                </div>
            `;
            console.error('Failed to load instructions', e);
            return;
        }
    }

    // 2. Load Data from Supabase
    container.innerHTML += `<p style="font-size:13px; color:rgba(0,0,0,0.4);">Syncing with Supabase...</p>`;

    let data = null;
    if (typeof fetchFromSupabase === 'function') {
        try {
            data = await fetchFromSupabase();
            console.log('[Admin] Fetched from Supabase:', data?.length);
        } catch (e) {
            console.warn('Supabase fetch failed', e);
        }
    }

    // Fallback to localStorage if Supabase is offline/empty
    if (!data || data.length === 0) {
        console.log('[Admin] Falling back to local storage');
        const raw = localStorage.getItem('survey_responses');
        data = raw ? JSON.parse(raw) : [];
    }

    analysisData = data;

    // 3. Initialize Engine
    engine = new AnalysisEngine(data, instructions);
    const results = engine.calculateAll();
    window.analysisResults = results; // For debugging

    // 4. Set up Navigation
    setupNavigation();

    // 5. Render Initial Page
    if (analysisData.length === 0) {
        showEmptyState();
    } else {
        renderPage(currentPage);
    }
}

function showEmptyState() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="unsupported-notice" style="margin-top: 40px; border-style: solid;">
            <h2 style="margin-bottom:12px;">No Survey Data Yet</h2>
            <p style="margin-bottom:20px;">The analysis engine is ready, but haven't received any valid responses yet.</p>
            <div style="display:flex; gap:12px; justify-content:center;">
                <button class="btn btn-primary" onclick="seedDemoData()">Seed 25 Demo Responses</button>
                <a href="index.html" class="btn btn-ghost" target="_blank">Open Survey ↗</a>
            </div>
            <p style="font-size:11px; margin-top:20px; color:rgba(0,0,0,0.4);">
                Note: If you are seeing this and have submitted data, ensure you are running a local server (like Live Server) 
                so the browser can load <code>instructions.json</code>.
            </p>
        </div>
    `;
}

function seedDemoData() {
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgrad'];
    const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    const programs = ['B.Tech', 'B.A.', 'B.Sc.', 'B.Des'];
    const locations = ['On-campus Hostel', 'Off-campus PG/Flat', 'Living with Family'];

    const mockData = [];
    for (let i = 0; i < 25; i++) {
        const row = {
            id: 'mock_' + Math.random().toString(36).substr(2, 9),
            created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
            year_of_study: years[Math.floor(Math.random() * years.length)],
            gender: genders[Math.floor(Math.random() * genders.length)],
            program: programs[Math.floor(Math.random() * programs.length)],
            residence: locations[Math.floor(Math.random() * locations.length)],

            // Initiation metrics
            initiation_anxiety: 2 + Math.random() * 3,
            overthinking: 3 + Math.random() * 2,
            avoidance: 2 + Math.random() * 2,
            judgment_concern: 3 + Math.random() * 2,

            // Belonging metrics
            belonging: 1 + Math.random() * 4,
            disconnection: 2 + Math.random() * 3,
            loneliness: 2 + Math.random() * 3,

            // Preferences
            social_expansion_desire: 3 + Math.random() * 2,
            spontaneous_value: 1 + Math.random() * 4,
            structured_preference: 1 + Math.random() * 4,
            online_comfort: 3 + Math.random() * 2,

            // Open Text
            social_friction_open: i % 2 === 0 ? "I find it hard to join small groups already talking." : "The campus feels too formal, need more common interest clubs.",
            safety_factors: i % 3 === 0 ? "Shared interests and structured activities make me feel safe." : "No judgment and friendly faces.",

            suspect_submission: false
        };
        mockData.push(row);
    }

    localStorage.setItem('survey_responses', JSON.stringify(mockData));
    alert('25 demo responses seeded! Reloading dashboard...');
    window.location.reload();
}

window.seedDemoData = seedDemoData;

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

function renderPage(pageId) {
    currentPage = pageId;
    const container = document.getElementById('page-container');
    container.innerHTML = '';

    if (pageId === 'response_table') {
        renderRawDataTable(container);
        return;
    }

    if (pageId === 'research_answers') {
        renderResearchAnswers(container);
        return;
    }

    if (pageId === 'unsupported_list') {
        renderUnsupportedList(container);
        return;
    }

    if (pageId === 'dashboard_patterns') {
        renderDashboardPatterns(container);
        return;
    }

    const pageSpec = instructions.dashboard_spec.pages.find(p => p.page_id === pageId);
    if (!pageSpec) return;

    // Header
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<h2>${pageSpec.title}</h2>`;
    container.appendChild(header);

    // Filter notice (if suspect excluded)
    const filterNotice = document.createElement('p');
    filterNotice.style.fontSize = '12px';
    filterNotice.style.color = 'rgba(60,60,67,0.40)';
    filterNotice.style.marginBottom = '16px';
    filterNotice.innerHTML = `Showing analysis for <strong>${engine.data.length}</strong> valid responses (excluding ${engine.rawData.length - engine.data.length} suspect).`;
    container.appendChild(filterNotice);

    // Group widgets by type for better layout (e.g., Row of KPIs)
    let kpiRow = null;

    pageSpec.widgets.forEach(widgetId => {
        // Find if it's a global metric or a research question
        const globalMetric = instructions.global_metrics.find(m => m.metric_id === widgetId);
        const rq = instructions.research_questions.find(q => q.rq_id === widgetId);

        if (globalMetric) {
            if (!kpiRow) {
                kpiRow = document.createElement('div');
                kpiRow.className = 'kpi-row';
                container.appendChild(kpiRow);
            }
            const val = window.analysisResults.global_metrics[widgetId];
            const formatted = typeof val === 'number' ?
                (widgetId.includes('avg') || widgetId.includes('index') ? val.toFixed(2) : Math.round(val)) : val;

            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `<div class="stat-num">${formatted}</div><div class="stat-label">${globalMetric.label}</div>`;
            kpiRow.appendChild(card);
        } else if (rq) {
            kpiRow = null; // Break KPI row if any
            renderRQWidget(container, rq);
        }
    });
}

function renderRQWidget(container, rq) {
    const card = document.createElement('div');
    card.className = 'chart-card full';

    // Status Badge
    const statusClass = rq.support_level === 'fully_supported' ? 'status-fully' :
        (rq.support_level === 'partially_supported' ? 'status-partially' : 'status-not');
    const statusLabel = rq.support_level.replace(/_/g, ' ');

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3>${rq.rq_id}: ${rq.question}</h3>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
    `;

    if (rq.support_level === 'not_supported_with_current_survey') {
        const notice = document.createElement('div');
        notice.className = 'unsupported-notice';
        notice.innerHTML = `<p><strong>Not Supported</strong><br>${rq.limitations?.[0] || 'This question cannot be answered with the current survey data.'}</p>`;
        card.appendChild(notice);
        container.appendChild(card);
        return;
    }

    const results = window.analysisResults.research_questions[rq.rq_id];
    const widgetType = rq.ui.primary_widget;

    // Render based on widget type
    const div = document.createElement('div');
    div.id = `widget-${rq.rq_id}`;
    card.appendChild(div);
    container.appendChild(card);

    // Call specific renderers
    switch (widgetType) {
        case 'kpi_triplet': renderKPITriplet(div, rq, results); break;
        case 'horizontal_bar_chart': renderHorizontalBar(div, rq, results); break;
        case 'bar_chart':
        case 'line_or_bar_chart':
        case 'grouped_bar_chart': renderBarChart(div, rq, results); break;
        case 'radar_chart': renderRadarChart(div, rq, results); break;
        case 'segment_pie_chart': renderPieChart(div, rq, results); break;
        case 'summary_score_card': renderSummaryScore(div, rq, results); break;
        case 'segmented_bar_chart': renderBarChart(div, rq, results); break;
        case 'theme_cluster_panel':
        case 'theme_chip_list':
        case 'theme_insight_panel':
        case 'score_plus_theme_panel':
        case 'risk_theme_panel':
        case 'design_opportunity_panel': renderThemePanel(div, rq, results); break;
        case 'scatter_plot': renderScatterPlot(div, rq, results); break;
        case 'two_metric_compare_card': renderCompareCard(div, rq, results); break;
        case 'single_metric_card': renderSingleMetricCard(div, rq, results); break;
        default:
            div.innerHTML = `<p style="font-size:12px; color:#999;">Renderer for ${widgetType} not implemented yet.</p>`;
    }

    // Add limitations if partial
    if (rq.support_level === 'partially_supported' && rq.limitations) {
        const lim = document.createElement('p');
        lim.style.fontSize = '11px';
        lim.style.color = '#FF9500';
        lim.style.marginTop = '12px';
        lim.style.borderTop = '1px dashed #FF950044';
        lim.style.paddingTop = '8px';
        lim.innerHTML = `<strong>Limitation:</strong> ${rq.limitations.join(' ')}`;
        card.appendChild(lim);
    }
}

/* ── Widget Renderers ── */

function renderKPITriplet(target, rq, results) {
    const row = document.createElement('div');
    row.className = 'kpi-row';
    target.appendChild(row);

    Object.entries(results.calculations).forEach(([id, val], i) => {
        const label = rq.ui.labels?.[i] || id;
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.boxShadow = 'none';
        card.style.border = '1px solid #f0f0f0';
        card.innerHTML = `<div class="stat-num">${typeof val === 'number' ? val.toFixed(2) : val}</div><div class="stat-label">${label}</div>`;
        row.appendChild(card);
    });
}

function renderHorizontalBar(target, rq, results) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const calc = Object.values(results.calculations)[0];
    const labels = Object.keys(calc);
    const values = Object.values(calc);

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.replace(/ib_|fs_/g, '').replace(/_/g, ' ')),
            datasets: [{
                data: values,
                backgroundColor: '#007AFF33',
                borderColor: '#007AFF',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            scales: { x: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderBarChart(target, rq, results) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const calc = Object.values(results.calculations)[0];
    let labels = [], data = [];

    if (typeof calc === 'object' && !Array.isArray(calc)) {
        labels = Object.keys(calc);
        data = Object.values(calc);
    }

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: data,
                backgroundColor: '#007AFF33',
                borderColor: '#007AFF',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: 5 } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderRadarChart(target, rq, results) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const labels = [];
    const data = [];
    Object.entries(results.calculations).forEach(([id, val]) => {
        if (typeof val === 'number') {
            const calcSpec = rq.calculations.find(c => c.calc_id === id);
            labels.push(calcSpec ? calcSpec.label : id);
            data.push(val);
        }
    });

    new Chart(canvas, {
        type: 'radar',
        data: {
            labels: labels.map(l => l.replace(/ mean/g, '')),
            datasets: [{
                label: 'Current Data',
                data: data,
                backgroundColor: '#007AFF33',
                borderColor: '#007AFF',
                pointBackgroundColor: '#007AFF',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: { display: false }
                }
            }
        }
    });
}

function renderPieChart(target, rq, results) {
    const canvas = document.createElement('canvas');
    target.appendChild(canvas);

    const calc = Object.values(results.calculations)[0];
    const labels = Object.keys(calc);
    const data = Object.values(calc).map(v => v.count);

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => l.replace(/_/g, ' ')),
            datasets: [{
                data,
                backgroundColor: ['#007AFF33', '#34C75933', '#FF950033', '#AF52DE33'],
                borderColor: ['#007AFF', '#34C759', '#FF9500', '#AF52DE'],
                borderWidth: 2
            }]
        }
    });
}

function renderSummaryScore(target, rq, results) {
    const calc = Object.values(results.calculations)[0];
    const div = document.createElement('div');
    div.className = 'stat-card';
    div.style.width = 'fit-content';
    div.style.margin = '10px auto';
    div.style.boxShadow = 'none';
    div.style.border = '1px solid #eee';
    div.innerHTML = `<div class="stat-num" style="font-size:48px;">${typeof calc === 'number' ? calc.toFixed(2) : (calc.mean ? calc.mean.toFixed(2) : '—')}</div><div class="stat-label">Index Score</div>`;
    target.appendChild(div);
}

function renderThemePanel(target, rq, results, title = 'Extracted Themes') {
    const calc = Object.values(results.calculations).find(c => Array.isArray(c));
    if (!calc || calc.length === 0) {
        target.innerHTML = `<p style="font-size:13px; color:#999; padding: 20px; text-align:center;">No significant themes found in current open-text responses.</p>`;
        return;
    }

    const panel = document.createElement('div');
    panel.className = 'theme-panel';
    panel.style.background = '#F9F9FB';
    panel.style.margin = '10px 0';
    panel.innerHTML = `<h4 style="font-size:12px; margin-bottom:12px; color:rgba(60,60,67,0.4)">${title}</h4>`;

    calc.forEach(item => {
        const chip = document.createElement('span');
        chip.className = 'theme-chip';
        chip.innerHTML = `${item.theme} <span style="opacity:0.5; margin-left:4px;">${item.frequency}</span>`;
        panel.appendChild(chip);
    });

    target.appendChild(panel);
}

function renderScatterPlot(target, rq, results) {
    const coeff = Object.values(results.calculations)[0];
    target.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px; align-items:center; padding: 10px;">
             <div class="stat-card" style="box-shadow:none; border:1px solid #eee;">
                <div class="stat-num">${coeff ? coeff.toFixed(3) : '0.000'}</div>
                <div class="stat-label">Pearson Correlation (r)</div>
            </div>
            <div style="font-size:13px; color:#666; line-height:1.5;">
                <strong>Interpretation:</strong><br>
                ${Math.abs(coeff) > 0.5 ? 'Strong' : (Math.abs(coeff) > 0.3 ? 'Moderate' : 'Weak')} 
                ${coeff >= 0 ? 'positive' : 'negative'} relationship detected.
            </div>
        </div>
    `;
}

function renderCompareCard(target, rq, results) {
    const calc = Object.values(results.calculations)[0];
    target.innerHTML = `
        <div style="display:flex; justify-content:center; gap:24px; padding:20px;">
            <div class="stat-card" style="box-shadow:none; border:1px solid #eee;">
                <div class="stat-num">${calc.mean.toFixed(2)}</div>
                <div class="stat-label">Difference Score</div>
            </div>
            <div class="stat-card" style="box-shadow:none; border:1px solid #eee;">
                <div class="stat-num" style="font-size:24px; text-transform:capitalize;">${calc.leaning.replace(/_/g, ' ')}</div>
                <div class="stat-label">Tendency</div>
            </div>
        </div>
    `;
}

function renderSingleMetricCard(target, rq, results) {
    const calc = Object.values(results.calculations)[0];
    const val = typeof calc === 'number' ? calc.toFixed(2) : (calc.mean ? calc.mean.toFixed(2) : '—');
    target.innerHTML = `
        <div class="stat-card" style="width:fit-content; margin: 10px auto; box-shadow:none; border:1px solid #eee;">
            <div class="stat-num">${val}</div>
            <div class="stat-label">Average Score</div>
        </div>
    `;
}

/* ── Unsupported RQs List ── */
function renderUnsupportedList(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>Unsupported Research Questions</h2>
            <p>The following questions were identified in the research plan but are not directly supported by current survey data. These are displayed to ensure rigorous reporting and avoid false inferences.</p>
        </div>
        <div id="unsupported-container"></div>
    `;

    const list = instructions.research_questions.filter(rq => rq.support_level === 'not_supported_with_current_survey');
    const target = document.getElementById('unsupported-container');

    list.forEach(rq => {
        const card = document.createElement('div');
        card.className = 'chart-card full';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div style="flex:1;">
                    <h3 style="margin-bottom:4px;">${rq.rq_id}: ${rq.question}</h3>
                    <p style="font-size:13px; color:rgba(60,60,67,0.5);">Target Objective: ${rq.objective_id}</p>
                </div>
                <span class="status-badge status-not">Unsupported</span>
            </div>
            <div class="unsupported-notice">
                <p><strong>Rationale:</strong> ${rq.limitations?.join(' ') || 'Insufficient data fields in the current survey instrument.'}</p>
            </div>
        `;
        target.appendChild(card);
    });
}

/* ── Raw Data Table ── */
function renderRawDataTable(container) {
    container.innerHTML = `
        <div class="page-header"><h2>Raw Response Data</h2></div>
        <div class="table-card" style="width:100%; border-radius:12px;">
            <div class="table-scroll">
                <table id="response-table">
                    <thead>
                        <tr id="table-head"></tr>
                    </thead>
                    <tbody id="response-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    const data = analysisData;
    const tbody = document.getElementById('response-tbody');
    const thead = document.getElementById('table-head');

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="10">No data found.</td></tr>`;
        return;
    }

    // Dynamic headers based on data keys
    const keys = ['created_at', 'year_of_study', 'program', 'gender', 'initiation_anxiety', 'belonging', 'social_expansion_desire'];
    thead.innerHTML = keys.map(k => `<th>${k.replace(/_/g, ' ')}</th>`).join('');

    data.slice().reverse().forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = keys.map(k => `<td>${r[k] !== undefined ? r[k] : '—'}</td>`).join('');
        tbody.appendChild(tr);
    });
}

/* ── Export ── */
function exportCSV() {
    if (!analysisData.length) return;
    const keys = Object.keys(analysisData[0]);
    const csv = [
        keys.join(','),
        ...analysisData.map(r => keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `survey_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

function exportExcel() {
    alert('Excel export requires external library. Please use CSV export.');
}

/* ── Research Answers Page (PRD implementation) ── */
function renderResearchAnswers(container) {
    // 1. Header (Section 1)
    container.innerHTML = `
        <div class="page-header">
            <h2>Research Answers</h2>
            <p>Automatically generated insights answering the defined research questions based on survey responses.</p>
        </div>
    `;

    // 2. Dataset Overview (Section 2)
    const validCount = engine.data.length;
    const totalCount = engine.rawData.length;
    const suspectCount = totalCount - validCount;

    const summaryGrid = document.createElement('div');
    summaryGrid.className = 'dataset-overview-grid';
    summaryGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-num">${totalCount}</div>
            <div class="stat-label">Total Responses</div>
        </div>
        <div class="stat-card">
            <div class="stat-num">${validCount}</div>
            <div class="stat-label">Valid Responses</div>
        </div>
        <div class="stat-card">
            <div class="stat-num">${suspectCount}</div>
            <div class="stat-label" style="color:#FF3B30;">Suspect Submissions</div>
        </div>
    `;
    container.appendChild(summaryGrid);

    // 3. Generate Answers
    const answersGenerator = new ResearchAnswerGenerator(window.analysisResults, instructions);
    const answers = answersGenerator.generateAnswers();

    // 4. Research Objectives Accordion (Section 3)
    instructions.research_objectives.forEach(obj => {
        const accordion = document.createElement('div');
        accordion.className = 'objective-group';

        const rqsForObj = instructions.research_questions.filter(q => q.objective_id === obj.objective_id);

        accordion.innerHTML = `
            <div class="accordion-header" onclick="this.nextElementSibling.style.display = (this.nextElementSibling.style.display === 'none' ? 'block' : 'none')">
                <span>${obj.objective_id.replace('obj_', 'Objective ')}: ${obj.title}</span>
                <span style="font-size:12px; font-weight:normal; opacity:0.5;">${rqsForObj.length} Questions ▾</span>
            </div>
            <div class="accordion-content" style="display:none; padding: 12px 0;"></div>
        `;

        const content = accordion.querySelector('.accordion-content');

        rqsForObj.forEach(rq => {
            const answerData = answers[rq.rq_id];
            const card = document.createElement('div');
            card.className = 'answer-card';

            const statusClass = rq.support_level === 'fully_supported' ? 'status-fully' :
                (rq.support_level === 'partially_supported' ? 'status-partially' : 'status-not');

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h4>${rq.question}</h4>
                    <span class="status-badge ${statusClass}">${rq.support_level.replace('_', ' ')}</span>
                </div>
                
                <div class="answer-body">
                    <div class="answer-section">
                        <div class="answer-section-label">Semantic Answer</div>
                        <div class="semantic-text">${answerData.semantic_answer}</div>
                    </div>
                    
                    <div class="answer-section">
                        <div class="answer-section-label">Evidence Summary</div>
                        <div class="evidence-summary">${answerData.evidence_summary}</div>
                    </div>

                    <div class="answer-section">
                        <div class="answer-section-label">Source Fields</div>
                        <div style="font-size:11px; font-family:monospace; color:rgba(0,0,0,0.5);">
                            ${rq.db_fields?.join(', ') || 'None'}
                        </div>
                    </div>

                    ${rq.limitations ? `
                    <div class="answer-section">
                        <div class="answer-section-label">Limitations</div>
                        <div style="font-size:12px; color:#FF9500;">
                            ${rq.limitations.join(' ')}
                        </div>
                    </div>` : ''}
                </div>
            `;
            content.appendChild(card);
        });

        container.appendChild(accordion);
    });
}

function processFreq(data, key) {
    const counts = {};
    let total = 0;
    data.forEach(row => {
        const val = row[key];
        if (val) {
            counts[val] = (counts[val] || 0) + 1;
            total++;
        }
    });

    const arr = Object.keys(counts).map(k => ({ label: k.replace(/_/g, ' '), count: counts[k], pct: Math.round((counts[k] / total) * 100) || 0 }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
}

function renderPatternCard(title, dataArr) {
    let rows = dataArr.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 14px; align-items: center;">
            <span style="text-transform: capitalize; color: #333;">${item.label}</span>
            <span style="font-weight: 600; color: #007AFF;">${item.pct}% <span style="font-size: 11px; color:rgba(0,0,0,0.4); font-weight: normal;">(${item.count})</span></span>
        </div>
        <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; margin-bottom: 14px; overflow: hidden;">
            <div style="width: ${item.pct}%; height: 100%; background: #007AFF; border-radius: 3px;"></div>
        </div>
    `).join('');

    if (dataArr.length === 0) {
        rows = `<div style="color:rgba(0,0,0,0.4); font-size:13px; text-align:center; padding: 20px;">No data yet</div>`;
    }

    return `
        <div class="chart-card">
            <h3>${title}</h3>
            <div>${rows}</div>
        </div>
    `;
}

async function renderDashboardPatterns(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>Behaviour Patterns</h2>
            <p>Automated insight extraction powered by SQL views and the Adaptive Survey model.</p>
        </div>
        <div style="padding: 40px; text-align: center; color: rgba(0,0,0,0.5);">
            <div class="loading-spinner" style="margin-bottom:16px;">⏳</div>
            <p>Querying SQL Views...</p>
        </div>
    `;

    if (typeof fetchBehaviourPatterns !== 'function') {
        container.innerHTML = `
            <div class="unsupported-notice">
                <p><strong>Missing fetcher:</strong> fetchBehaviourPatterns not found. Ensure supabase-client.js is updated.</p>
            </div>
        `;
        return;
    }

    const patterns = await fetchBehaviourPatterns();

    if (!patterns || !patterns.contexts) {
        container.innerHTML = `
            <div class="page-header">
                <h2>Behaviour Patterns</h2>
            </div>
            <div class="unsupported-notice">
                <p><strong>No pattern data available.</strong> Ensure that the Supabase SQL views have been created and responses have been submitted via the adaptive survey.</p>
            </div>
        `;
        return;
    }

    const ctx = processFreq(patterns.contexts, 'context');
    const init = processFreq(patterns.initiation, 'behavior');
    const bar = processFreq(patterns.barriers, 'barrier');
    const dig = processFreq(patterns.digital, 'preference');

    container.innerHTML = `
        <div class="page-header">
            <h2>Behaviour Patterns</h2>
            <p>Behavioural patterns from ${patterns.contexts.length > 0 ? 'the adaptive survey responses' : 'no responses yet'}.</p>
        </div>
        <div class="charts-grid">
            ${renderPatternCard('Conversation Triggers (Contexts)', ctx)}
            ${renderPatternCard('Initiation Styles & Behaviour', init)}
            ${renderPatternCard('Primary Barriers to Entry', bar)}
            ${renderPatternCard('Digital vs Physical Preference', dig)}
        </div>
        
        <div class="table-card" style="margin-top: 24px;">
            <h3>Generate LLM Validation (Next Step)</h3>
            <p style="font-size:14px; color:rgba(0,0,0,0.6); line-height: 1.5;">
                We now have flattened, easily queried statistics. The next step is to pull the open-text "Why" explanations 
                and pass them directly to an LLM for qualitative reasoning against the HMW statement.
            </p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="alert('LLM integration pipeline ready for deployment.')">Generate Insights</button>
        </div>
    `;
}

// Global hook for auth
window.checkAuth = checkAuth;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('auth-pass')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAuth();
    });
});
