<?php

namespace Tests\Concerns;

use App\Models\User;
use Illuminate\Testing\TestResponse;

/**
 * `actingAs($user, 'sanctum')` also calls Auth::shouldUse('sanctum') under the hood, which makes
 * the ambient/default-guard user resolution (Gate::allows(), $this->authorize(), $request->user()
 * with no guard argument) work correctly in tests — even on routes that carry no auth:sanctum
 * middleware in production and therefore never see that resolution succeed for a real request.
 * This masked a real bug (see QuizController/CheatSheetController/FlashcardResource, all of which
 * explicitly resolve $request->user('sanctum') for exactly this reason).
 *
 * Use this trait instead of actingAs() whenever the route under test is public (guest-accessible)
 * but optionally reads the authenticated user — it sends a real Bearer token exactly as a real
 * client would, so it actually exercises the same resolution path production traffic hits.
 */
trait AuthenticatesWithBearerToken
{
    protected function withUserToken(User $user): static
    {
        $token = $user->createToken('test')->plainTextToken;

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
