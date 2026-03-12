/**
 * Combined Question Metadata for both Adaptive and Traditional Surveys
 */
window.QUESTION_METADATA = {
    // ── ADAPTIVE SURVEY QUESTIONS ──
    adaptive: {
        q1: { text: "Do you generally like interacting with new people on campus?", type: "single_select", domain: "social-willingness" },
        q2: { text: "Details of your last interaction with someone new.", type: "long_text" },
        q2a: { text: "Where did this interaction happen?", type: "single_select" },
        q2b: { text: "What started the conversation?", type: "multi_select" },
        q2c: { text: "Who initiated the conversation?", type: "single_select" },
        q2d: { text: "How comfortable did that interaction feel?", type: "scale", minLabel: "Uncomfortable", maxLabel: "Comfortable", domain: "comfort" },
        q2e: { text: "What made it uncomfortable?", type: "multi_select" },
        q2f: { text: "What made it comfortable?", type: "multi_select" },
        q4: { text: "Situations where talking feels easier/natural?", type: "single_select" },
        q4a: { text: "Which situations feel easier?", type: "multi_select" },
        q4b: { text: "Why do these situations feel easier?", type: "multi_select" },
        q5: { text: "Situations where you avoid starting conversations?", type: "single_select" },
        q5a: { text: "What makes those situations difficult?", type: "multi_select" },
        q5b: { text: "What do you usually do instead?", type: "multi_select" },
        q6: { text: "What motivates you to talk to strangers?", type: "multi_select" },
        q7: { text: "Behaviour when joining new groups/events?", type: "single_select" },
        q8: { text: "One-on-one vs Group activity preference?", type: "single_select" },
        q9: { text: "Online vs In-person interaction ease?", type: "single_select" },
        q10: { text: "Suggestions to make campus connection easier.", type: "long_text" }
    },
    // ── TRADITIONAL SURVEY QUESTIONS ──
    traditional: {
        social_satisfaction: { text: "Satisfaction with social life on campus?", type: "scale", minLabel: "Dissatisfied", maxLabel: "Highly Satisfied", domain: "positive" },
        belonging: { text: "Sense of belonging at university?", type: "scale", minLabel: "None", maxLabel: "Strong", domain: "positive" },
        close_friends: { text: "Number of close friends on campus?", type: "numeric" },
        social_isolation: { text: "Frequency of feeling isolated/left out?", type: "scale", minLabel: "Never", maxLabel: "Constantly", domain: "negative" },
        social_frequency: { text: "Frequency of interacting with new people?", type: "single_select" },
        friendship_ease: { text: "Ease of making new friends?", type: "single_select" },
        initiation_anxiety: { text: "Anxiety felt when initiating a conversation?", type: "scale", minLabel: "Low/None", maxLabel: "Severe", domain: "negative" },
        overthinking: { text: "Level of overthinking social interactions?", type: "scale", minLabel: "None", maxLabel: "Constant", domain: "negative" },
        avoidance: { text: "Frequency of avoiding social situations?", type: "scale", minLabel: "Rarely", maxLabel: "Always", domain: "negative" },
        judgment_concern: { text: "Worry about being judged by others?", type: "scale", minLabel: "Not at all", maxLabel: "Deeply", domain: "negative" },
        conversation_initiator: { text: "Typical initiator in new interactions?", type: "single_select" },
        first_interaction_comfort: { text: "Comfort during first minutes of interaction?", type: "single_select" },
        social_expansion_desire: { text: "Desire to expand social circle?", type: "scale", minLabel: "Low", maxLabel: "Extremely High", domain: "positive" },
        online_comfort: { text: "Comfort level with digital/online interaction?", type: "scale", minLabel: "Prefer Face-to-Face", maxLabel: "Digital First", domain: "neutral" },
        structured_preference: { text: "Preference for structured social activities?", type: "scale", minLabel: "Prefer Random/Spontaneous", maxLabel: "High Structure", domain: "neutral" },
        spontaneous_value: { text: "Valuing of spontaneous social encounters?", type: "scale", minLabel: "Not Valued", maxLabel: "Highly Valued", domain: "positive" },
        social_friction_open: { text: "What makes it harder for you to talk to someone new?", type: "long_text" },
        safety_factors: { text: "What would make social interaction feel safer or more comfortable?", type: "long_text" }
    }
};
