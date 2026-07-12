import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getFleetSnapshot } from "@/lib/fleet-snapshot";
import { verifySessionToken } from "@/lib/auth";

const SYSTEM_PROMPT = `You are TransitOps Copilot — an AI assistant for a fleet operations console.

RULES:
1. Answer ONLY from the fleet snapshot provided below. Never make up vehicles, drivers, trips, or numbers.
2. Cite specific reg numbers, driver names, and figures from the data.
3. If the snapshot doesn't contain information to answer the question, say "I don't have that data in the current fleet snapshot."
4. Be concise and actionable. Use bullet points when listing multiple items.
5. Format currency in Indian Rupees (₹) and use metric units (km, kg, L).`;

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
  });
}

export async function POST(req: NextRequest) {
  // Auth check
  const cookie = req.cookies.get("transitops_session")?.value;
  const session = await verifySessionToken(cookie);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return new Response(
      "AI is not configured — set GROQ_API_KEY to enable the copilot.",
      { status: 503 },
    );
  }

  try {
    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages required", { status: 400 });
    }

    // Fetch fresh snapshot on every request — never stale
    const snapshot = await getFleetSnapshot();

    const client = getClient();

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\n## Live Fleet Snapshot (${snapshot.snapshotTime})\n\n${JSON.stringify(snapshot, null, 2)}`,
        },
        ...messages.slice(-10), // Cap at 10 turns
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.3,
    });

    // Stream the response back
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              "\n\n_Copilot encountered an error. Please try again._",
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Copilot error:", err);
    return new Response(
      "Copilot is temporarily unavailable. Please try again in a moment.",
      { status: 503 },
    );
  }
}
