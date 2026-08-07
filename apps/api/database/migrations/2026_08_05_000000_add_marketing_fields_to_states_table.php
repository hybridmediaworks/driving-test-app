<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('states', function (Blueprint $table) {
            // Null falls back to the generic "DMV" label in copy — not every state's agency is
            // actually called that (e.g. Arizona's is "MVD"); left for an admin/importer to fill
            // in per state rather than guessed here.
            $table->string('agency_name')->nullable()->after('name');
            $table->string('dmv_website_url')->nullable()->after('agency_name');
        });
    }

    public function down(): void
    {
        Schema::table('states', function (Blueprint $table) {
            $table->dropColumn(['agency_name', 'dmv_website_url']);
        });
    }
};
