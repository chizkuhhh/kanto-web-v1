import Anthropic from "@anthropic-ai/sdk"
import { TOOLS, runTool, type ToolContext } from "./tools"
import { buildSystemPrompt } from "./prompt"

const client = new Anthropic()
const MODEL = process.env.AGENT_MODEL ?? "claude-sonnet-5-5"
const MAX_STEPS = 8

export type HistoryTurn = { role: "customer" | "agent" | "human"; text: string }

// The API expects alternating user and assistant turns, so merge consecutive
// turns of the same role and make sure the conversation starts with the customer.
function toMessages(history: HistoryTurn[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = []
  for (const turn of history) {
    const role = turn.role === "customer" ? "user" : "assistant"
    const text = turn.role === "human" ? `[Staff] ${turn.text}` : turn.text
    const last = out[out.length - 1]
    if (last && last.role === role) last.content = `${String(last.content)}\n${text}`
    else out.push({ role, content: text })
  }
  while (out.length && out[0].role !== "user") out.shift()
  return out
}

export async function runAgent(ctx: ToolContext, history: HistoryTurn[]): Promise<string> {
  const messages = toMessages(history)

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: buildSystemPrompt(new Date()),
      tools: TOOLS,
      messages,
    })

    console.log("agent usage:", res.usage.input_tokens, "in /", res.usage.output_tokens, "out")

    if (res.stop_reason !== "tool_use") {
      return res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim()
    }

    messages.push({ role: "assistant", content: res.content })

    const results: Anthropic.ToolResultBlockParam[] = []
    for (const block of res.content) {
      if (block.type !== "tool_use") continue
      try {
        const output = await runTool(block.name, block.input, ctx)
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(output),
        })
      } catch (err) {
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: err instanceof Error ? err.message : "Tool failed",
          is_error: true,
        })
      }
    }
    messages.push({ role: "user", content: results })
  }

  // The agent kept calling tools without finishing: pass the customer to a person
  await runTool("handoff_to_human", { reason: "Agent exceeded its tool step limit" }, ctx)
  return "Let me have a team member help you with this. They'll reply shortly."
}