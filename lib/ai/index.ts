import { llmProvider } from "./llmProvider"
import { mockProvider } from "./mockProvider"
import type { AIProvider } from "./provider"

// Default provider uses @ljoukov/llm (supports OpenAI, Gemini, ChatGPT subscription models).
export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "llm").toLowerCase()
  if (provider === "mock") return mockProvider
  return llmProvider
}
