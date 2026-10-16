export interface SourceDetail {
  id: string;
  type: "rfc" | "meeting" | "pr" | "decision" | "service";
  title: string;
  author: string;
  date: string;
  url: string;
  badge: string;
  snippet: string;
  falkorNode: string;
  graphHops: string[];
}

export const ENTERPRISE_SOURCES: Record<string, SourceDetail> = {
  "RFC-102": {
    id: "RFC-102",
    type: "rfc",
    title: "RFC-102: Auth v1 Sunset & Gateway Migration",
    author: "Sarah Chen (Staff Systems Architect)",
    date: "Aug 12, 2026",
    url: "https://docs.google.com/document/d/1XyZ-auth-v1-sunset",
    badge: "Google Docs • Approved",
    snippet:
      "This document outlines the deprecation roadmap for auth-v1. Due to non-compliance with SOC2 Type II audit controls and lack of granular token scopes, auth-v1 is declared Tier 2 (Deprecated). All internal services (mobile-app, web-checkout) must migrate to identity-service by November 1, 2026. Zero direct traffic to auth-v1 is permitted after this date.",
    falkorNode: "(:Doc {id: 'RFC-102', title: 'RFC-102: Auth v1 Sunset'})",
    graphHops: ["RFC-102", "auth-v1", "DEC-44", "David Kim"],
  },
  "DEC-44": {
    id: "DEC-44",
    type: "decision",
    title: "DEC-44: Mandatory Deprecation of Auth-v1 by Nov 1, 2026",
    author: "David Kim (VP of Engineering)",
    date: "Aug 15, 2026",
    url: "https://company.internal/decisions/DEC-44",
    badge: "Executive Policy • Active",
    snippet:
      "Policy Statement: Auth-v1 cannot receive new traffic or feature enhancements. All engineering teams must route through the api-gateway to identity-service with mTLS. Enforced by automated PR governance watchdog.",
    falkorNode: "(:Decision {id: 'DEC-44', status: 'Active'})",
    graphHops: ["DEC-44", "auth-v1", "identity-service", "Q3 Global Architecture Review"],
  },
  "Q3-MEETING": {
    id: "Q3-MEETING",
    type: "meeting",
    title: "Q3 Global Architecture Review (Meeting Minutes)",
    author: "David Kim, Sarah Chen, Alex Mercer, Priya Patel",
    date: "Aug 15, 2026",
    url: "https://meet.google.com/rec/q3-arch-review-aug15",
    badge: "Google Meet • Transcript Verified",
    snippet:
      "Transcript excerpt: David Kim: 'We cannot risk SOC2 failure in Q4. Sarah, does RFC-102 have full buy-in?' Sarah Chen: 'Checkout & Payments and Core Infra are aligned. Mobile has until Oct 15 to cut over.' David Kim: 'Motion approved. Formalize DEC-44 immediately.'",
    falkorNode: "(:Meeting {title: 'Q3 Global Architecture Review'})",
    graphHops: ["Q3 Global Architecture Review", "DEC-44", "Sarah Chen", "David Kim"],
  },
  "PR-214": {
    id: "PR-214",
    type: "pr",
    title: "GitHub PR #214: feat(auth): re-enable fallback token cache on auth-v1",
    author: "Alex Mercer (Lead Mobile Engineer)",
    date: "Oct 14, 2026",
    url: "https://github.com/company/mobile-app/pull/214",
    badge: "GitHub PR • Intercepted",
    snippet:
      "PR Description: 'Temporary fallback to auth-v1 to mitigate checkout latency during peak sales hours.'\n\nAutomated Audit Status: 🚨 BLOCKED by CompanyMind AI Governance Watchdog. Direct violation of DEC-44 mandated by Executive Leadership.",
    falkorNode: "(:GitHubPR {number: 214, author: 'Alex Mercer'})",
    graphHops: ["GitHubPR #214", "auth-v1", "DEC-44", "RFC-102"],
  },
  "auth-v1": {
    id: "auth-v1",
    type: "service",
    title: "auth-v1 Microservice (Legacy Auth)",
    author: "Core Infrastructure Team (Lead: Sarah Chen)",
    date: "2024–2026",
    url: "https://github.com/company/auth-v1",
    badge: "Service • Tier 2 (Deprecated)",
    snippet:
      "Legacy authentication cluster deployed on Kubernetes. Downstream blast radius: api-gateway (1 hop) → mobile-app (2 hops) → web-checkout (2 hops). Sunsetting in progress under DEC-44.",
    falkorNode: "(:Service {name: 'auth-v1', tier: 'Tier 2 (Deprecated)'})",
    graphHops: ["auth-v1", "api-gateway", "mobile-app", "web-checkout"],
  },
  "identity-service": {
    id: "identity-service",
    type: "service",
    title: "identity-service (Next-Gen mTLS Auth)",
    author: "Security & Core Infra (Lead: Sarah Chen)",
    date: "2026",
    url: "https://github.com/company/identity-service",
    badge: "Service • Tier 1 (Production)",
    snippet:
      "Modern gRPC authentication service compliant with SOC2 Type II. Enforces mutual TLS (mTLS) with zero-trust session cookies. Successor to auth-v1.",
    falkorNode: "(:Service {name: 'identity-service', tier: 'Tier 1'})",
    graphHops: ["identity-service", "DEC-44", "DEC-88", "RFC-102"],
  },
  "payments-api": {
    id: "payments-api",
    type: "service",
    title: "payments-api Microservice",
    author: "Checkout & Payments Team (Lead: Priya Patel)",
    date: "2025–2026",
    url: "https://github.com/company/payments-api",
    badge: "Service • Tier 1 (PCI-DSS)",
    snippet:
      "Primary payment processing microservice interfacing with Stripe and Postgres primary database. Subject Matter Experts: Priya Patel (Team Lead) and Alex Mercer (Staff Engineer).",
    falkorNode: "(:Service {name: 'payments-api', tier: 'Tier 1'})",
    graphHops: ["payments-api", "Priya Patel", "Alex Mercer", "DEC-105"],
  },
};
