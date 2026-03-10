/**
 * Campus Social Research Analysis Engine
 * analysis-engine.js - Implements calculations defined in instructions.json
 */

'use strict';

class AnalysisEngine {
    constructor(data, instructions) {
        // Default filter: exclude suspect submissions
        this.rawData = data;
        this.data = data.filter(r => r.suspect_submission !== true);
        this.instructions = instructions;
    }

    /**
     * Entry point to calculate all metrics
     */
    calculateAll() {
        const results = {
            global_metrics: {},
            research_questions: {},
            segments: {}
        };

        // 1. Calculate Global Metrics
        this.instructions.global_metrics.forEach(m => {
            results.global_metrics[m.metric_id] = this.runCalculation(m);
        });

        // 2. Calculate Research Questions
        this.instructions.research_questions.forEach(rq => {
            if (rq.support_level === 'not_supported_with_current_survey') {
                results.research_questions[rq.rq_id] = { status: 'unsupported' };
                return;
            }

            const rqResults = {
                status: rq.support_level,
                calculations: {}
            };

            rq.calculations.forEach(calc => {
                rqResults.calculations[calc.calc_id] = this.runCalculation(calc);
            });

            results.research_questions[rq.rq_id] = rqResults;
        });

        return results;
    }

    /**
     * Route calculation to the correct formula
     */
    runCalculation(spec) {
        const type = spec.formula_type;
        const data = this.data;

        switch (type) {
            case 'count':
                return this.count(data, spec);
            case 'mean':
                return this.mean(data, spec);
            case 'composite_mean':
                return this.compositeMean(data, spec);
            case 'composite_mean_with_reverse_code':
                return this.compositeMeanWithReverse(data, spec);
            case 'frequency_distribution':
                return this.frequencyDistribution(data, spec);
            case 'group_mean_compare':
                return this.groupMeanCompare(data, spec);
            case 'group_composite_mean':
                return this.groupCompositeMean(data, spec);
            case 'correlation':
                return this.correlation(data, spec);
            case 'rule_based_segmentation':
                return this.ruleBasedSegmentation(data, spec);
            case 'multi_select_count':
                return this.multiSelectCount(data, spec);
            case 'multi_select_percentage':
                return this.multiSelectPercentage(data, spec);
            case 'boolean_prevalence':
                return this.booleanPrevalence(data, spec);
            case 'difference_score':
                return this.differenceScore(data, spec);
            case 'keyword_theme_extraction':
            case 'keyword_theme_extraction_dual_field':
            case 'open_text_semantic_clustering':
                return this.extractThemes(data, spec);
            case 'multi_select_vs_numeric_compare':
                return this.multiSelectVsNumeric(data, spec);
            case 'hybrid_barrier_index':
                return this.hybridBarrierIndex(data, spec);
            default:
                console.warn(`Unknown formula type: ${type}`);
                return null;
        }
    }

    // --- Formula Implementations ---

    count(data, spec) {
        // Filters are already applied to this.data for global metrics if needed
        // but some metrics might have specific filters
        let filtered = data;
        if (spec.filters) {
            // Simplified filter engine
            spec.filters.forEach(f => {
                if (f === 'suspect_submission = false') filtered = filtered.filter(r => !r.suspect_submission);
                if (f === 'suspect_submission = true') filtered = this.rawData.filter(r => r.suspect_submission);
            });
        }
        return filtered.length;
    }

    mean(data, spec) {
        const vals = data.map(r => parseFloat(r[spec.field])).filter(v => !isNaN(v));
        if (vals.length === 0) return 0;
        const sum = vals.reduce((a, b) => a + b, 0);
        return sum / vals.length;
    }

    compositeMean(data, spec) {
        const responseMeans = data.map(r => {
            const vals = spec.fields.map(f => parseFloat(r[f])).filter(v => !isNaN(v));
            return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        }).filter(m => m !== null);

        if (responseMeans.length === 0) return 0;
        return responseMeans.reduce((a, b) => a + b, 0) / responseMeans.length;
    }

