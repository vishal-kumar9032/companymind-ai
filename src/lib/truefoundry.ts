import OpenAI from "openai";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  tag: string;
  speed: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "groq/qwen-qwen3.8-27b",
    name: "Groq Qwen 27B",
    provider: "Groq / TrueFoundry",
    tag: "Ultra-Fast • Recommended",
    speed: "~300ms",
    description: "High-throughput, ultra-low latency reasoning on Groq LPUs via TrueFoundry Gateway.",
  },
  {
    id: "google-gemini/gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "Google / TrueFoundry",
    tag: "Multimodal Reasoner",
    speed: "~800ms",
    description: "Google's next-gen lightweight multimodal model via TrueFoundry Gateway.",
  },
  {
    id: "groq/openai-gpt-oss-120b",
    name: "Groq GPT-OSS 120B",
    provider: "Groq / TrueFoundry",
    tag: "Deep Reasoning",
    speed: "~900ms",
    description: "Large 120B open-weights model on Groq hardware with step-by-step thinking.",
  },
  {
    id: "falkordb-autonomous",
    name: "Autonomous FalkorDB Engine",
    provider: "FalkorDB Native",
    tag: "Sub-5ms Circuit Breaker",
    speed: "~2ms",
    description: "Deterministic OpenCypher graph traversals directly executed on FalkorDB.",
  },
];

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
  {
    type: "function" as const,
    function: {
      name: "recall_agent_findings",
      description: "Recalls prior multi-agent findings, security audit flags, and operational memory from FalkorDB.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of recent findings to recall",
            default: 5,
          },
        },
      },
    },
  },
];
