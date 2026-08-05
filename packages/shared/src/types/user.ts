export type EntitlementTier =
  | "guest"
  | "free"
  | "weekly_subscriber"
  | "monthly_subscriber"
  | "lifetime_family_owner"
  | "lifetime_family_member";

export type EntitlementStatus = "active" | "grace_period" | "expired";

export type Entitlement = {
  tier: EntitlementTier;
  status: EntitlementStatus;
  access_until: string | null;
  family_group_id: number | null;
  is_premium: boolean;
};

export type User = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  entitlement: Entitlement;
};
