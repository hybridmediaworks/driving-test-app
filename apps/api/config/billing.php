<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Past-due grace period
    |--------------------------------------------------------------------------
    |
    | How many days a subscriber keeps premium access after a failed payment before access is
    | actually cut. Cleared automatically once payment succeeds; Stripe's own retry/dunning logic
    | eventually cancels the subscription if it never recovers, at which point EntitlementResolver
    | reads the resulting `stripe_status` directly — no extra code needed past this window.
    |
    */
    'past_due_grace_days' => (int) env('BILLING_PAST_DUE_GRACE_DAYS', 3),

    /*
    |--------------------------------------------------------------------------
    | Pass Guarantee claim window
    |--------------------------------------------------------------------------
    |
    | Days after completing practice within which a Pass Guarantee claim can be submitted.
    |
    */
    'pass_guarantee_window_days' => (int) env('BILLING_PASS_GUARANTEE_WINDOW_DAYS', 30),

];
