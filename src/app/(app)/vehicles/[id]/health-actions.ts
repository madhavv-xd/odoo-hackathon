"use server";

import OpenAI from "openai";
import { db } from "@/lib/db";
import { vehicleEconomics } from "@/lib/reports";
import { requireRole } from "@/lib/auth";

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
  });
}

export type VehicleHealth = {
  status: "ok" | "watch" | "due";
  headline: string;
  points: string[];
};

/**
 * One Groq call over a single vehicle's real service/fuel/trip history →
 * a grounded health assessment with a predictive-maintenance flag.
 */
export async function analyzeVehicleHealth(
  vehicleId: string,
): Promise<{ health: VehicleHealth | null; error: string | null }> {
  await requireRole([
    "fleet_manager",
    "dispatcher",
    "safety_officer",
    "financial_analyst",
  ]);

  try {
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        maintenanceLogs: { orderBy: { openedAt: "desc" }, take: 8 },
        trips: {
          where: { status: "completed" },
          orderBy: { completedAt: "desc" },
          take: 8,
          select: {
            plannedDistanceKm: true,
            fuelConsumedL: true,
            completedAt: true,
          },
        },
        fuelLogs: {
          orderBy: { date: "desc" },
          take: 8,
          select: { liters: true, cost: true, date: true },
        },
      },
    });
    if (!vehicle) return { health: null, error: "Vehicle not found" };

    const econ = (await vehicleEconomics()).find(
      (e) => e.vehicleId === vehicleId,
    );

    const payload = {
      reg: vehicle.regNumber,
      type: vehicle.type,
      odometerKm: vehicle.odometerKm,
      status: vehicle.status,
      efficiencyKmPerL: econ?.kmPerL ?? null,
      operationalCost: econ?.operationalCost ?? null,
      roiPct: econ?.roiPct ?? null,
      maintenance: vehicle.maintenanceLogs.map((m) => ({
        description: m.description,
        cost: m.cost,
        status: m.status,
        openedAt: m.openedAt.toISOString().slice(0, 10),
        closedAt: m.closedAt?.toISOString().slice(0, 10) ?? null,
      })),
      recentTrips: vehicle.trips.map((t) => ({
        distanceKm: t.plannedDistanceKm,
        fuelL: t.fuelConsumedL,
        completedAt: t.completedAt?.toISOString().slice(0, 10) ?? null,
      })),
      recentFuel: vehicle.fuelLogs.map((f) => ({
        liters: f.liters,
        cost: f.cost,
        date: f.date.toISOString().slice(0, 10),
      })),
    };

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a fleet maintenance analyst. Assess this single vehicle's health from its data and give a predictive-maintenance read.
- Consider odometer, fuel-efficiency trend, maintenance frequency/cost, and cost/ROI.
- status: "due" = service or inspection recommended now; "watch" = minor concerns to monitor; "ok" = healthy.
- Only use the provided data. If data is too thin to judge, say so plainly and use "ok".
- Cite specific numbers.
Respond with ONLY JSON: {"status": "ok|watch|due", "headline": "<one short sentence>", "points": ["<concise finding with numbers>", ...]} with 2-4 points.`,
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return { health: null, error: "No assessment returned" };

    const parsed = JSON.parse(raw) as VehicleHealth;
    if (!parsed.status || !Array.isArray(parsed.points)) {
      return { health: null, error: "Unexpected assessment format" };
    }
    return { health: parsed, error: null };
  } catch (err) {
    console.error("Vehicle health error:", err);
    return { health: null, error: "Could not analyze this vehicle. Try again." };
  }
}
