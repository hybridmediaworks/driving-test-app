<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreUserRequest;
use App\Http\Requests\Api\V1\Admin\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List users (admin)
     *
     * Requires an admin account. Paginated (standard Laravel Resource collection envelope —
     * `data`/`links`/`meta`), most recently registered first. `search` matches name or email
     * (partial, case-insensitive). Filter with `is_admin` or `verified` (both booleans).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()->latest();

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term));
        }

        if ($request->has('is_admin')) {
            $query->where('is_admin', $request->boolean('is_admin'));
        }

        if ($request->has('verified')) {
            $request->boolean('verified')
                ? $query->whereNotNull('email_verified_at')
                : $query->whereNull('email_verified_at');
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return UserResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Create a user (admin)
     *
     * Admin-provisioned accounts are marked verified immediately — there is no self-service
     * verification-email flow for accounts an admin creates directly.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::query()->create([
            ...$data,
            'password' => Hash::make($data['password']),
        ]);

        // email_verified_at isn't mass-assignable (not in User::$fillable's Attribute list),
        // so it's set via direct property assignment, same as the un-verify path in update().
        $user->email_verified_at = now();
        $user->save();

        return response()->json(['user' => new UserResource($user)], 201);
    }

    /**
     * Show a user (admin)
     */
    public function show(User $user): JsonResponse
    {
        return response()->json(['user' => new UserResource($user)]);
    }

    /**
     * Update a user (admin)
     *
     * Changing `email` un-verifies it (`email_verified_at` reset to null), same as the
     * self-service profile update. `password` is optional — omit it to leave the password
     * unchanged. An admin cannot revoke their own `is_admin` status through this endpoint, to
     * avoid locking themselves out of the admin panel.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if ($request->user()->is($user) && ! $data['is_admin']) {
            return response()->json([
                'message' => __('You cannot revoke your own admin access.'),
            ], 422);
        }

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->fill($data);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return response()->json(['user' => new UserResource($user->fresh())]);
    }

    /**
     * Delete a user (admin)
     *
     * Blocked (422) when deleting your own account — use the profile "delete my account"
     * endpoint instead, which requires password confirmation.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json([
                'message' => __('You cannot delete your own account.'),
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => __('User deleted.')]);
    }
}
