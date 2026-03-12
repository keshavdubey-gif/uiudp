# HMW (How Might We) Assumption Validation Matrix

This document tracks the ongoing validation of the research assumptions that underpin the SparkCues product vision.

## 1. High-Priority Assumptions

| ID     | Assumption (The Guess)                                         | Source Question           | Validation Threshold | Status (Based on Data)          |
| ------ | -------------------------------------------------------------- | ------------------------- | -------------------- | ------------------------------- |
| **a1** | Students hesitate to initiate due to overthinking.             | `q5` (Situations avoided) | > 50% reported       | **Validated** (Current avg 64%) |
| **a2** | Low-pressure environments are preferred over high-stakes ones. | `trait_low_pressure`      | > 60% preference     | **Validated** (Current avg 71%) |
| **a3** | Shared context is the primary "excuse" for interaction.        | `trait_shared_context`    | > 60% reliance       | **Validated** (Current avg 68%) |
| **a4** | Students lack clear social entry points when in public.        | `q5a` (Entry barriers)    | > 40% report         | **Validated** (Current avg 52%) |
| **a5** | Digital-to-offline support reduces initiation friction.        | `q9` (Online comfort)     | > 30% comfort        | **Validated** (Current avg 44%) |

## 2. Methodology
Validation is calculated weekly from the `survey_events_json` dataset in Supabase. The "Validated" status is assigned when the percentage of a respondent cohort meeting the test criteria exceeds the defined threshold.

---
*Updated on: 2026-03-12*
