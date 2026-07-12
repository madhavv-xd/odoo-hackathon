"use server";

import OpenAI from "openai";
import { requireRole } from "@/lib/auth";
import { availableVehicles, availableDrivers } from "@/lib/dispatch-pool";

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
  });
}

export type SmartDispatchResult = {
  vehicleId: string | null;
  driverId: string | null;
  reason: string | null;
  error: string | null;
};

type Params = {
  source: string;
  destination: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
};

/**
 * AI-assisted assignment: given the trip parameters, pick the best-fit vehicle +
 * driver from the *live* eligible pool. The model only ever chooses from real
 * candidates (vehicles that actually fit the cargo, drivers with valid licenses),
 * so a recommendation can never hallucinate an unavailable asset.
 */
export async function smartDispatch(params: Params): Promise<SmartDispatchResult> {
  await requireRole(["dispatcher", "fleet_manager"]);

  const empty: SmartDispatchResult = {
    vehicleId: null,
    driverId: null,
    reason: null,
    error: null,
  };

  if (!process.env.GROQ_API_KEY) {
    return {
      ...empty,
      error: "AI is not configured — set GROQ_API_KEY to enable suggestions.",
    };
  }

  if (params.cargoWeightKg <= 0 || params.plannedDistanceKm <= 0) {
    return { ...empty, error: "Enter cargo weight and distance first" };
  }

  const [vehicles, drivers] = await Promise.all([
    availableVehicles(),
    availableDrivers(),
  ]);

  // Only vehicles that can actually carry the cargo are candidates.
  const fitVehicles = vehicles.filter((v) => v.maxLoadKg >= params.cargoWeightKg);
  if (fitVehicles.length === 0) {
    return {
      ...empty,
      error: `No available vehicle can carry ${params.cargoWeightKg} kg`,
    };
  }
  if (drivers.length === 0) {
    return { ...empty, error: "No eligible drivers are available" };
  }

  const candidatePayload = {
    trip: {
      route: `${params.source || "?"} → ${params.destination || "?"}`,
      cargoKg: params.cargoWeightKg,
      distanceKm: params.plannedDistanceKm,
    },
    vehicles: fitVehicles.map((v) => ({
      reg: v.regNumber,
      name: v.name,
      type: v.type,
      maxLoadKg: v.maxLoadKg,
      odometerKm: v.odometerKm,
    })),
    drivers: drivers.map((d) => ({
      name: d.name,
      safetyScore: d.safetyScore,
      licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry.toISOString().slice(0, 10),
    })),
  };

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are a fleet dispatch optimizer. Pick the single best vehicle and driver for the trip from the provided candidates only.
Optimize for, in order: (1) right-sized capacity — enough headroom for the cargo but avoid grossly oversized vehicles, (2) higher driver safety score, (3) lower vehicle odometer for longer trips.
Respond with ONLY a JSON object: {"vehicleReg": "<reg from candidates>", "driverName": "<name from candidates>", "reason": "<one concise sentence citing the deciding factors, with numbers>"}.`,
        },
        {
          role: "user",
          content: JSON.stringify(candidatePayload),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return { ...empty, error: "No recommendation returned" };

    const parsed = JSON.parse(raw) as {
      vehicleReg?: string;
      driverName?: string;
      reason?: string;
    };

    const vehicle = fitVehicles.find(
      (v) => v.regNumber.toLowerCase() === parsed.vehicleReg?.toLowerCase(),
    );
    const driver = drivers.find(
      (d) => d.name.toLowerCase() === parsed.driverName?.toLowerCase(),
    );

    // Don't claim success if the model named assets that aren't in the pool.
    if (!vehicle && !driver) {
      return {
        ...empty,
        error: "Copilot couldn't match a recommendation — please pick manually.",
      };
    }

    return {
      vehicleId: vehicle?.id ?? null,
      driverId: driver?.id ?? null,
      reason: parsed.reason ?? null,
      error: null,
    };
  } catch (err) {
    console.error("Smart dispatch error:", err);
    return { ...empty, error: "Could not generate a recommendation. Try again." };
  }
}
