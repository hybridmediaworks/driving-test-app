<?php

namespace App\Enums;

/**
 * The subscription/premium-access axis — deliberately independent of `User::$is_admin` (the
 * content-management axis). A user can be an admin, a subscriber, both, or neither; this enum
 * only ever describes what they've actually paid for, never their admin status. Admins still get
 * an access bypass, but that's layered on top by `Entitlement::isPremium()`/`hasFeature()`, not
 * baked into the tier itself — so an admin's real (typically `Free`) tier stays visible/correct
 * wherever it's displayed (e.g. a billing settings page), instead of being overwritten.
 */
enum EntitlementTier: string
{
    case Guest = 'guest';
    case Free = 'free';
    case WeeklySubscriber = 'weekly_subscriber';
    case MonthlySubscriber = 'monthly_subscriber';
    case LifetimeFamilyOwner = 'lifetime_family_owner';
    case LifetimeFamilyMember = 'lifetime_family_member';
}
