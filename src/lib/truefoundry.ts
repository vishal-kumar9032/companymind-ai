import OpenAI from "openai";

export function getTrueFoundryClient(): OpenAI | null {
  const apiKey = process.env.TRUEFOUNDRY_API_KEY || process.env.TFY_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseURL =
    process.env.TRUEFOUNDRY_BASE_URL ||
    process.env.TFY_BASE_URL ||
    "https://vishal9032.truefoundry.cloud/api/llm/v1";

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

export function isTrueFoundryGatewayConfigured(): boolean {
  return Boolean(process.env.TRUEFOUNDRY_API_KEY || process.env.TFY_API_KEY);
}

/**
 * Definition of our FalkorDB tools for TrueFoundry LLM Gateway tool calling
 */
export const TRUEFOUNDRY_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "service_blast_radius",
      description: "Calculates variable-depth downstream impact and owning teams if a service is sunset or fails.",
      parameters: {
        type: "object",
        properties: {
          serviceName: {
            type: "string",
            description: "The name of the service (e.g., auth-v1, payments-api, api-gateway)",
          },
          depth: {
            type: "integer",
            description: "Max traversal depth (default 4)",
            default: 4,
          },
        },
        required: ["serviceName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "trace_decision_provenance",
      description: "Traces why a service is constrained, what RFC proposed it, which meeting approved it, and who signed off.",
      parameters: {
        type: "object",
        properties: {
          serviceName: {
            type: "string",
            description: "The name of the service to trace governance decisions for",
          },
        },
        required: ["serviceName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "audit_pr_governance",
      description: "Audits a GitHub pull request to see if modified services violate active or superseded architectural decisions.",
      parameters: {
        type: "object",
        properties: {
          prNumber: {
            type: "integer",
            description: "The GitHub pull request number (e.g., 214, 218)",
          },
        },
        required: ["prNumber"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_subject_matter_experts",
      description: "Ranks engineers by RFC authorship, team lead status, and PR contributions touching a service.",
      parameters: {
        type: "object",
        properties: {
          serviceName: {
            type: "string",
            description: "The name of the service or system",
          },
        },
        required: ["serviceName"],
      },
    },
  },
];
