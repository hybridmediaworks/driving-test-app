<?php

use App\Http\Controllers\Api\V1\Admin\AttemptController as AdminAttemptController;
use App\Http\Controllers\Api\V1\Admin\CheatSheetController as AdminCheatSheetController;
use App\Http\Controllers\Api\V1\Admin\FlashcardController as AdminFlashcardController;
use App\Http\Controllers\Api\V1\Admin\PassGuaranteeClaimController as AdminPassGuaranteeClaimController;
use App\Http\Controllers\Api\V1\Admin\QuizCategoryController;
use App\Http\Controllers\Api\V1\Admin\QuizController as AdminQuizController;
use App\Http\Controllers\Api\V1\Admin\QuizQuestionController;
use App\Http\Controllers\Api\V1\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\ProfileController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\FamilyController;
use App\Http\Controllers\Api\V1\FlashcardReviewController;
use App\Http\Controllers\Api\V1\PassGuaranteeClaimController;
use App\Http\Controllers\Api\V1\Public\CheatSheetController as PublicCheatSheetController;
use App\Http\Controllers\Api\V1\Public\FlashcardController as PublicFlashcardController;
use App\Http\Controllers\Api\V1\Public\PlanController;
use App\Http\Controllers\Api\V1\Public\QuizCategoryController as PublicQuizCategoryController;
use App\Http\Controllers\Api\V1\Public\QuizController as PublicQuizController;
use App\Http\Controllers\Api\V1\Public\StateController;
use App\Http\Controllers\Api\V1\Public\VehicleTypeController;
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

    // Public flashcard browsing/study — front text is always visible; back_text/image_url are
    // withheld per-card by FlashcardResource for premium cards the caller isn't entitled to.
    Route::get('flashcards', [PublicFlashcardController::class, 'index']);
    Route::get('flashcards/study', [PublicFlashcardController::class, 'study']);

    // Public cheat-sheet browsing — title/summary/cover always visible; sections/PDF are gated
    // by CheatSheetPolicy::readFull, same locked-teaser shape as flashcards.
    Route::get('cheat-sheets', [PublicCheatSheetController::class, 'index']);
    Route::get('cheat-sheets/{cheatSheet}', [PublicCheatSheetController::class, 'show']);
    Route::get('cheat-sheets/{cheatSheet}/download', [PublicCheatSheetController::class, 'download']);

    // Public read-only reference data — the valid values for the filters above.
    Route::get('states', [StateController::class, 'index']);
    Route::get('vehicle-types', [VehicleTypeController::class, 'index']);
    Route::get('quiz-categories', [PublicQuizCategoryController::class, 'index']);

    Route::get('plans', [PlanController::class, 'index']);

    // No auth:sanctum — Cashier's own VerifyWebhookSignature middleware (applied in the base
    // controller's constructor) is the real guard here, driven by STRIPE_WEBHOOK_SECRET.
    Route::post('stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/confirm-password', [AuthController::class, 'confirmPassword']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend']);

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

        Route::prefix('admin')->middleware('admin')->group(function (): void {
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

            Route::apiResource('users', UserController::class);

            Route::get('attempts', [AdminAttemptController::class, 'index']);

            Route::get('pass-guarantee-claims', [AdminPassGuaranteeClaimController::class, 'index']);
            Route::post('pass-guarantee-claims/{passGuaranteeClaim}/approve', [AdminPassGuaranteeClaimController::class, 'approve']);
            Route::post('pass-guarantee-claims/{passGuaranteeClaim}/deny', [AdminPassGuaranteeClaimController::class, 'deny']);
            Route::post('pass-guarantee-claims/{passGuaranteeClaim}/refund', [AdminPassGuaranteeClaimController::class, 'refund']);

            Route::get('stats', [AdminStatsController::class, 'index']);
        });
    });
});
