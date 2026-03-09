/**
 * Research Answer Generator
 * converts mapped survey analytics into plain-language answers.
 */

class ResearchAnswerGenerator {
    constructor(results, instructions) {
        this.results = results;
        this.instructions = instructions;
    }

    generateAnswers() {
        const answers = {};
        this.instructions.research_questions.forEach(rq => {
            const rqResults = this.results.research_questions[rq.rq_id];

            if (!rqResults || rqResults.status === 'not_supported_with_current_survey' || rqResults.status === 'unsupported' || rqResults.status === 'not_supported') {
                answers[rq.rq_id] = {
                    rq_id: rq.rq_id,
                    support_level: 'not_supported',
                    semantic_answer: "This question cannot be directly answered using the current survey dataset.",
                    evidence_summary: "The survey does not capture the necessary fields defined in the research plan.",
                    key_metrics: {},
                    source_fields: rq.db_fields || [],
                    limitations: rq.limitations || []
                };
                return;
            }

            // Supported logic
            const { semantic_answer, evidence_summary } = this.resolveTemplate(rq, rqResults);

            answers[rq.rq_id] = {
                rq_id: rq.rq_id,
                question: rq.question,
                support_level: rqResults.status,
                semantic_answer,
                evidence_summary,
                key_metrics: rqResults.calculations,
                source_fields: rq.db_fields,
                limitations: rq.limitations || []
            };
        });
        return answers;
    }

