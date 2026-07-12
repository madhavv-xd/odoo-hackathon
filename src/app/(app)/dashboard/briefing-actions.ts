"use server";

import OpenAI from "openai";
import { requireRole } from "@/lib/auth";
import { getFleetSnapshot } from "@/lib/fleet-snapshot";

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
  });
}

export type BriefingItem = {
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
};

/**
 * One Groq call over the live fleet snapshot → a short, prioritized "what needs
 * attention today" briefing. Grounded in real data, so every item cites a real
 * vehicle/driver/number.
 */
export async function generateBriefing(): Promise<{
  items: BriefingItem[] | null;
  error: string | null;
}> {
  await requireRole([
    "fleet_manager",
    "financial_analyst",
    "safety_officer",
    "dispatcher",
  ]);

  if (!process.env.GROQ_API_KEY) {
    return {
      items: null,
      error: "AI is not configured — set GROQ_API_KEY to enable the briefing.",
    };
  }

  try {
    const snapshot = await getFleetSnapshot();
    const client = getClient();

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a fleet operations chief of staff. From the live snapshot, write a prioritized morning briefing of the 3-4 MOST important things the manager should act on right now.
Rules:
- Only use facts from the snapshot. Cite specific reg numbers, driver names, and numbers.
- Rank by urgency. Assign each item a severity: "critical" (expired license, safety risk, vehicle stuck), "warning" (expiring soon, high cost, low efficiency), or "info" (noteworthy but not urgent).
- Keep each title under 8 words and each detail to one concise sentence.
Respond with ONLY JSON: {"items": [{"severity": "critical|warning|info", "title": "...", "detail": "..."}]}.`,
        },
        {
          role: "user",
          content: JSON.stringify(snapshot),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return { items: null, error: "No briefing returned" };

    const parsed = JSON.parse(raw) as { items?: BriefingItem[] };
    const items = (parsed.items ?? []).filter(
      (i) => i && i.title && i.detail,
    );
    return { items, error: null };
  } catch (err) {
    console.error("Briefing generation error:", err);
    return { items: null, error: "Could not generate briefing. Please try again." };
  }
}
