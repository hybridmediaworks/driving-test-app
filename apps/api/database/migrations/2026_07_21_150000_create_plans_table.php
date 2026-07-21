<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            // A stable internal key (free|weekly|monthly|lifetime_family) — decouples app code and
            // Stripe Price IDs from the display name/price, so pricing can change from the admin
            // panel (once that exists) without a code deploy, and the app never hardcodes a price
            // that could silently drift from what Stripe actually charges.
            $table->string('key')->unique();
            $table->string('name');
            $table->string('type');
            $table->string('billing_interval')->nullable();
            $table->unsignedInteger('price_cents');
            $table->string('stripe_price_id')->nullable();
            $table->string('stripe_product_id')->nullable();
            $table->unsignedTinyInteger('max_seats')->default(1);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