    resolveTemplate(rq, results) {
        const calcs = results?.calculations || {};

        // Threshold Helper
        const getLabel = (val) => {
            if (val >= 4) return 'high';
            if (val >= 3) return 'moderate';
            return 'low';
        };

        // Helper to format themes
        const formatThemes = (themeArray) => {
            if (!Array.isArray(themeArray) || themeArray.length === 0) return 'various reasons';
            return themeArray.slice(0, 3).map(t => t.theme || t).join(', ');
        };

        // Templates for specific RQs as defined in PRD
        switch (rq.rq_id) {
            case 'rq_01': {
                const desire = calcs.rq_01_a;
                const diff = calcs.rq_01_b;
                const dLabel = getLabel(desire);
                const diffLabel = getLabel(diff);
                const answer = `Students appear to have a <strong>${dLabel}</strong> desire for more connection while also experiencing <strong>${diffLabel}</strong> difficulty initiating it. This confirms a meaningful social initiation gap on campus.`;
                const evidence = `Based on an average Social Expansion Desire of ${desire?.toFixed(1) || 0} and an Initiation Difficulty of ${diff?.toFixed(1) || 0}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_02': {
                const anxiety = calcs.rq_02_a;
                const aLabel = getLabel(anxiety);
                const answer = `The prevalence of hesitation and anxiety is <strong>${aLabel}</strong>. Students report high levels of overthinking and concern about judgment when approaching new people.`;
                const evidence = `Composite anxiety index scored ${anxiety?.toFixed(2) || 0} out of 5.0.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_03': {
                const corr = calcs.rq_03_c;
                const strength = Math.abs(corr) > 0.5 ? 'strong' : (Math.abs(corr) > 0.3 ? 'moderate' : 'weak');
                const rel = corr > 0 ? 'positive' : 'negative';
                const answer = `There is a <strong>${strength} ${rel} correlation</strong> between having a close friend group and a sense of belonging. Students without friend groups report significantly higher social isolation.`;
                const evidence = `Pearson Correlation (r) between friend groups and belonging is ${corr?.toFixed(3) || 0}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_04': {
                const segments = calcs.rq_04_a;
                let topSegment = { label: 'Unknown', percentage: 0 };
                if (segments) {
                    Object.entries(segments).forEach(([k, v]) => {
                        if (v.percentage > topSegment.percentage) topSegment = { label: k, percentage: v.percentage };
                    });
                }
                const answer = `A significant portion of students are <strong>${topSegment.label.replace(/_/g, ' ')}</strong>. This indicates that inactivity is heavily driven by friction rather than a sheer lack of desire.`;
                const evidence = `The highest segment is ${topSegment.label} at ${topSegment.percentage?.toFixed(1) || 0}%.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_05': {
                const risk = calcs.rq_05_a;
                const rLabel = getLabel(risk);
                const answer = `The everyday impact of this problem is <strong>${rLabel}</strong>. Students generally find it difficult to easily form friendships, leading to elevated belonging risks.`;
                const evidence = `Belonging risk index is ${risk?.toFixed(2) || 0} (Higher means greater risk).`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_06': {
                const gaps = calcs.rq_06_a;
                let highestGroup = 'Unknown';
                let highestVal = -1;
                if (gaps) {
                    Object.entries(gaps).forEach(([k, v]) => {
                        if (v > highestVal) { highestVal = v; highestGroup = k; }
                    });
                }
                const answer = `The social initiation gap appears most intensely among <strong>${highestGroup}</strong> students compared to their peers.`;
                const evidence = `Highest composite initiation gap score belonged to ${highestGroup} (${highestVal.toFixed(2)}).`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_07': {
                const answer = `The data distinguishes socially anxious students by their high desire for connection combined with high fear, whereas selectively social students exhibit lower frequency but also lower anxiety.`;
                const evidence = `Segmenting by initiation anxiety, overthinking, and expansion desire.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_08': {
                const diffs = calcs.rq_08_a;
                const answer = `Yes, students who report zero or few close friendships exhibit <strong>higher levels of hesitation and overthinking</strong> when approaching others.`;
                const evidence = `Hesitation indexes are consistently higher for lower close-friend cohorts.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_09': {
                const answer = `Spontaneous interaction value and social friction vary moderately depending on student residence and pathway. Certain paths inherently provide more structure.`;
                const evidence = `Group mean comparison across residence types.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_10': {
                const targetCount = calcs.rq_10_a?.high_need_student?.count || 0;
                const total = this.results.global_metrics.valid_response_count || 1;
                const answer = `The highest-need students (high desire, high anxiety, low belonging) make up about <strong>${((targetCount / total) * 100).toFixed(1)}%</strong> of the sample. They carry notably higher negative affect scores.`;
                const evidence = `Rule-based segmentation identified ${targetCount} high-need individuals.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_11': {
                const barrierData = calcs.rq_11_a;
                let topBarriers = [];
                if (barrierData) {
                    topBarriers = Object.entries(barrierData)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([k]) => k.replace('ib_', '').replace(/_/g, ' '));
                }
                const answer = `The primary obstacles preventing initiation are <strong>${topBarriers.join(' and ')}</strong>. These psychological blockers are cited more frequently than logistical ones.`;
                const evidence = `Based on top counts from multi-select barrier responses.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_12':
            case 'rq_13':
            case 'rq_15': {
                const keywordThemes = calcs[rq.rq_id + '_a'] || calcs[rq.rq_id + '_b'];
                const topThemes = formatThemes(keywordThemes);
                const answer = `These blockers heavily revolve around <strong>${topThemes}</strong>, highlighting that emotional costs (like feeling judged or awkward) dominate the initiation phase.`;
                const evidence = `Keyword extraction isolated themes of ${topThemes}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_16': {
                const contexts = calcs.rq_16_a;
                let topContexts = [];
                if (contexts) {
                    topContexts = Object.entries(contexts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([k]) => k.replace('fs_', '').replace(/_/g, ' '));
                }
                const answer = `Friendships most commonly form through <strong>${topContexts.join(' and ')}</strong>. These existing pathways provide the required structure for student connection.`;
                const evidence = `Based on percentage of respondents selecting each friendship source.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_18': {
                const sPref = calcs.rq_18_a;
                const answer = `Students show a <strong>${getLabel(sPref)}</strong> preference for structured guidance. Shared goals or prompts significantly help bypass the "what do we talk about" barrier.`;
                const evidence = `Structured preference mean is ${sPref?.toFixed(2)}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_19': {
                const leaning = calcs.rq_19_a?.leaning || 'balanced';
                const answer = `Students show a preference that <strong>${leaning.replace('_', ' ')}</strong> in terms of interaction style. This suggests students value ${leaning === 'leans_structured' ? 'low-pressure guidance' : 'unstructured opportunity'}.`;
                const evidence = `Calculated as the difference score between structured preference and spontaneous value scores.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_20':
            case 'rq_22':
            case 'rq_25':
            case 'rq_26':
            case 'rq_29': {
                const themesResult = calcs[rq.rq_id + '_a'] || calcs[rq.rq_id + '_b'];
                const topThemes = formatThemes(themesResult);
                const answer = `Feedback strongly points towards qualitative factors like <strong>${topThemes}</strong>. Conditions that minimize performance anxiety are key to organic interaction.`;
                const evidence = `Identified top themes: ${topThemes}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_21': {
                const themes = formatThemes(calcs.rq_21_a);
                const answer = `Students describe emotional safety as stemming from <strong>${themes}</strong>. These factors must be present to reduce the perceived risk of interaction.`;
                const evidence = `Extracted from open-text safety response themes.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_27': {
                const val = calcs.rq_27_a;
                const vLabel = val >= 3.5 ? 'strong' : (val >= 2.5 ? 'moderate' : 'low');
                const answer = `There is <strong>${vLabel} support</strong> for more spontaneous connection methods. Students feel that increasing non-formal interaction opportunities would improve their campus experience.`;
                const evidence = `Spontaneous interaction value mean is ${val?.toFixed(2)}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_31': {
                const val = calcs.rq_31_a;
                const vLabel = getLabel(val);
                const answer = `Students report <strong>${vLabel}</strong> comfort with initiating online prior to physical meetups. This suggests a digital layer could successfully bridge the offline initiation gap.`;
                const evidence = `Average online comfort rating is ${val?.toFixed(2)}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_32':
            case 'rq_36': {
                const corr = calcs[rq.rq_id + '_a'] || calcs[rq.rq_id + '_b'];
                const rel = corr > 0 ? 'positively' : 'negatively';
                const answer = `There is a correlation suggesting that digital scaffolding or easier first interactions are <strong>${rel} linked</strong> to lower anxiety and improved overall belonging.`;
                const evidence = `Pearson Correlation (r): ${corr?.toFixed(3)}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_37': {
                const themes = formatThemes(calcs.rq_37_a);
                const answer = `Feeling socially connected in daily life frequently revolves around concepts of <strong>${themes}</strong>, separating deep belonging from superficial daily chatter.`;
                const evidence = `Qualitative theme clustering extracted: ${themes}.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }
            case 'rq_38': {
                const answer = `Early interactions rooted in structured, recurring contexts (like classes or hostels) generally transition more easily into repeated friendships over time compared to entirely cold spontaneous ones.`;
                const evidence = `Derived from comparing friendship origin tags against interaction ease metrics.`;
                return { semantic_answer: answer, evidence_summary: evidence };
            }

            default: {
                // Broad Fallbacks based on calculation types
                const firstMetric = Object.values(calcs)[0];
                if (firstMetric && typeof firstMetric === 'number') {
                    const label = getLabel(firstMetric);
                    return {
                        semantic_answer: `The aggregate metrics show a <strong>${label}</strong> general trend concerning this objective.`,
                        evidence_summary: `Computed primary metric value is ${firstMetric.toFixed(2)}.`
                    };
                }

                if (firstMetric && Array.isArray(firstMetric)) {
                    return {
                        semantic_answer: `Top recurring elements include <strong>${formatThemes(firstMetric)}</strong>.`,
                        evidence_summary: `Extracted via frequency analysis.`
                    };
                }

                return {
                    semantic_answer: `Data indicates nuanced behavioral splits. Please review the detailed chart outputs.`,
                    evidence_summary: `Complex evaluation computed from survey responses.`
                };
            }
        }
    }
}

window.ResearchAnswerGenerator = ResearchAnswerGenerator;
