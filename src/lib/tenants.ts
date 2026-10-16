export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  badge: string;
  description: string;
  stats: {
    servicesCount: number;
    engineersCount: number;
    decisionsCount: number;
    documentsCount: number;
  };
  services: string[];
  teamLeads: string[];
  activeDecisions: string[];
  primarySourceTypes: string[];
}

export const TENANTS: TenantConfig[] = [
  {
    id: "acme-core",
    name: "Acme Corporation",
    domain: "Core Infrastructure & Cloud Platform",
    badge: "Enterprise Platform",
    description: "Global cloud infrastructure mesh, Tier-0 services, API gateway, and database clusters.",
    stats: {
      servicesCount: 8,
      engineersCount: 6,
      decisionsCount: 4,
      documentsCount: 6,
    },
    services: [
      "api-gateway",
      "postgres-primary",
      "identity-service",
      "auth-v1",
      "mobile-app",
      "web-checkout",
      "payments-api",
      "fraud-detector",
    ],
    teamLeads: ["Sarah Chen", "Elena Rostova", "Marcus Vance"],
    activeDecisions: ["DEC-44", "DEC-88", "DEC-105", "DEC-12"],
    primarySourceTypes: ["Google Docs RFCs", "Meeting Minutes", "GitHub PRs"],
  },
  {
    id: "finflow-global",
    name: "FinFlow Global",
    domain: "Fintech Payments & Fraud Prevention",
    badge: "Payments Mesh",
    description: "PCI-DSS compliant payment transaction processing, fraud scoring engines, and checkout flows.",
    stats: {
      servicesCount: 4,
      engineersCount: 3,
      decisionsCount: 2,
      documentsCount: 3,
    },
    services: [
      "payments-api",
      "fraud-detector",
      "web-checkout",
      "postgres-primary",
    ],
    teamLeads: ["Alex Mercer", "Priya Patel"],
    activeDecisions: ["DEC-88", "DEC-105"],
    primarySourceTypes: ["Security Specs", "PCI Audits", "Incident Postmortems"],
  },
  {
    id: "healthpulse-sys",
    name: "HealthPulse Systems",
    domain: "Healthcare Mesh & Compliance",
    badge: "HIPAA Compliant",
    description: "Zero-trust encrypted patient records, identity federation, and audit logging services.",
    stats: {
      servicesCount: 3,
      engineersCount: 2,
      decisionsCount: 2,
      documentsCount: 2,
    },
    services: [
      "identity-service",
      "postgres-primary",
      "api-gateway",
    ],
    teamLeads: ["Marcus Vance", "David Kim"],
    activeDecisions: ["DEC-88", "DEC-105"],
    primarySourceTypes: ["HIPAA Audit Logs", "mTLS Specs"],
  },
];

export function getTenant(tenantId: string): TenantConfig {
  const found = TENANTS.find((t) => t.id === tenantId);
  return found || TENANTS[0];
}
