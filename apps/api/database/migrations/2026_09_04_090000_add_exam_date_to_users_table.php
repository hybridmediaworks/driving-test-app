<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The date the learner has booked (or is aiming for) their official DMV knowledge exam, set by
     * them from the state hub's progress sidebar. Purely a study-planning aid — nothing gates on
     * it, and it is deliberately a single date on the user rather than one per state/vehicle,
     * because a learner sits one written exam at a time. Null = not told us yet.
     *
     * Distinct from `pass_guarantee_claims.exam_date`, which records the date of an exam already
     * sat as evidence for a refund claim.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('exam_date')->nullable()->after('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('exam_date');
        });
    }
};
