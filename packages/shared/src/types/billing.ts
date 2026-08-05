import type { Entitlement } from "./user";

export type PlanType = "recurring" | "one_time";
export type BillingInterval = "week" | "month";

export type Plan = {
  id: number;
  key: string;
  name: string;
  type: PlanType;
  billing_interval: BillingInterval | null;
  price_cents: number;
  max_seats: number;
  sort_order: number;
};

export type MySubscription = Entitlement & {
  subscription: {
    stripe_status: string;
    canceled: boolean;
    ends_at: string | null;
  } | null;
};

export type Invoice = {
  id: string;
  date: string;
  total: string;
  status: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
};

export type CheckoutResponse = {
  checkout_url: string;
};

export type FamilyMemberRole = "owner" | "member";
export type FamilyInviteStatus = "pending" | "claimed" | "revoked";

export type FamilyMember = {
  id: number;
  role: FamilyMemberRole;
  invited_email: string | null;
  invite_status: FamilyInviteStatus;
  invited_at: string | null;
  claimed_at: string | null;
  user: { id: number; name: string; email: string } | null;
};

export type FamilyGroupStatus = "active" | "refunded";

export type FamilyGroup = {
  id: number;
  max_seats: number;
  status: FamilyGroupStatus;
  purchased_at: string | null;
  members: FamilyMember[];
};

export type PassGuaranteeClaimStatus = "submitted" | "under_review" | "approved" | "denied" | "refunded";

export type PassGuaranteeClaim = {
  id: number;
  status: PassGuaranteeClaimStatus;
  completed_practice_at: string | null;
  exam_date: string | null;
  proof_notes: string | null;
  proof_urls: string[];
  admin_notes: string | null;
  decided_at: string | null;
  refunded_at: string | null;
  refund_amount_cents: number | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
};
