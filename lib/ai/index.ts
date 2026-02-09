import type { AIProvider } from "./provider"
import { mockProvider } from "./mockProvider"
import { geminiProvider } from "./geminiProvider"

// To use OpenAI or another provider, set AI_PROVIDER=openai in env
// and implement an openaiProvider in ./openaiProvider.ts
export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase()
  if (provider === "mock") return mockProvider
  return geminiProvider
}
