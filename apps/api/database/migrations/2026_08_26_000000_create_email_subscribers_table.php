<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Marketing email captures from the public site's "Get a free DMV question every morning"
     * signup. `email` is unique — the public endpoint upserts so re-subscribing reactivates the
     * same row rather than 422-ing. `state` is the site's selected state name (e.g. "Alabama"),
     * nullable because a visitor may not have picked one yet. `unsubscribed_at` null means an
     * active subscriber; a timestamp records an opt-out without deleting the row.
     */
    public function up(): void
    {
        Schema::create('email_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('state')->nullable();
            $table->string('source')->default('home_hero');
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_subscribers');
    }
};
