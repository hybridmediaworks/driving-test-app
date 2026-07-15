<?php

use App\Http\Controllers\Api\Admin\QuizCategoryController;
use App\Http\Controllers\Api\Admin\QuizController;
use App\Http\Controllers\Api\Admin\QuizQuestionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware('signed')
    ->name('verification.verify');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/confirm-password', [AuthController::class, 'confirmPassword']);
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend']);

    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);

    Route::prefix('admin')->group(function (): void {
        Route::apiResource('quiz-categories', QuizCategoryController::class)->except(['show'])->parameters([
            'quiz-categories' => 'quizCategory',
        ]);
        Route::get('quiz-categories/{quizCategory}', [QuizCategoryController::class, 'show']);

        Route::apiResource('quizzes', QuizController::class)->except(['show']);
        Route::get('quizzes/{quiz}', [QuizController::class, 'show']);

        Route::get('quizzes/{quiz}/questions', [QuizQuestionController::class, 'index']);
        Route::post('quizzes/{quiz}/questions', [QuizQuestionController::class, 'store']);
        Route::get('quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'show']);
        Route::match(['put', 'post'], 'quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'update']);
        Route::delete('quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'destroy']);
        Route::post('quizzes/{quiz}/questions/reorder', [QuizQuestionController::class, 'reorder']);
        Route::post('quizzes/{quiz}/questions/{question}/move', [QuizQuestionController::class, 'move']);
    });
});
