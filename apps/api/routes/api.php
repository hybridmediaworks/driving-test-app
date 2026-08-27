<?php

use App\Http\Controllers\Api\V1\Admin\AmbientTrackController as AdminAmbientTrackController;
use App\Http\Controllers\Api\V1\Admin\AttemptController as AdminAttemptController;
use App\Http\Controllers\Api\V1\Admin\CheatSheetController as AdminCheatSheetController;
use App\Http\Controllers\Api\V1\Admin\EmailSubscriberController as AdminEmailSubscriberController;
use App\Http\Controllers\Api\V1\Admin\FlashcardController as AdminFlashcardController;
use App\Http\Controllers\Api\V1\Admin\HandbookController as AdminHandbookController;
use App\Http\Controllers\Api\V1\Admin\ImageApprovalController;
use App\Http\Controllers\Api\V1\Admin\PassGuaranteeClaimController as AdminPassGuaranteeClaimController;
use App\Http\Controllers\Api\V1\Admin\PlanController as AdminPlanController;
use App\Http\Controllers\Api\V1\Admin\QuizCategoryController;
use App\Http\Controllers\Api\V1\Admin\QuizController as AdminQuizController;
use App\Http\Controllers\Api\V1\Admin\QuizQuestionController;
use App\Http\Controllers\Api\V1\Admin\QuizTypeController as AdminQuizTypeController;
use App\Http\Controllers\Api\V1\Admin\StateController as AdminStateController;
use App\Http\Controllers\Api\V1\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Admin\VehicleTypeController as AdminVehicleTypeController;
use App\Http\Controllers\Api\V1\Admin\VideoController as AdminVideoController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\ProfileController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\FamilyController;
use App\Http\Controllers\Api\V1\FlashcardReviewController;
use App\Http\Controllers\Api\V1\PassGuaranteeClaimController;
use App\Http\Controllers\Api\V1\Public\AmbientTrackController;
use App\Http\Controllers\Api\V1\Public\CheatSheetController as PublicCheatSheetController;
use App\Http\Controllers\Api\V1\Public\EmailSubscriberController;
use App\Http\Controllers\Api\V1\Public\FlashcardController as PublicFlashcardController;
use App\Http\Controllers\Api\V1\Public\HandbookController as PublicHandbookController;
use App\Http\Controllers\Api\V1\Public\PlanController;
use App\Http\Controllers\Api\V1\Public\QuizCategoryController as PublicQuizCategoryController;
use App\Http\Controllers\Api\V1\Public\QuizController as PublicQuizController;
use App\Http\Controllers\Api\V1\Public\QuizQuestionAssetController;
use App\Http\Controllers\Api\V1\Public\StateController;
use App\Http\Controllers\Api\V1\Public\VehicleTypeController;
use App\Http\Controllers\Api\V1\Public\VideoController as PublicVideoController;
use App\Http\Controllers\Api\V1\QuizAttemptController;
use App\Http\Controllers\Api\V1\StatsController;
use App\Http\Controllers\Api\V1\StripeWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed')
        ->name('verification.verify');

    // Public quiz-taking — guests may browse, take, and submit tests.
    Route::get('quizzes', [PublicQuizController::class, 'index']);
    Route::get('quizzes/{quiz}', [PublicQuizController::class, 'show']);
    Route::post('quizzes/{quiz}/attempts', [PublicQuizController::class, 'storeAttempt'])
        ->middleware('throttle:20,1');
    // Instant per-question feedback (practice mode) — reveals correctness + explanation for the
    // one answer just submitted.
    Route::post('quizzes/{quiz}/questions/{question}/check', [PublicQuizController::class, 'checkAnswer'])
        ->middleware('throttle:60,1');
    // AI tutor hint / follow-up question — tighter limit since each call hits an LLM.
    Route::post('quizzes/{quiz}/questions/{question}/assist', [PublicQuizController::class, 'assist'])
        ->middleware('throttle:10,1');
    // Report a mistake/typo in a question.
    Route::post('quizzes/{quiz}/questions/{question}/report', [PublicQuizController::class, 'report'])
        ->middleware('throttle:10,1');
    // Results-screen weak areas + dynamic coach message (LLM-backed).
    Route::post('quizzes/{quiz}/results-insight', [PublicQuizController::class, 'resultsInsight'])
        ->middleware('throttle:20,1');

    // Self-hosted question asset (Lottie JSON) — served through the API rather than raw /storage so
    // the player's cross-origin fetch gets CORS headers. See QuizQuestionAssetController::content.
    Route::get('quiz-question-assets/{asset}/content', [QuizQuestionAssetController::class, 'content']);

    // Public flashcard browsing/study — front text is always visible; back_text/image_url are
    // withheld per-card by FlashcardResource for premium cards the caller isn't entitled to.
    Route::get('flashcards', [PublicFlashcardController::class, 'index']);
    Route::get('flashcards/study', [PublicFlashcardController::class, 'study']);

    // Public cheat-sheet browsing — title/summary/cover always visible; sections/PDF are gated
    // by CheatSheetPolicy::readFull, same locked-teaser shape as flashcards.
    Route::get('cheat-sheets', [PublicCheatSheetController::class, 'index']);
    Route::get('cheat-sheets/{cheatSheet}', [PublicCheatSheetController::class, 'show']);
    Route::get('cheat-sheets/{cheatSheet}/download', [PublicCheatSheetController::class, 'download']);

    // Public video browsing — same locked-teaser shape as cheat sheets, gated by VideoPolicy.
    Route::get('videos', [PublicVideoController::class, 'index']);
    Route::get('videos/{video}', [PublicVideoController::class, 'show']);

    // Public handbook browsing — not premium-gated (see HandbookResource), full chapters/sections
    // always included.
    Route::get('handbooks', [PublicHandbookController::class, 'index']);
    Route::get('handbooks/{handbook}', [PublicHandbookController::class, 'show']);

    // Public read-only reference data — the valid values for the filters above.
    Route::get('states', [StateController::class, 'index']);
    Route::get('states/{code}/stats', [StateController::class, 'stats']);
    Route::get('vehicle-types', [VehicleTypeController::class, 'index']);

    // Fixed set of background-music loops for the quiz Settings panel, S3-hosted.
    Route::get('ambient-tracks', [AmbientTrackController::class, 'index']);
    Route::get('quiz-categories', [PublicQuizCategoryController::class, 'index']);

    Route::get('plans', [PlanController::class, 'index']);

    // Public marketing signup — captures an email for the daily-question newsletter from the home
    // page hero. Throttled since it's unauthenticated and writes.
    Route::post('newsletter/subscribe', [EmailSubscriberController::class, 'store'])
        ->middleware('throttle:10,1');

    // No auth:sanctum — Cashier's own VerifyWebhookSignature middleware (applied in the base
    // controller's constructor) is the real guard here, driven by STRIPE_WEBHOOK_SECRET.
    Route::post('stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);

    Route::middleware('auth:sanctum')->group(function (): void {
        // Account basics stay reachable regardless of verification status — an unverified user
        // must still be able to see who they are, sign out, and ask for another verification email.
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/confirm-password', [AuthController::class, 'confirmPassword']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend']);

        Route::middleware('verified')->group(function (): void {
            Route::patch('/profile', [ProfileController::class, 'update']);
            Route::delete('/profile', [ProfileController::class, 'destroy']);
            Route::put('/password', [ProfileController::class, 'updatePassword']);

            Route::get('/attempts', [QuizAttemptController::class, 'index']);
            Route::get('/me/stats', [StatsController::class, 'index']);

            Route::post('flashcards/{flashcard}/review', [FlashcardReviewController::class, 'store'])
                ->middleware('throttle:60,1');

            Route::post('billing/checkout', [BillingController::class, 'checkout'])->middleware('throttle:10,1');
            Route::get('billing/subscription', [BillingController::class, 'subscription']);
            Route::post('billing/subscription/cancel', [BillingController::class, 'cancelSubscription']);
            Route::get('billing/invoices', [BillingController::class, 'invoices']);
            Route::get('billing/portal', [BillingController::class, 'portal']);

            Route::get('billing/family', [FamilyController::class, 'show']);
            Route::post('billing/family/invite', [FamilyController::class, 'invite']);
            Route::post('billing/family/claim', [FamilyController::class, 'claim']);
            Route::delete('billing/family/members/{member}', [FamilyController::class, 'revoke']);

            Route::get('pass-guarantee/eligibility', [PassGuaranteeClaimController::class, 'eligibility']);
            Route::post('pass-guarantee/claims', [PassGuaranteeClaimController::class, 'store']);
            Route::get('pass-guarantee/claims', [PassGuaranteeClaimController::class, 'index']);
        });

        Route::prefix('admin')->middleware(['verified', 'admin'])->group(function (): void {
            Route::apiResource('quiz-categories', QuizCategoryController::class)->except(['show'])->parameters([
                'quiz-categories' => 'quizCategory',
            ]);
            Route::get('quiz-categories/{quizCategory}', [QuizCategoryController::class, 'show']);

            Route::apiResource('quizzes', AdminQuizController::class)->except(['show']);
            Route::get('quizzes/{quiz}', [AdminQuizController::class, 'show']);

            Route::get('quizzes/{quiz}/questions', [QuizQuestionController::class, 'index']);
            Route::post('quizzes/{quiz}/questions', [QuizQuestionController::class, 'store']);
            Route::get('quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'show']);
            Route::match(['put', 'post'], 'quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'update']);
            Route::delete('quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'destroy']);
            Route::post('quizzes/{quiz}/questions/reorder', [QuizQuestionController::class, 'reorder']);
            Route::post('quizzes/{quiz}/questions/{question}/move', [QuizQuestionController::class, 'move']);

            Route::apiResource('flashcards', AdminFlashcardController::class)->except(['show']);
            Route::get('flashcards/{flashcard}', [AdminFlashcardController::class, 'show']);

            Route::apiResource('cheat-sheets', AdminCheatSheetController::class)->except(['show'])->parameters([
                'cheat-sheets' => 'cheatSheet',
            ]);
            Route::get('cheat-sheets/{cheatSheet}', [AdminCheatSheetController::class, 'show']);

            Route::apiResource('videos', AdminVideoController::class)->except(['show']);
            Route::get('videos/{video}', [AdminVideoController::class, 'show']);

            Route::apiResource('ambient-tracks', AdminAmbientTrackController::class)->except(['show']);
            Route::get('ambient-tracks/{ambientTrack}', [AdminAmbientTrackController::class, 'show']);

            Route::apiResource('handbooks', AdminHandbookController::class)->except(['show']);
            Route::get('handbooks/{handbook}', [AdminHandbookController::class, 'show']);

            Route::apiResource('users', UserController::class);

            Route::apiResource('states', AdminStateController::class)->except(['show']);
            Route::get('states/{state}', [AdminStateController::class, 'show']);

            Route::apiResource('vehicle-types', AdminVehicleTypeController::class)->except(['show'])->parameters([
                'vehicle-types' => 'vehicleType',
            ]);
            Route::get('vehicle-types/{vehicleType}', [AdminVehicleTypeController::class, 'show']);

            Route::apiResource('quiz-types', AdminQuizTypeController::class)->except(['show'])->parameters([
                'quiz-types' => 'quizType',
            ]);
            Route::get('quiz-types/{quizType}', [AdminQuizTypeController::class, 'show']);

            Route::apiResource('plans', AdminPlanController::class)->except(['show']);
            Route::get('plans/{plan}', [AdminPlanController::class, 'show']);

            Route::get('attempts', [AdminAttemptController::class, 'index']);

            Route::get('email-subscribers', [AdminEmailSubscriberController::class, 'index']);
            Route::delete('email-subscribers/{emailSubscriber}', [AdminEmailSubscriberController::class, 'destroy']);

            Route::get('pass-guarantee-claims', [AdminPassGuaranteeClaimController::class, 'index']);
            Route::post('pass-guarantee-claims/{passGuaranteeClaim}/approve', [AdminPassGuaranteeClaimController::class, 'approve']);
            Route::post('pass-guarantee-claims/{passGuaranteeClaim}/deny', [AdminPassGuaranteeClaimController::class, 'deny']);
            Route::post('pass-guarantee-claims/{passGuaranteeClaim}/refund', [AdminPassGuaranteeClaimController::class, 'refund']);

            // AI image regeneration review — approve swaps the original (backing it up) across every
            // question sharing the image; reject queues it for another generation pass.
            Route::get('image-approvals', [ImageApprovalController::class, 'index']);
            Route::get('image-approvals/{regeneration}/candidate', [ImageApprovalController::class, 'candidate']);
            Route::get('image-approvals/{regeneration}/backup', [ImageApprovalController::class, 'backup']);
            Route::post('image-approvals/{regeneration}/generate', [ImageApprovalController::class, 'generate']);
            Route::post('image-approvals/{regeneration}/upload', [ImageApprovalController::class, 'upload']);
            Route::post('image-approvals/{regeneration}/approve', [ImageApprovalController::class, 'approveDecision']);
            Route::post('image-approvals/{regeneration}/reject', [ImageApprovalController::class, 'rejectDecision']);
            Route::post('image-approvals/{regeneration}/discard', [ImageApprovalController::class, 'discard']);

            Route::get('stats', [AdminStatsController::class, 'index']);
        });
    });
});
