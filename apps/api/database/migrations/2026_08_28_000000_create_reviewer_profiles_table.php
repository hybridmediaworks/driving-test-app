<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviewer_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Credentials/role line shown under the name, e.g. "DMV Test-Prep Editor".
            $table->string('title');
            // Admin-set, bumped only when they actually redo an accuracy pass — not derived from
            // updated_at, since a name/photo edit alone shouldn't imply a fresh content review.
            $table->date('verified_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviewer_profiles');
    }
};
