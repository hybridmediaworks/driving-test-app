<?php

use App\Models\EmailSubscriber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * `unsubscribe_token` powers a one-click unsubscribe link (none existed before this). `vehicle_type`
     * (lowercase slug matching `vehicle_types.name`) lets the daily-question sender match car vs.
     * motorcycle vs. CDL content — the signup form renders on vehicle-specific pages but previously only
     * captured `state`. `last_sent_at` guards against sending more than once per day.
     */
    public function up(): void
    {
        Schema::table('email_subscribers', function (Blueprint $table) {
            $table->string('unsubscribe_token')->nullable()->unique()->after('source');
            $table->string('vehicle_type')->nullable()->after('unsubscribe_token');
            $table->timestamp('last_sent_at')->nullable()->after('vehicle_type');
        });

        // Backfill so every pre-existing subscriber has a working unsubscribe link immediately.
        EmailSubscriber::query()->whereNull('unsubscribe_token')->each(
            fn (EmailSubscriber $subscriber) => $subscriber->update(['unsubscribe_token' => Str::random(40)]),
        );
    }

    public function down(): void
    {
        Schema::table('email_subscribers', function (Blueprint $table) {
            $table->dropColumn(['unsubscribe_token', 'vehicle_type', 'last_sent_at']);
        });
    }
};