    compositeMeanWithReverse(data, spec) {
        const responseMeans = data.map(r => {
            const vals = spec.fields.map(f => {
                let v = parseFloat(r[f]);
                if (isNaN(v)) return null;
                if (spec.reverse_code_fields.includes(f)) {
                    v = spec.scale_max + spec.scale_min - v;
                }
                return v;
            }).filter(v => v !== null);
            return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        }).filter(m => m !== null);

        if (responseMeans.length === 0) return 0;
        return responseMeans.reduce((a, b) => a + b, 0) / responseMeans.length;
    }

    frequencyDistribution(data, spec) {
        const counts = {};
        let total = 0;
        data.forEach(r => {
            const val = r[spec.field];
            if (val === undefined || val === null || val === '') return;
            counts[val] = (counts[val] || 0) + 1;
            total++;
        });
        const dist = {};
        for (const [key, count] of Object.entries(counts)) {
            dist[key] = {
                count,
                percentage: (count / total) * 100
            };
        }
        return dist;
    }

    groupMeanCompare(data, spec) {
        const groups = {};
        data.forEach(r => {
            const g = r[spec.group_field];
            const v = parseFloat(r[spec.value_field]);
            if (!g || isNaN(v)) return;
            if (!groups[g]) groups[g] = [];
            groups[g].push(v);
        });

        const results = {};
        for (const [g, vals] of Object.entries(groups)) {
            results[g] = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
        return results;
    }

    groupCompositeMean(data, spec) {
        const groups = {};
        data.forEach(r => {
            const g = r[spec.group_field];
            if (!g) return;
            const vals = spec.fields.map(f => parseFloat(r[f])).filter(v => !isNaN(v));
            if (vals.length === 0) return;
            const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
            if (!groups[g]) groups[g] = [];
            groups[g].push(mean);
        });

        const results = {};
        for (const [g, means] of Object.entries(groups)) {
            results[g] = means.reduce((a, b) => a + b, 0) / means.length;
        }
        return results;
    }

    correlation(data, spec) {
        let xVals, yVals;

        if (spec.field_x) {
            const valid = data.filter(r => !isNaN(parseFloat(r[spec.field_x])));
            xVals = valid.map(r => parseFloat(r[spec.field_x]));
            if (spec.field_y) {
                yVals = valid.map(r => parseFloat(r[spec.field_y]));
            } else if (spec.field_y_composite_fields) {
                yVals = valid.map(r => {
                    const comps = spec.field_y_composite_fields.map(f => parseFloat(r[f])).filter(v => !isNaN(v));
                    return comps.length > 0 ? comps.reduce((a, b) => a + b, 0) / comps.length : NaN;
                });
            }
        }

        // Remove any NaN indices from both
        const cleanX = [], cleanY = [];
        for (let i = 0; i < xVals.length; i++) {
            if (!isNaN(xVals[i]) && !isNaN(yVals[i])) {
                cleanX.push(xVals[i]);
                cleanY.push(yVals[i]);
            }
        }

        return this.pearsonCorrelation(cleanX, cleanY);
    }

    pearsonCorrelation(x, y) {
        const n = x.length;
        if (n < 2) return 0;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }
        const num = n * sumXY - sumX * sumY;
        const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        if (den === 0) return 0;
        return num / den;
    }

    ruleBasedSegmentation(data, spec) {
        const segmentCounts = {};
        spec.rules.forEach(rule => segmentCounts[rule.label] = 0);

        let matchedCount = 0;

        data.forEach(r => {
            let matched = false;
            for (const rule of spec.rules) {
                let match = true;
                for (const condition of rule.conditions) {
                    if (!this.evalCondition(r, condition)) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    segmentCounts[rule.label]++;
                    matchedCount++;
                    matched = true;
                    // Assuming one segment per user for simplicity (first match wins or mutually exclusive)
                    break;
                }
            }
        });

        // Add 'Others' if not exhaustive
        if (matchedCount < data.length) {
            segmentCounts['Others'] = data.length - matchedCount;
        }

        const total = data.length;
        const results = {};
        for (const [label, count] of Object.entries(segmentCounts)) {
            results[label] = {
                count,
                percentage: (count / total) * 100
            };
        }
        return results;
    }

