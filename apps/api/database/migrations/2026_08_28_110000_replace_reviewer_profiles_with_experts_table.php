<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The "accuracy verified by" trust badge grew from a single hardcoded reviewer into a roster of
 * experts, each with a public /experts/{slug} profile page (bio, credentials, methodology, …).
 * `reviewer_profiles` only ever held an auto-generated placeholder row, so this drops it outright
 * rather than migrating data across — the richer content is re-entered in the new Experts admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Orphaned polymorphic photo rows from the old singleton — the files live on an ephemeral
        // disk and the model is gone, so there's nothing worth keeping.
        DB::table('media')->where('model_type', 'App\\Models\\ReviewerProfile')->delete();

        Schema::dropIfExists('reviewer_profiles');

        Schema::create('experts', function (Blueprint $table): void {
            $table->id();
            // Public profile URL: /experts/{slug}. Generated from the name, kept unique.
            $table->string('slug')->unique();
            $table->string('name');
            // Job title line, e.g. "Chief Educational Researcher".
            $table->string('title');
            // Short credentials line shown next to the name on state/quiz trust badges,
            // e.g. "M.S., Chief Educational Researcher (ACES member)". Falls back to `title`.
            $table->string('credentials')->nullable();
            // The trust-block heading on state pages, e.g. "Reviewed for legal and handbook accuracy".
            $table->string('role_label')->nullable();
            // Opening bio paragraph(s) on the profile page. Plain text, blank line between paragraphs.
            $table->text('intro')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('email')->nullable();
            // Ordered list of {heading, body} blocks — Education, Methodology, Publications, etc.
            // Free-form so a new section never needs a migration.
            $table->json('sections')->nullable();
            // Admin-set, bumped only on an actual accuracy pass — not derived from updated_at.
            $table->date('verified_at');
            // Lower sorts first, on both the admin list and the state-page trust block.
            $table->unsignedInteger('sort_order')->default(0)->index();
            // Unpublished experts are hidden from the public API and their profile page 404s.
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('experts');

        Schema::create('reviewer_profiles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('title');
            $table->date('verified_at');
            $table->timestamps();
        });
    }
};
