<?php

namespace Tests\Feature\Video;

use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VideoAdminCrudTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(): array
    {
        return [
            'title' => 'Right Turns at Red Lights',
            'description' => 'What examiners actually watch for.',
            'external_url' => 'https://example.com/videos/right-turns.mp4',
            'duration_seconds' => 180,
            'order_no' => 0,
            'is_premium' => true,
            'is_active' => true,
        ];
    }

    public function test_guest_cannot_access_the_admin_videos_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/videos');

        $response->assertUnauthorized();
    }

    public function test_non_admin_user_cannot_access_the_admin_videos_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/videos');

        $response->assertForbidden();
    }

    public function test_admin_can_create_a_video(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/videos', $this->validPayload());

        $response->assertCreated();
        $response->assertJsonPath('video.title', 'Right Turns at Red Lights');
        $response->assertJsonPath('video.slug', 'right-turns-at-red-lights');
        $this->assertDatabaseHas('videos', ['title' => 'Right Turns at Red Lights']);
    }

    public function test_creating_a_video_requires_exactly_one_source(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $payload = $this->validPayload();
        unset($payload['external_url']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/videos', $payload);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['disk', 'path']);
    }

    public function test_admin_can_update_a_video(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $video = Video::factory()->create(['title' => 'Old Title']);

        $payload = $this->validPayload();
        $payload['title'] = 'New Title';

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/videos/{$video->id}", $payload);

        $response->assertOk();
        $response->assertJsonPath('video.title', 'New Title');
        $this->assertDatabaseHas('videos', ['id' => $video->id, 'title' => 'New Title']);
    }

    public function test_admin_can_delete_a_video(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $video = Video::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/videos/{$video->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('videos', ['id' => $video->id]);
    }
}
