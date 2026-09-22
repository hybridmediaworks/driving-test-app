<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The review queue was built when every quiz image was a Spatie media row. CDL images are
     * `quiz_question_assets` rows instead (one row per question, all pointing at a single shared
     * file), so a regeneration now points at EITHER a representative media row or a representative
     * asset row. `vehicle_type_id` is denormalised so the queue can be filtered per vehicle without
     * joining back through media custom_properties.
     */
    public function up(): void
    {
        Schema::table('quiz_image_regenerations', function (Blueprint $table) {
            $table->foreignId('representative_asset_id')->nullable()->after('representative_media_id')
                ->constrained('quiz_question_assets')->nullOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->after('representative_asset_id')
                ->constrained('vehicle_types')->nullOnDelete();
            $table->index('vehicle_type_id', 'qir_vehicle_type_idx');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_image_regenerations', function (Blueprint $table) {
            $table->dropIndex('qir_vehicle_type_idx');
            $table->dropConstrainedForeignId('vehicle_type_id');
            $table->dropConstrainedForeignId('representative_asset_id');
        });
    }
};
