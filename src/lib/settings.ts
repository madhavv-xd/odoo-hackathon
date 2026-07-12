import "server-only";
import { db } from "@/lib/db";

// Singleton settings row. Upsert-on-read so the app always has defaults.
export async function getSettings() {
  return db.appSettings.upsert({
    where: { id: "app" },
    update: {},
    create: { id: "app" },
  });
}
