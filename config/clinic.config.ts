import { clinicConfigSchema, ClinicConfig } from "./schema";
import { demoClinicConfig } from "./clinic.demo";

// Dynamic configuration loader:
// To onboard a new clinic, create config/clinic.<client_slug>.ts and set CLINIC_CONFIG=<client_slug> in .env
function loadClinicConfig(): ClinicConfig {
  const configKey = process.env.CLINIC_CONFIG || "demo";

  let rawConfig: unknown;

  switch (configKey) {
    case "demo":
    case "apollo-jubilee-hills":
    default:
      rawConfig = demoClinicConfig;
      break;
  }

  const parsed = clinicConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    console.error("❌ Invalid Clinic Configuration:", parsed.error.format());
    throw new Error(`Failed to load clinic configuration for key '${configKey}': ${JSON.stringify(parsed.error.flatten())}`);
  }

  return parsed.data;
}

export const clinicConfig = loadClinicConfig();
