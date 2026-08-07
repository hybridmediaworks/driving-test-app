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
  /** Free trial length in days before the first charge — null means no trial for this plan. */
  trial_days: number | null;
  max_seats: number;
  sort_order: number;
};

// Admin CRUD sees inactive plans and Stripe linkage too — stripe_price_id/stripe_product_id are
// read-only here (derived by `php artisan billing:sync-plans`), never sent in a create/update body.
export type AdminPlan = Plan & {
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MySubscription = Entitlement & {
  subscription: {
    stripe_status: string;
    canceled: boolean;
    ends_at: string | null;
    on_trial: boolean;
    trial_ends_at: string | null;
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
