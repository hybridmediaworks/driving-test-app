<?php

use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule): void {
        // One fixed send time for everyone — no per-subscriber timezone preference (MVP scope).
        // 11:00 UTC ≈ 7am US Eastern / 4am US Pacific, a reasonable single compromise for a
        // US-only DMV audience spread across time zones.
        $schedule->command('newsletter:send-daily-questions')
            ->dailyAt('11:00')
            ->withoutOverlapping()
            ->onOneServer();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'verified' => EnsureEmailIsVerified::class,
        ]);

        // Pure JSON API — there is no web-based login route to redirect guests to. Without this,
        // an unauthenticated request that doesn't send `Accept: application/json` (a bare curl
        // call, a misconfigured client) makes the default `Authenticate` middleware try
        // `route('login')`, which doesn't exist here, throwing an unrelated 500 instead of 401.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
