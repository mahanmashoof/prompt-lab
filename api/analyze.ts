import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { systemPrompt, userMessage, model } = req.body;

  if (!systemPrompt || !userMessage) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const message = await client.messages.create({
    model: model ?? "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const tokens = message.usage.input_tokens + message.usage.output_tokens;

  return res.status(200).json({ text, tokens });
}
