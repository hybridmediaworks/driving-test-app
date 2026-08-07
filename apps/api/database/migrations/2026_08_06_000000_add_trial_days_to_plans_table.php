<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Business config, not Stripe-derived (unlike stripe_price_id/stripe_product_id) —
            // applied via Cashier's trialDays() when checking out, so it's admin-editable without
            // a deploy. Null means no trial for that plan.
            $table->unsignedInteger('trial_days')->nullable()->after('price_cents');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('trial_days');
        });
    }
};
