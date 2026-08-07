<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Some real sections are two levels deep in the source (e.g. "Road Test Video Tips" ->
     * "Common Mistakes to Avoid", "Motorcycle Skills Videos" -> "Master Your Brakes") — additive,
     * nullable, same free-text convention as `section` above it. Null for every video imported so
     * far (their sections are flat); populated once a crawl that captures the subgroup label is
     * imported.
     */
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('subsection')->nullable()->after('section');
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn('subsection');
        });
    }
};
