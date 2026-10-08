import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { sample, counts } = await req.json();
  const key = process.env.ANTHROPIC_API_KEY;

  // Demo fallback so the UI works before you add a key
  if (!key) {
    return NextResponse.json({
      analysis:
        "Demo mode (no ANTHROPIC_API_KEY set).\n\nLikely waste: resources created by repeated provisioning events with no matching deletion events. Recommendation: tag the owners, set a 7-day review, and schedule shutdown of idle resources.\n\nAdd your key to .env.local to get a real analysis.",
    });
  }

  const prompt = `You are a cloud FinOps analyst. Based on these cloud log events, identify likely cloud waste, explain the root cause in plain language, estimate impact, and recommend a safe fix. Be concise.

Event counts by cloud: ${JSON.stringify(counts)}
Sample events (JSON): ${JSON.stringify(sample).slice(0, 12000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Claude API error (${res.status}).` }, { status: 500 });
  }
  const data = await res.json();
  const text = (data.content ?? [])
    .map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : ""))
    .join("");
  return NextResponse.json({ analysis: text });
}