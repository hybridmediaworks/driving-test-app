<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail())) {
            abort(Response::HTTP_FORBIDDEN, 'Your email address is not verified.');
        }

        return $next($request);
    }
}
