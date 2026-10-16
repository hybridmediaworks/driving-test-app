<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const CAR_PLAN_KEYS = ['weekly', 'monthly', 'lifetime_family'];

    private const NEW_PLANS = [
        ['key' => 'cdl_weekly', 'vehicle' => 'cdl', 'name' => 'Weekly', 'billing_interval' => 'week', 'price_cents' => 4900, 'trial_days' => 7, 'sort_order' => 0],
        ['key' => 'cdl_monthly', 'vehicle' => 'cdl', 'name' => 'Monthly', 'billing_interval' => 'month', 'price_cents' => 8900, 'trial_days' => null, 'sort_order' => 1],
        ['key' => 'motorcycle_weekly', 'vehicle' => 'motorcycle', 'name' => 'Weekly', 'billing_interval' => 'week', 'price_cents' => 2900, 'trial_days' => 7, 'sort_order' => 0],
        ['key' => 'motorcycle_monthly', 'vehicle' => 'motorcycle', 'name' => 'Monthly', 'billing_interval' => 'month', 'price_cents' => 7500, 'trial_days' => null, 'sort_order' => 1],
    ];

    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->foreignId('vehicle_type_id')->nullable()->after('key')->constrained('vehicle_types')->restrictOnDelete();
        });

        $vehicleIds = DB::table('vehicle_types')->pluck('id', 'name');

        if (isset($vehicleIds['car'])) {
            DB::table('plans')
                ->whereIn('key', self::CAR_PLAN_KEYS)
                ->whereNull('vehicle_type_id')
                ->update(['vehicle_type_id' => $vehicleIds['car']]);
        }

        foreach (self::NEW_PLANS as $plan) {
            if (! isset($vehicleIds[$plan['vehicle']]) || DB::table('plans')->where('key', $plan['key'])->exists()) {
                continue;
            }

            DB::table('plans')->insert([
                'key' => $plan['key'],
                'vehicle_type_id' => $vehicleIds[$plan['vehicle']],
                'name' => $plan['name'],
                'type' => 'recurring',
                'billing_interval' => $plan['billing_interval'],
                'price_cents' => $plan['price_cents'],
                'trial_days' => $plan['trial_days'],
                'max_seats' => 1,
                'is_active' => true,
                'sort_order' => $plan['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('plans')
            ->whereIn('key', array_column(self::NEW_PLANS, 'key'))
            ->whereNull('stripe_price_id')
            ->delete();

        Schema::table('plans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vehicle_type_id');
        });
    }
};
