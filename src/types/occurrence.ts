import { AppRole } from "./database-schema";

// Legacy types mapping for backward compatibility where possible, or redirection.
// Since the user asked for a full refactor, we should try to point to the new types.
// However, the frontend currently imports 'OccurrenceType' etc.

// We will keep minimal definitions to allow compilation while we refactor components.

export type OccurrenceType = "administrativa" | "revisao_exame" | "enfermagem" | "paciente" | "livre"; // Legacy
export type OccurrenceSubtype = string;
export type OccurrenceStatus = string;
export type TriageClassification = string;
export type OutcomeType = string;

// Define Profile here as it's used broadly
export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  role: AppRole;
  avatar_url?: string;
}
