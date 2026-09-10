<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The per-state permit-test facts behind the "at a glance" grid on `/{state}/{test-slug}`.
     * All nullable and all left empty here on purpose — these are published legal requirements
     * that differ by state (and change), so they're for an admin/importer to fill in per state
     * rather than be guessed in a migration. The grid simply omits a fact it has no value for.
     */
    public function up(): void
    {
        Schema::table('states', function (Blueprint $table) {
            // In cents, so no float rounding on a money value — the frontend formats it.
            $table->unsignedInteger('permit_test_fee_cents')->nullable()->after('dmv_website_url');
            // How long a failed candidate must wait before retaking the knowledge test.
            $table->unsignedSmallInteger('retake_wait_days')->nullable()->after('permit_test_fee_cents');
            // Supervised driving hours to be logged before the road test.
            $table->unsignedSmallInteger('supervised_driving_hours')->nullable()->after('retake_wait_days');
            $table->unsignedTinyInteger('minimum_permit_age')->nullable()->after('supervised_driving_hours');
            // How many languages the written test is offered in.
            $table->unsignedTinyInteger('test_language_count')->nullable()->after('minimum_permit_age');
            // Null = not published for this state, distinct from an explicit false.
            $table->boolean('online_testing_available')->nullable()->after('test_language_count');
        });
    }

    public function down(): void
    {
        Schema::table('states', function (Blueprint $table) {
            $table->dropColumn([
                'permit_test_fee_cents',
                'retake_wait_days',
                'supervised_driving_hours',
                'minimum_permit_age',
                'test_language_count',
                'online_testing_available',
            ]);
        });
    }
};
