export type ImageRegenerationStatus =
  | "pending"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "failed";

export interface ImageRegeneration {
  id: number;
  status: ImageRegenerationStatus;
  usage_count: number;
  prompt: string | null;
  attempts: number;
  error: string | null;
  original_url: string | null;
  has_candidate: boolean;
  has_backup: boolean;
  candidate_url: string | null;
  backup_url: string | null;
  decided_at: string | null;
}
