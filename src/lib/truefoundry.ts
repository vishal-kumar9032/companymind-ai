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
    provider: "Groq LPU Engine",
    tag: "Ultra-Fast • Recommended",
    speed: "~300ms",
    description: "High-throughput, ultra-low latency reasoning on Groq LPUs.",
  },
  {
    id: "google-gemini/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google Cloud",
    tag: "Low-Cost Fallback",
    speed: "~600ms",
    description: "Google's ultra low-latency flash model, ideal for rapid tool dispatch and high concurrency.",
  },
  {
    id: "google-gemini/gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "Google AI",
    tag: "Multimodal Reasoner",
    speed: "~800ms",
    description: "Google's next-generation lightweight reasoning and multimodal model.",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta AI",
    tag: "Open Weights Tier-1",
    speed: "~750ms",
    description: "Meta's flagship 70B open model for structured logic and complex reasoning.",
  },
  {
    id: "groq/openai-gpt-oss-120b",
    name: "Groq GPT-OSS 120B",
    provider: "OpenAI Open-Weights",
    tag: "Deep Reasoning",
    speed: "~900ms",
    description: "High-capacity 120B model on accelerated hardware with step-by-step thinking.",
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

export const DEFAULT_FALLBACK_MODELS = [
  "google-gemini/gemini-2.5-flash-lite",
  "google-gemini/gemini-3.1-flash-lite",
  "meta-llama/llama-3.3-70b-instruct",
  "groq/openai-gpt-oss-120b",
];

export function getGatewayFallbackModels(): string[] {
  const envFallbacks = process.env.TRUEFOUNDRY_FALLBACK_MODELS || process.env.TFY_FALLBACK_MODELS;
  if (envFallbacks) {
    return envFallbacks
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_FALLBACK_MODELS;
}

export function getTrueFoundryClient(): OpenAI | null {
  const apiKey = process.env.TRUEFOUNDRY_API_KEY || process.env.TFY_API_KEY;
  const baseURL = process.env.TRUEFOUNDRY_BASE_URL || process.env.TFY_BASE_URL;
  if (!apiKey || !baseURL) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

export function isTrueFoundryGatewayConfigured(): boolean {
  return Boolean(
    (process.env.TRUEFOUNDRY_API_KEY || process.env.TFY_API_KEY) &&
    (process.env.TRUEFOUNDRY_BASE_URL || process.env.TFY_BASE_URL)
  );
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
