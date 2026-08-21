<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per UNIQUE quiz question image (keyed by the crawl `source_url`, ~637 of them) that we
     * want to replace with an AI-regenerated, watermark/copyright-free version. Each unique image is
     * hardlinked across dozens-to-hundreds of media paths, so approving one row swaps the image for
     * every question that shares it — `usage_count` records that blast radius for the reviewer.
     */
    public function up(): void
    {
        Schema::create('quiz_image_regenerations', function (Blueprint $table) {
            $table->id();
            $table->string('source_url')->unique();
            // A representative Spatie media row in the shared-inode group — used to resolve the live
            // file path + public URL. Not a real FK (Spatie's `media` table is managed separately).
            $table->unsignedBigInteger('representative_media_id')->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            $table->string('status')->default('pending');
            $table->text('prompt')->nullable();
            $table->string('candidate_disk')->nullable();
            $table->string('candidate_path')->nullable();
            $table->string('backup_path')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->text('error')->nullable();
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_image_regenerations');
    }
};
