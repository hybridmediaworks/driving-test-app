<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->foreignId('state_id')->nullable()->after('quiz_type_id')->constrained('states')->nullOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->after('state_id')->constrained('vehicle_types')->nullOnDelete();
            $table->string('test_track')->default('permit_test')->after('slug');

            $table->index(['state_id', 'vehicle_type_id', 'test_track']);
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropIndex(['state_id', 'vehicle_type_id', 'test_track']);
            $table->dropConstrainedForeignId('vehicle_type_id');
            $table->dropConstrainedForeignId('state_id');
            $table->dropColumn('test_track');
        });
    }
};
