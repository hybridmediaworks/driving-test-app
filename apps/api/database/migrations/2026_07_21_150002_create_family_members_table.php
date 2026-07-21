<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_group_id')->constrained('family_groups')->cascadeOnDelete();
            // Nullable + unique: null until an invite is claimed (MySQL unique indexes permit
            // unlimited NULLs), and unique once claimed enforces "a user belongs to at most one
            // family group" for free, without an application-level check.
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->cascadeOnDelete();
            $table->string('role')->default('member');
            $table->string('invited_email')->nullable();
            $table->string('invite_token')->nullable()->unique();
            $table->string('invite_status')->default('pending');
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_members');
    }
};
