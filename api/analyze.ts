// Thin backend:
// - Local dev: Vite's dev proxy + a simple Express server
// - Production: Vercel serverless functions

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { systemPrompt, userMessage, model } = await req.json();

  if (!systemPrompt || !userMessage) {
    return new Response("Missing required fields", { status: 400 });
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

  return new Response(JSON.stringify({ text, tokens }), {
    headers: { "Content-Type": "application/json" },
  });
}
