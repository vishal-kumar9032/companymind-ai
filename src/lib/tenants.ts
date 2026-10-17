export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  badge: string;
  description: string;
  stats?: {
    servicesCount: number;
    engineersCount: number;
    decisionsCount: number;
    documentsCount: number;
  };
}

export const TENANTS: TenantConfig[] = [
  {
    id: "core-platform",
    name: "Enterprise Workspace",
    domain: "Core Infrastructure & Microservices",
    badge: "Primary Organization",
    description: "Enterprise causal knowledge graph, microservices topology, and policy governance.",
  },
];

export function getTenant(tenantId: string): TenantConfig {
  const found = TENANTS.find((t) => t.id === tenantId);
  return found || TENANTS[0];
}

/** Shown for signed-in users, whose graph holds only what they connect. */
export const PERSONAL_TENANT: TenantConfig = {
  id: "personal",
  name: "Personal Workspace",
  domain: "Your connected accounts",
  badge: "Private",
  description: "Your own isolated knowledge graph, built from the accounts you connect.",
};
