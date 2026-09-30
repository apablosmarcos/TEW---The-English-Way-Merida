import { AcademySchemaError } from "./modules/storage/academy-migrations.ts";

export function startupDiagnostic(error: unknown) {
  if (error instanceof AcademySchemaError) {
    return {
      event: "api_startup_failed" as const,
      errorCode: error.code,
      operatorMessage: "Academy schema is incompatible. Stop writers, create and verify a copy, inspect that copy, and obtain explicit authorization before recovery.",
    };
  }
  const candidate = (error as { code?: unknown } | null)?.code;
  const errorCode = typeof candidate === "string" && /^[A-Z0-9_]{1,40}$/.test(candidate) ? candidate : "UNKNOWN";
  return { event: "api_startup_failed" as const, errorCode };
}
