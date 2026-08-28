<?php

namespace Tests\Feature;

use App\Models\ReviewerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReviewerProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_endpoint_returns_the_current_profile(): void
    {
        ReviewerProfile::query()->create([
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => '2026-01-15',
        ]);

        $response = $this->getJson('/api/v1/reviewer-profile');

        $response->assertOk();
        $response->assertJsonPath('reviewer.name', 'M. Reyes');
        $response->assertJsonPath('reviewer.title', 'DMV Test-Prep Editor');
        $response->assertJsonPath('reviewer.photo_url', null);
        // Plain date, not a full ISO datetime — the frontend date-formatting/date-input both
        // depend on this exact shape.
        $response->assertJsonPath('reviewer.verified_at', '2026-01-15');
    }

    public function test_public_endpoint_creates_a_placeholder_profile_when_none_exists_yet(): void
    {
        $this->assertDatabaseCount('reviewer_profiles', 0);

        $response = $this->getJson('/api/v1/reviewer-profile');

        $response->assertOk();
        $this->assertDatabaseCount('reviewer_profiles', 1);
        $this->assertNotNull($response->json('reviewer.name'));
    }

    public function test_guest_cannot_view_the_admin_reviewer_profile_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/reviewer-profile');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_view_the_admin_reviewer_profile_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/reviewer-profile');

        $response->assertForbidden();
    }

    public function test_admin_can_view_the_current_profile(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        ReviewerProfile::query()->create([
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => '2026-01-15',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/reviewer-profile');

        $response->assertOk();
        $response->assertJsonPath('reviewer.name', 'M. Reyes');
    }

    public function test_admin_can_update_the_profile_without_touching_the_photo(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        ReviewerProfile::query()->create([
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => '2026-01-15',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/reviewer-profile', [
            'name' => 'J. Alvarez',
            'title' => 'Senior DMV Content Reviewer',
            'verified_at' => '2026-08-28',
        ]);

        $response->assertOk();
        $response->assertJsonPath('reviewer.name', 'J. Alvarez');
        $this->assertDatabaseHas('reviewer_profiles', [
            'name' => 'J. Alvarez',
            'title' => 'Senior DMV Content Reviewer',
        ]);

        // The public endpoint reflects the same update immediately.
        $this->getJson('/api/v1/reviewer-profile')->assertJsonPath('reviewer.name', 'J. Alvarez');
    }

    public function test_admin_can_upload_and_remove_a_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['is_admin' => true]);
        ReviewerProfile::query()->create([
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => '2026-01-15',
        ]);

        $upload = $this->actingAs($admin, 'sanctum')->put('/api/v1/admin/reviewer-profile', [
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => '2026-01-15',
            'photo' => UploadedFile::fake()->image('reviewer.jpg', 200, 200),
        ]);

        $upload->assertOk();
        $this->assertNotNull($upload->json('reviewer.photo_url'));
        $this->getJson('/api/v1/reviewer-profile')->assertJsonPath(
            'reviewer.photo_url',
            $upload->json('reviewer.photo_url'),
        );

        $removed = $this->actingAs($admin, 'sanctum')->put('/api/v1/admin/reviewer-profile', [
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => '2026-01-15',
            'remove_photo' => true,
        ]);

        $removed->assertOk();
        $removed->assertJsonPath('reviewer.photo_url', null);
    }

    public function test_name_title_and_verified_at_are_required(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        ReviewerProfile::query()->create([
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => '2026-01-15',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/reviewer-profile', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name', 'title', 'verified_at']);
    }
}
