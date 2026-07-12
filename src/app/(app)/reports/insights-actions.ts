"use server";

import OpenAI from "openai";
import { vehicleEconomics } from "@/lib/reports";
import { requireRole } from "@/lib/auth";

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
  });
}

/**
 * Generate AI insights from computed report stats.
 * Sends aggregated numbers (not raw DB rows) in one Groq completion.
 */
export async function generateInsights(): Promise<{
  insights: string | null;
  error: string | null;
}> {
  await requireRole([
    "fleet_manager",
    "financial_analyst",
    "safety_officer",
    "driver",
  ]);

  try {
    const economics = await vehicleEconomics();

    const totalDistance = economics.reduce((s, e) => s + e.distanceKm, 0);
    const totalFuel = economics.reduce((s, e) => s + e.fuelL, 0);
    const totalOpCost = economics.reduce((s, e) => s + e.operationalCost, 0);
    const totalRevenue = economics.reduce((s, e) => s + e.revenue, 0);
    const avgFuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : null;

    const statsPayload = {
      vehicleCount: economics.length,
      totalDistanceKm: totalDistance,
      totalFuelL: totalFuel,
      avgFuelEfficiencyKmPerL: avgFuelEfficiency
        ? +avgFuelEfficiency.toFixed(2)
        : null,
      totalOperationalCost: totalOpCost,
      totalRevenue,
      perVehicle: economics.map((e) => ({
        reg: e.regNumber,
        name: e.name,
        type: e.type,
        distanceKm: e.distanceKm,
        fuelL: e.fuelL,
        kmPerL: e.kmPerL != null ? +e.kmPerL.toFixed(2) : null,
        operationalCost: e.operationalCost,
        revenue: e.revenue,
        roiPct: e.roiPct != null ? +e.roiPct.toFixed(2) : null,
      })),
    };

    const client = getClient();

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a fleet analytics expert. Given the report stats below, produce exactly 3 to 5 bullet insights. Each bullet should:
- Reference specific vehicle reg numbers and real numbers from the data
- Highlight anomalies, inefficiencies, or standout performers
- Be actionable where possible
Format each bullet as a markdown list item starting with "- ". Do not add a heading. Be concise.`,
        },
        {
          role: "user",
          content: `Here are the fleet report statistics:\n\n${JSON.stringify(statsPayload, null, 2)}`,
        },
      ],
      max_tokens: 512,
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    return { insights: content ?? null, error: null };
  } catch (err) {
    console.error("Insights generation error:", err);
    return {
      insights: null,
      error: "Could not generate insights. Please try again.",
    };
  }
}