    evalCondition(r, condition) {
        // Handle OR logic
        if (condition.includes(' OR ')) {
            const parts = condition.split(' OR ');
            return parts.some(part => this.evalCondition(r, part.trim()));
        }

        // Extremely simple parser: "field op value" or "field in [list]"
        if (condition.includes(' in ')) {
            const [field, listStr] = condition.split(' in ');
            const list = JSON.parse(listStr.replace(/'/g, '"'));
            return list.includes(r[field.trim()]);
        }

        const match = condition.match(/^(\w+)\s*([<>=!]+)\s*(.*)$/);
        if (!match) return false;

        const [, field, op, valueStr] = match;
        const actual = r[field];
        const target = isNaN(parseFloat(valueStr)) ? valueStr.replace(/'/g, '') : parseFloat(valueStr);

        switch (op) {
            case '>=': return parseFloat(actual) >= target;
            case '<=': return parseFloat(actual) <= target;
            case '>': return parseFloat(actual) > target;
            case '<': return parseFloat(actual) < target;
            case '==':
            case '=': return String(actual) === String(target);
            case '!=': return String(actual) !== String(target);
            default: return false;
        }
    }

    multiSelectCount(data, spec) {
        const results = {};
        spec.fields.forEach(f => {
            results[f] = data.filter(r => r[f] === true).length;
        });
        return results;
    }

    multiSelectPercentage(data, spec) {
        const counts = this.multiSelectCount(data, spec);
        const total = data.length;
        const results = {};
        for (const [f, count] of Object.entries(counts)) {
            results[f] = (count / total) * 100;
        }
        return results;
    }

    booleanPrevalence(data, spec) {
        const count = data.filter(r => r[spec.field] === true).length;
        return (count / data.length) * 100;
    }

    differenceScore(data, spec) {
        const diffs = data.map(r => {
            const a = parseFloat(r[spec.field_a]);
            const b = parseFloat(r[spec.field_b]);
            if (isNaN(a) || isNaN(b)) return null;
            return a - b;
        }).filter(d => d !== null);

        if (diffs.length === 0) return { mean: 0, leaning: 'balanced' };

        const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        let leaning = spec.output_labels.zero;
        if (mean > 0.5) leaning = spec.output_labels.positive;
        else if (mean < -0.5) leaning = spec.output_labels.negative;

        return { mean, leaning };
    }

    extractThemes(data, spec) {
        // Simplified theme extraction: Keyword counting
        const keywords = spec.keywords_seed || [];
        const fields = spec.field ? [spec.field] : spec.fields;
        const text = data.map(r => fields.map(f => r[f] || '').join(' ')).join(' ').toLowerCase();

        const results = [];
        keywords.forEach(kw => {
            const regex = new RegExp(kw, 'gi');
            const count = (text.match(regex) || []).length;
            if (count > 0) {
                results.push({ theme: kw, frequency: count });
            }
        });

        return results.sort((a, b) => b.frequency - a.frequency);
    }

    multiSelectVsNumeric(data, spec) {
        const results = {};
        spec.binary_fields.forEach(f => {
            const hasBit = data.filter(r => r[f] === true);
            const noBit = data.filter(r => r[f] === false);

            const meanHas = this.mean(hasBit, { field: spec.numeric_field });
            const meanNo = this.mean(noBit, { field: spec.numeric_field });

            results[f] = { selected: meanHas, not_selected: meanNo };
        });
        return results;
    }

    hybridBarrierIndex(data, spec) {
        const multi = this.multiSelectPercentage(data, { fields: spec.binary_fields });
        const scaled = this.mean(data, { field: spec.scaled_field });
        return {
            binary_percentages: multi,
            scaled_mean: scaled
        };
    }
}

// Export for browser
window.AnalysisEngine = AnalysisEngine;
