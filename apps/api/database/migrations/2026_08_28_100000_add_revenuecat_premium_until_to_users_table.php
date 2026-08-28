<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Premium bought through the mobile stores (Apple / Google) is tracked by RevenueCat, not
     * Stripe/Cashier. `revenuecat_premium_until` is the access deadline synced from RevenueCat's
     * webhook (INITIAL_PURCHASE/RENEWAL set it to the entitlement's expiration; EXPIRATION clears
     * it). EntitlementResolver treats a future value as an active paid entitlement, alongside the
     * existing Cashier subscription and family-plan paths. Null = no store subscription.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('revenuecat_premium_until')->nullable()->after('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('revenuecat_premium_until');
        });
    }
};
