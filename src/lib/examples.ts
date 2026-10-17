/** Example questions. The demo workspace asks about the seeded sample company; a signed-in workspace asks about its own connected data. */
export const DEMO_PRIMARY_QUERY = "What services break if auth-v1 is shut down?";

export const DEMO_HERO_PROMPTS = [
  "What breaks if auth-v1 is shut down?",
  "Why was DEC-44 decided?",
  "Who owns payments-api?",
  "Audit PR #214",
];

export const PERSONAL_PRIMARY_QUERY = "What needs my attention across my connected accounts this week?";

export const PERSONAL_HERO_PROMPTS = [
  "What needs my attention in my inbox?",
  "What is on my calendar in the next 3 days?",
  "Which of my GitHub pull requests are open?",
  "Which documents changed recently?",
];

export const personalPlaceholder = "Ask about your email, calendar, documents or GitHub…";

export const primaryQuery = (personal: boolean) => (personal ? PERSONAL_PRIMARY_QUERY : DEMO_PRIMARY_QUERY);
export const heroPrompts = (personal: boolean) => (personal ? PERSONAL_HERO_PROMPTS : DEMO_HERO_PROMPTS);
