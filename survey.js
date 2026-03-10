/* ══════════════════════════════════════════════════════
   survey.js  –  Adaptive Campus Social Experience Survey
════════════════════════════════════════════════════ */

'use strict';

// Ensure backward compatibility or clear old localstorage if schema changed drastically
const DRAFT_KEY = 'adaptive_survey_draft_v1';
let responses = {};
let historyStack = []; // track the sequence of questions seen to support "Back"
let currentQuestionId = null;
let lastRecordId = null; // For updating with feedback

const SURVEY_PLAN = {
    intro: {
        section: 'Welcome',
        title: 'Consent & Information',
        type: 'info',
        text: `This research aims to understand student interaction and connection patterns on campus. Your participation is voluntary.`,
        details: [
            { icon: '🛡️', title: 'Privacy & Data', desc: 'Your privacy is our priority. We do <strong>not</strong> record your name, audio, video, or any identifiable personal data.' },
            { id: 'retention', icon: '⏳', title: 'Data Retention', desc: 'This research data will be stored securely for <strong>30 days</strong>, after which it will be deleted completely.' },
            { icon: '⏱️', title: 'Session Duration', desc: 'The survey takes approximately <strong>5–10 minutes</strong>. Thank you for your time.' }
        ],
        next: () => {
            if (!responses.started_at) {
                responses.started_at = Date.now();
                saveDraft();
            }
            return 'd1';
        }
    },

    // ── SECTION: Demographics ──
    d1: {
        section: 'Demographics',
        title: 'What is your age range?',
        type: 'single_select',
        options: [
            { id: '18-20', label: '18-20' },
            { id: '21-22', label: '21-22' },
            { id: '23-24', label: '23-24' },
            { id: '25+', label: '25+' }
        ],
        next: () => 'd2'
    },
    d2: {
        section: 'Demographics',
        title: 'What year of study are you in?',
        type: 'single_select',
        options: [
            { id: '1st', label: '1st Year' },
            { id: '2nd', label: '2nd Year' },
            { id: '3rd', label: '3rd Year' },
            { id: '4th_plus', label: '4th Year+' }
        ],
        next: () => 'd3'
    },
    d3: {
        section: 'Demographics',
        title: 'What is your program of study?',
        type: 'single_select',
        options: [
            { id: 'B.Tech/B.E.', label: 'B.Tech / B.E.' },
            { id: 'M.Tech/M.E.', label: 'M.Tech / M.E.' },
            { id: 'B.Des/M.Des', label: 'B.Des / M.Des' },
            { id: 'B.Sc/M.Sc', label: 'B.Sc / M.Sc' },
            { id: 'B.A./M.A.', label: 'B.A. / M.A.' },
            { id: 'B.Com/M.Com', label: 'B.Com / M.Com' },
            { id: 'MBA/MCA', label: 'MBA / MCA' },
            { id: 'PhD', label: 'PhD' },
            { id: 'Other', label: 'Other' },
            { id: 'Prefer not to say', label: 'Prefer not to say' }
        ],
        next: () => 'd4'
    },
    d4: {
        section: 'Demographics',
        title: 'What is your gender?',
        type: 'single_select',
        options: [
            { id: 'Male', label: 'Male' },
            { id: 'Female', label: 'Female' },
            { id: 'Non-binary', label: 'Non-binary' },
            { id: 'Transgender Male', label: 'Transgender Male' },
            { id: 'Transgender Female', label: 'Transgender Female' },
            { id: 'Genderqueer', label: 'Genderqueer / Gender non-conforming' },
            { id: 'Agender', label: 'Agender' },
            { id: 'Self-describe', label: 'Prefer to self-describe' },
            { id: 'Prefer not to say', label: 'Prefer not to say' }
        ],
        next: () => 'd5'
    },
    d5: {
        section: 'Demographics',
        title: 'Where do you currently live?',
        type: 'single_select',
        options: [
            { id: 'Hostel', label: 'Hostel (On-campus)' },
            { id: 'Day Scholar', label: 'Day Scholar (Off-campus)' }
        ],
        next: () => 'q1'
    },
    q1: {
        section: 'Section A — Screening',
        title: 'Do you generally like interacting with new people on campus?',
        type: 'single_select',
        options: [
            { id: 'yes', label: 'Yes, I usually enjoy it' },
            { id: 'sometimes', label: 'Sometimes, depending on the situation' },
            { id: 'not_really', label: 'Not really' },
            { id: 'prefer_known_people', label: 'I usually prefer staying with people I already know' }
        ],
        next: (ans) => (ans === 'not_really' || ans === 'prefer_known_people') ? 'thank_you_exit' : 'q2'
    },
    thank_you_exit: {
        section: 'Exit',
        title: 'Thank you for your time!',
        type: 'info',
        text: `We appreciate your interest in our research. 
               <br><br>
               At the moment, our study is specifically focusing on students who are actively seeking to build or understand their social connections on campus. 
               <br><br>
               Since you indicated you're comfortable with your current circle, you do not need to continue with this particular survey. Thank you for helping us narrow our research focus!`,
        next: null
    },

    // ── SECTION B: Recent real interaction ──
    q2: {
        section: 'Section B — Recent real interaction',
        title: 'Can you tell us about the last time you talked to someone new on campus?',
        prompt: 'Please briefly describe the situation.',
        type: 'long_text',
        next: () => 'q2a'
    },
    q2a: {
        section: 'Section B — Recent real interaction',
        title: 'Where did this happen?',
        type: 'single_select',
        options: [
            { id: 'class', label: 'In class' },
            { id: 'group_assignment', label: 'During a group assignment' },
            { id: 'club', label: 'At a club or society' },
            { id: 'event', label: 'At an event' },
            { id: 'mutual_friend', label: 'Through a mutual friend' },
            { id: 'hostel_common_area', label: 'In a hostel/common area' },
            { id: 'online_community', label: 'Online campus group/community' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q2b'
    },
    q2b: {
        section: 'Section B — Recent real interaction',
        title: 'What started the conversation?',
        type: 'multi_select',
        options: [
            { id: 'shared_task', label: 'Shared task or activity' },
            { id: 'academic_need', label: 'Academic need' },
            { id: 'shared_interest', label: 'Shared interest' },
            { id: 'they_approached', label: 'They approached me' },
            { id: 'i_approached', label: 'I approached them' },
            { id: 'mutual_friend_introduced', label: 'Mutual friend introduced us' },
            { id: 'casual_moment', label: 'Casual/situational moment' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q2c'
    },
    q2c: {
        section: 'Section B — Recent real interaction',
        title: 'Who initiated the conversation?',
        type: 'single_select',
        options: [
            { id: 'me', label: 'I did' },
            { id: 'them', label: 'The other person did' },
            { id: 'both_naturally', label: 'It happened naturally / both' },
            { id: 'dont_remember', label: 'I do not remember' }
        ],
        next: () => 'q2d'
    },
    q2d: {
        section: 'Section B — Recent real interaction',
        title: 'How comfortable did that interaction feel?',
        type: 'scale',
        minLabel: 'Very uncomfortable',
        maxLabel: 'Very comfortable',
        next: (ans) => {
            const val = parseInt(ans);
            if (val <= 2) return 'q2e';
            if (val >= 4) return 'q2f';
            return 'q4';
        }
    },
    q2e: {
        section: 'Section B — Recent real interaction',
        title: 'What made that interaction uncomfortable?',
        type: 'long_text',
        next: () => 'q4'
    },
    q2f: {
        section: 'Section B — Recent real interaction',
        title: 'What made that interaction feel comfortable or easy?',
        type: 'long_text',
        next: () => 'q4'
    },

    q4: {
        section: 'Section C — Contexts and natural interaction',
        title: 'Are there situations where talking to new people feels easier or more natural for you?',
        type: 'single_select',
        options: [
            { id: 'yes', label: 'Yes' },
            { id: 'sometimes', label: 'Sometimes' },
            { id: 'no', label: 'No' }
        ],
        next: (ans) => (ans === 'yes' || ans === 'sometimes') ? 'q4a' : 'q5'
    },
    q4a: {
        section: 'Section C — Contexts and natural interaction',
        title: 'Which situations feel easier?',
        type: 'multi_select',
        options: [
            { id: 'shared_activities', label: 'Shared activities' },
            { id: 'small_groups', label: 'Small groups' },
            { id: 'one_on_one', label: 'One-on-one settings' },
            { id: 'informal_casual', label: 'Informal/casual environments' },
            { id: 'someone_else_starts', label: 'When someone else starts first' },
            { id: 'online_interactions', label: 'Online interactions' },
            { id: 'common_interest', label: 'When I know we have a common interest' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q4b'
    },
    q4b: {
        section: 'Section C — Contexts and natural interaction',
        title: 'Why do these situations feel easier?',
        type: 'long_text',
        next: () => 'q5'
    },

    // ── SECTION D: Barriers and motivation ──
    q5: {
        section: 'Section D — Barriers and motivation',
        title: 'Are there situations where you usually avoid starting a conversation with someone new?',
        type: 'single_select',
        options: [
            { id: 'yes', label: 'Yes' },
            { id: 'sometimes', label: 'Sometimes' },
            { id: 'no', label: 'No' }
        ],
        next: (ans) => (ans === 'yes' || ans === 'sometimes') ? 'q5a' : 'q6'
    },
    q5a: {
        section: 'Section D — Barriers and motivation',
        title: 'What makes those situations difficult?',
        type: 'multi_select',
        options: [
            { id: 'people_in_groups', label: 'People already seem to be in groups' },
            { id: 'dont_know_how_to_start', label: 'I do not know how to start' },
            { id: 'worry_about_judgment', label: 'I worry about being judged' },
            { id: 'no_reason_to_talk', label: 'I feel there is no reason to talk' },
            { id: 'too_formal', label: 'The setting feels too formal' },
            { id: 'too_public', label: 'The setting feels too public' },
            { id: 'may_not_be_interested', label: 'I feel the other person may not be interested' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q5b'
    },
    q5b: {
        section: 'Section D — Barriers and motivation',
        title: 'What do you usually do instead?',
        type: 'multi_select',
        options: [
            { id: 'wait_for_someone', label: 'Wait for someone to talk to me' },
            { id: 'observe', label: 'Stay quiet and observe' },
            { id: 'talk_only_if_needed', label: 'Talk only if necessary' },
            { id: 'leave', label: 'Leave the situation' },
            { id: 'stick_to_known_people', label: 'Stick to people I already know' },
            { id: 'use_phone_avoid', label: 'Use my phone / avoid engagement' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q6'
    },
    q6: {
        section: 'Section D — Barriers and motivation',
        title: 'What usually motivates you to talk to someone you do not know yet?',
        type: 'multi_select',
        options: [
            { id: 'shared_interest', label: 'Shared interest' },
            { id: 'academic_reason', label: 'Academic or practical reason' },
            { id: 'mutual_friend', label: 'Mutual friend' },
            { id: 'curiosity', label: 'Curiosity' },
            { id: 'need_for_company', label: 'Need for company' },
            { id: 'networking', label: 'Networking' },
            { id: 'group_activity', label: 'Group activity' },
            { id: 'approachable', label: 'They seem approachable' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q7'
    },

    // ── SECTION E: Behaviour patterns ──
    q7: {
        section: 'Section E — Behaviour patterns',
        title: 'When you join a new group or event, how do you usually behave?',
        type: 'single_select',
        options: [
            { id: 'start_quickly', label: 'I start conversations quickly' },
            { id: 'clear_reason', label: 'I talk if there is a clear reason' },
            { id: 'wait_for_someone', label: 'I wait for someone to talk to me' },
            { id: 'observe_first', label: 'I prefer observing first' },
            { id: 'avoid_interacting', label: 'I mostly avoid interacting' }
        ],
        next: (ans) => {
            if (ans === 'start_quickly') return 'q7a';
            if (ans === 'clear_reason') return 'q7b';
            if (ans === 'wait_for_someone') return 'q7c';
            if (ans === 'observe_first') return 'q7d';
            if (ans === 'avoid_interacting') return 'q7e';
            return 'q8';
        }
    },
    q7a: { section: 'Section E — Behaviour patterns', title: 'What makes you comfortable initiating conversations?', type: 'long_text', next: () => 'q8' },
    q7b: { section: 'Section E — Behaviour patterns', title: 'What kind of reason usually helps you start interacting?', type: 'long_text', next: () => 'q8' },
    q7c: { section: 'Section E — Behaviour patterns', title: 'What makes it easier when the other person starts first?', type: 'long_text', next: () => 'q8' },
    q7d: { section: 'Section E — Behaviour patterns', title: 'What do you usually look for before deciding to interact?', type: 'long_text', next: () => 'q8' },
    q7e: { section: 'Section E — Behaviour patterns', title: 'What usually stops you from engaging?', type: 'long_text', next: () => 'q8' },

    q8: {
        section: 'Section E — Behaviour patterns',
        title: 'Do you find it easier to talk to someone one-on-one or when you are part of a group activity?',
        type: 'single_select',
        options: [
            { id: 'one_on_one', label: 'One-on-one' },
            { id: 'group_activity', label: 'Group activity' },
            { id: 'depends', label: 'Depends on the situation' },
            { id: 'neither_easy', label: 'Neither feels easy' }
        ],
        next: (ans) => {
            if (ans === 'one_on_one') return 'q8a';
            if (ans === 'group_activity') return 'q8b';
            if (ans === 'depends') return 'q8c';
            if (ans === 'neither_easy') return 'q8d';
            return 'q9';
        }
    },
    q8a: { section: 'Section E — Behaviour patterns', title: 'Why does one-on-one feel easier for you?', type: 'long_text', next: () => 'q9' },
    q8b: { section: 'Section E — Behaviour patterns', title: 'Why does group activity feel easier for you?', type: 'long_text', next: () => 'q9' },
    q8c: { section: 'Section E — Behaviour patterns', title: 'What makes the situation matter?', type: 'long_text', next: () => 'q9' },
    q8d: { section: 'Section E — Behaviour patterns', title: 'What would make social interaction feel easier for you?', type: 'long_text', next: () => 'q9' },

    // ── SECTION F: Digital interaction relevance ──
    q9: {
        section: 'Section F — Digital interaction relevance',
        title: 'Do you think it is easier to interact with new people online or in person?',
        type: 'single_select',
        options: [
            { id: 'online', label: 'Online' },
            { id: 'in_person', label: 'In person' },
            { id: 'both_similar', label: 'Both feel similar' },
            { id: 'neither_easy', label: 'Neither feels easy' }
        ],
        next: (ans) => {
            if (ans === 'online') return 'q9a';
            if (ans === 'in_person') return 'q9b';
            if (ans === 'both_similar') return 'q9c';
            if (ans === 'neither_easy') return 'q9d';
            return 'q10';
        }
    },
    q9a: {
        section: 'Section F — Digital interaction relevance',
        title: 'What makes online interaction easier?',
        type: 'multi_select',
        options: [
            { id: 'less_pressure', label: 'Less pressure' },
            { id: 'more_time', label: 'More time to think before replying' },
            { id: 'easier_common_interest', label: 'Easier to find common interests' },
            { id: 'less_judgment', label: 'Less fear of judgment' },
            { id: 'easier_approach', label: 'Easier to approach people' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q10'
    },
    q9b: {
        section: 'Section F — Digital interaction relevance',
        title: 'What makes in-person interaction easier?',
        type: 'multi_select',
        options: [
            { id: 'natural', label: 'Feels more natural' },
            { id: 'read_person', label: 'Easier to read the other person' },
            { id: 'flow', label: 'Better flow of conversation' },
            { id: 'genuine', label: 'More genuine connection' },
            { id: 'other', label: 'Other' }
        ],
        next: () => 'q10'
    },
    q9c: { section: 'Section F — Digital interaction relevance', title: 'In what situations does each one work better?', type: 'long_text', next: () => 'q10' },
    q9d: { section: 'Section F — Digital interaction relevance', title: 'What makes both online and in-person interaction difficult?', type: 'long_text', next: () => 'q10' },

    // ── SECTION Wrap-up ──
    q10: {
        section: 'Final open-ended wrap-up',
        title: 'If you could improve how students meet and connect with new people on campus, what would make that easier?',
        type: 'long_text',
        next: () => 'complete'
    },
    complete: {
        section: 'Completed',
        title: 'Thank you for your insights',
        type: 'completion',
        text: 'Your nuanced feedback helps us to better understand specific challenges students face and design truly supportive environments.',
        next: null
    }
};

/* ══════════════════════════════════════════════════
   RENDER ENGINE
════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    loadDraft();
    if (!currentQuestionId) {
        currentQuestionId = 'intro';
    } else if (currentQuestionId === 'complete') {
        renderComplete();
        return;
    }
    renderNode(currentQuestionId);
});

function loadDraft() {
    try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            responses = data.responses || {};
            historyStack = data.historyStack || [];
            currentQuestionId = data.currentQuestionId || 'intro';
        }
    } catch (e) {
        console.warn('Could not load draft', e);
    }
}

function saveDraft() {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            responses,
            historyStack,
            currentQuestionId
        }));
        showToast();
    } catch (e) { }
}

let toastTimer;
function showToast() {
    const toast = document.getElementById('autosave-toast');
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

function renderNode(qId) {
    if (qId === 'complete') {
        renderComplete();
        return;
    }
    const root = document.getElementById('survey-root');
    const node = SURVEY_PLAN[qId];
    if (!node) return;

    // Update Progress Bar
    const progWrap = document.getElementById('progress-wrapper');
    if (qId === 'intro' || qId === 'complete') {
        if (progWrap) progWrap.style.display = 'none';
    } else {
        if (progWrap) {
            progWrap.style.display = 'block';
            const keys = Object.keys(SURVEY_PLAN);
            const total = keys.length - 2; // Subtract intro/complete
            const currentIndex = keys.indexOf(qId);
            const pct = Math.min(Math.round(((currentIndex) / total) * 100), 100);
            document.getElementById('progress-label').textContent = node.section;
            document.getElementById('progress-pct').textContent = `${pct}%`;
            document.getElementById('progress-fill').style.width = `${pct}%`;
        }
    }

    let html = '';

    // Add page badge and heading
    if (node.type === 'completion') {
        html += `
        <div class="completion-center">
            <div class="completion-icon"></div>
            <h2 class="completion-heading">${node.title}</h2>
            <p class="completion-msg">${node.text}</p>
        </div>`;
    } else if (node.type === 'info') {
        html += `
        <div class="page-badge">👋 ${node.section}</div>
        <h2 class="page-heading">${node.title}</h2>
        <div class="page-subheading info-text" style="text-align: left; margin-top: 16px; margin-bottom: 24px;">${node.text}</div>
        
        ${node.details ? `
        <div class="info-details-grid">
            ${node.details.map(d => `
                <div class="info-detail-item">
                    <div class="info-detail-icon">${d.icon}</div>
                    <div class="info-detail-content">
                        <h4>${d.title}</h4>
                        <p>${d.desc}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${qId === 'intro' ? `
        <div class="consent-block-new">
            <label class="consent-label">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="consent-check">
                    <div class="checkbox-box"></div>
                </div>
                <span class="consent-text">I acknowledge the information provided and wish to continue with the survey.</span>
            </label>
        </div>
        ` : ''}
        `;
    } else {
        html += `
        <div class="page-badge">${node.section}</div>
        <div class="form-group">
            <h2 class="form-label" style="font-size: 16px; margin-bottom: 20px; line-height: 1.5; color: var(--label-primary); text-transform:none;">${node.title}</h2>
            ${renderInputGroup(qId, node)}
        </div>
        `;
    }

    // Dynamic filtering for Q6a options if derived from Q6
    if (qId === 'q6a' && responses['q6'] && responses['q6'].length > 0) {
        // filter options array based on array 'responses.q6'
    }

    // Buttons
    html += `<div class="btn-row">`;
    if (historyStack.length > 0 && qId !== 'complete') {
        html += `<button class="btn btn-ghost" onclick="goBack()">← Back</button>`;
    } else {
        html += `<div></div>`; // placeholder for flex
    }

    if (qId !== 'complete') {
        const isNextSubmit = (node.next && node.next(responses[qId]) === 'complete');
        const btnText = isNextSubmit ? 'Complete Survey' : 'Continue →';
        html += `<button class="btn btn-primary" id="btn-next" onclick="goNext('${qId}')">${btnText}</button>`;
    }
    html += `</div>`;

    root.innerHTML = `<div class="survey-page active">${html}</div>`;

    // Restore value
    if (responses[qId] !== undefined) {
        restoreValue(qId, node.type, responses[qId]);
    }
}

function renderInputGroup(qId, ObjectDetails) {
    if (ObjectDetails.type === 'single_select') {
        return `<div class="radio-group">
            ${ObjectDetails.options.map(opt => `
                <label class="radio-option">
                    <input type="radio" name="${qId}" value="${opt.id}" onchange="cacheValue('${qId}', '${opt.id}')">
                    <div class="custom-radio"></div>
                    <span class="option-label">${opt.label}</span>
                </label>
            `).join('')}
        </div>`;
    }

    if (ObjectDetails.type === 'multi_select') {
        return `<div class="checkbox-group">
            ${ObjectDetails.options.map(opt => `
                <label class="checkbox-option">
                    <input type="checkbox" name="${qId}" value="${opt.id}" onchange="cacheMulti('${qId}', this)">
                    <div class="custom-checkbox"></div>
                    <span class="option-label">${opt.label}</span>
                </label>
            `).join('')}
        </div>`;
    }

    if (ObjectDetails.type === 'scale') {
        return `<div class="likert-wrapper">
            <div class="likert-labels">
                <span>${ObjectDetails.minLabel || 1}</span>
                <span>${ObjectDetails.maxLabel || 5}</span>
            </div>
            <div class="likert-options">
                ${[1, 2, 3, 4, 5].map(v => `
                    <div class="likert-option">
                        <input type="radio" name="${qId}" id="${qId}_${v}" value="${v}" onchange="cacheValue('${qId}', '${v}')">
                        <label for="${qId}_${v}">${v}</label>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    if (ObjectDetails.type === 'short_text') {
        return `<input type="text" class="form-input" id="input_${qId}" oninput="cacheValue('${qId}', this.value)" placeholder="${ObjectDetails.prompt || 'Type your response...'}">`;
    }

    if (ObjectDetails.type === 'long_text') {
        return `<textarea class="form-textarea" id="input_${qId}" oninput="cacheValue('${qId}', this.value)" placeholder="${ObjectDetails.prompt || 'Provide details...'}"></textarea>`;
    }

    return '';
}

function cacheValue(qId, val) {
    responses[qId] = val;
    if (!responses.timestamps) responses.timestamps = {};
    responses.timestamps[qId] = Date.now();
    saveDraft();
}

function cacheMulti(qId, el) {
    if (!responses[qId]) responses[qId] = [];
    if (el.checked) {
        if (!responses[qId].includes(el.value)) responses[qId].push(el.value);
    } else {
        responses[qId] = responses[qId].filter(v => v !== el.value);
    }
    if (!responses.timestamps) responses.timestamps = {};
    responses.timestamps[qId] = Date.now();
    saveDraft();
}

function restoreValue(qId, type, value) {
    if (!value) return;
    if (type === 'single_select' || type === 'scale') {
        const el = document.querySelector(`input[name="${qId}"][value="${value}"]`);
        if (el) el.checked = true;
    } else if (type === 'multi_select') {
        const arr = Array.isArray(value) ? value : [];
        arr.forEach(v => {
            const el = document.querySelector(`input[name="${qId}"][value="${v}"]`);
            if (el) el.checked = true;
        });
    } else if (type === 'short_text' || type === 'long_text') {
        const el = document.getElementById(`input_${qId}`);
        if (el) el.value = value;
    }
}

function goBack() {
    if (historyStack.length === 0) return;
    const prevNodeId = historyStack.pop();
    currentQuestionId = prevNodeId;
    saveDraft();
    renderNode(currentQuestionId);
}

function goNext(qId) {
    const node = SURVEY_PLAN[qId];
    if (!node || !node.next) return;

    // Validate if required answers are given
    if (qId === 'intro') {
        const check = document.getElementById('consent-check');
        if (!check || !check.checked) {
            alert('Please acknowledge and agree to continue.');
            return;
        }
    }
    // Questions are now optional per user request. 
    // Users can click "Continue" without selecting an answer.

    const nextId = node.next(responses[qId]);
    if (nextId === 'complete') {
        submitAdaptiveSurvey();
    } else {
        historyStack.push(qId);
        currentQuestionId = nextId;
        saveDraft();
        renderNode(currentQuestionId);
    }
}

/* ══════════════════════════════════════════════════
   SUBMITTING TO SUPABASE (JSON Blob version)
════════════════════════════════════════════════════ */
function submitAdaptiveSurvey() {
    // We launch the modal from the template before actually sending
    const modal = document.getElementById('submit-modal');
    modal.classList.add('open');

    document.getElementById('modal-cancel').onclick = () => {
        modal.classList.remove('open');
    };

    document.getElementById('modal-confirm').onclick = async () => {
        const btn = document.getElementById('modal-confirm');
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        try {
            // Calculate final scores before final submission
            let resultProfile = null;
            if (typeof calculateAdaptiveScores === 'function') {
                resultProfile = calculateAdaptiveScores(responses);
                responses.computed_profile = resultProfile; // Store in record
            }

            if (typeof saveAdaptiveToSupabase === 'function') {
                const saveResult = await saveAdaptiveToSupabase(responses);
                if (saveResult && saveResult.id) {
                    lastRecordId = saveResult.id;
                }
            } else {
                console.warn("Supabase not linked or saveAdaptiveToSupabase not defined.");
            }

            // On success
            modal.classList.remove('open');
            historyStack.push(currentQuestionId);
            currentQuestionId = 'complete';
            saveDraft();
            renderNode('complete');
            localStorage.removeItem(DRAFT_KEY); // Clean up draft

        } catch (err) {
            alert('Error submitting survey: ' + err.message);
            btn.textContent = 'Submit Now';
            btn.disabled = false;
        }
    };
}

function renderComplete() {
    const root = document.getElementById('survey-root');

    // Auto-calculate if missing (e.g. on reload)
    if (!responses.computed_profile && typeof calculateAdaptiveScores === 'function') {
        responses.computed_profile = calculateAdaptiveScores(responses);
    }

    const profile = responses.computed_profile;

    if (!profile) {
        root.innerHTML = `
        <div class="survey-page active">
            <div class="completion-center">
                <div class="completion-icon"></div>
                <h2 class="completion-heading">Thank you</h2>
                <p class="completion-msg">Your nuanced feedback helps us to better understand specific challenges students face and design truly supportive environments.</p>
            </div>
        </div>`;
        return;
    }

    // Modern Profile View
    root.innerHTML = `
    <div class="survey-page active profile-page">
        <div class="profile-header">
            <div class="profile-badge">Researcher Analysis Complete</div>
            <h1 class="profile-style-label">${profile.style_label}</h1>
            <p class="profile-style-desc">${profile.style_description}</p>
        </div>

        <div class="results-section">
            <h3 class="section-title">Key Social Signals</h3>
            <div class="signals-grid">
                ${profile.signals.length > 0 ? profile.signals.map(s => `
                    <div class="signal-card">
                        <div class="signal-tag">${s.label}</div>
                        <p class="signal-desc">${s.desc}</p>
                    </div>
                `).join('') : '<p class="empty-msg">No distinctive behavioral signals detected in this session.</p>'}
            </div>
        </div>

        <div class="results-section">
            <h3 class="section-title">Trait Breakdown</h3>
            <div class="trait-grid">
                ${Object.keys(profile.scores).map(trait => {
        const label = trait.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const val = profile.scores[trait];
        return `
                    <div class="trait-card">
                        <div class="trait-info">
                            <span class="trait-label">${label}</span>
                            <span class="trait-val">${val}%</span>
                        </div>
                        <div class="trait-bar-container">
                            <div class="trait-bar-fill" style="width: ${val}%"></div>
                        </div>
                    </div>
                    `;
    }).join('')}
            </div>
        </div>

        <div class="results-section feedback-section" id="feedback-card">
            <h3 class="section-title">Is this you?</h3>
            <p class="feedback-intro">We want to verify if our analysis matches your actual experience. Your feedback helps improve the research.</p>
            
            <div class="feedback-container">
                <div class="feedback-question">
                    <span>Does this profile accurately reflect your campus personality?</span>
                    <div class="rating-buttons">
                        <button class="btn-rating" onclick="setFeedbackRating(5)" title="Strongly Agree">🤩</button>
                        <button class="btn-rating" onclick="setFeedbackRating(4)" title="Agree">🙂</button>
                        <button class="btn-rating" onclick="setFeedbackRating(3)" title="Neutral">😐</button>
                        <button class="btn-rating" onclick="setFeedbackRating(2)" title="Disagree">😞</button>
                    </div>
                </div>

                <div class="feedback-row">
                    <div class="feedback-item">
                        <label>Do you find this relatable?</label>
                        <div class="toggle-group">
                            <button class="btn-toggle" id="rel-yes" onclick="setRelatable(true)">Yes</button>
                            <button class="btn-toggle" id="rel-no" onclick="setRelatable(false)">No</button>
                        </div>
                    </div>
                    <div class="feedback-item">
                        <label>Was this insight relevant?</label>
                        <div class="toggle-group">
                            <button class="btn-toggle" id="rev-yes" onclick="setRelevant(true)">Yes</button>
                            <button class="btn-toggle" id="rev-no" onclick="setRelevant(false)">No</button>
                        </div>
                    </div>
                </div>

                <div class="feedback-footer">
                    <button class="btn btn-primary btn-sm" onclick="submitFeedbackUI()">Confirm My Traits</button>
                </div>
            </div>
        </div>

        <div class="profile-footer">
            <div class="analysis-disclaimer">
                <p><strong>Note:</strong> This analysis is based on rule-based behavioral mapping of your branching paths. It's intended to help you understand your primary social comfort zones on campus.</p>
            </div>
            <div class="footer-actions">
                <button class="btn btn-primary" onclick="window.location.reload()">Start New Session</button>
                <button class="btn btn-ghost" onclick="window.print()">Save Profile (PDF)</button>
            </div>
        </div>
    </div>`;
}

// Global feedback state for the results page
let currentFeedback = {
    rating: null,
    relatable: null,
    relevant: null
};

window.setFeedbackRating = (r) => {
    currentFeedback.rating = r;
    document.querySelectorAll('.btn-rating').forEach((b, i) => {
        b.classList.toggle('active', 5 - i === r);
    });
};

window.setRelatable = (val) => {
    currentFeedback.relatable = val;
    document.getElementById('rel-yes').classList.toggle('active', val === true);
    document.getElementById('rel-no').classList.toggle('active', val === false);
};

window.setRelevant = (val) => {
    currentFeedback.relevant = val;
    document.getElementById('rev-yes').classList.toggle('active', val === true);
    document.getElementById('rev-no').classList.toggle('active', val === false);
};

window.submitFeedbackUI = async () => {
    if (currentFeedback.rating === null) {
        alert('Please select a rating before submitting.');
        return;
    }

    const card = document.getElementById('feedback-card');
    const footer = card.querySelector('.feedback-footer');
    footer.innerHTML = '<span class="saving-text">Sending feedback...</span>';

    if (typeof updateFeedbackInSupabase === 'function' && lastRecordId) {
        await updateFeedbackInSupabase(lastRecordId, currentFeedback);
    }

    card.innerHTML = `
        <div class="feedback-success">
            <h3>Thank you for confirming!</h3>
            <p>Your feedback has been linked to your session. This helps us ensure our behavioral models are accurate for the student community.</p>
        </div>
    `;
};
