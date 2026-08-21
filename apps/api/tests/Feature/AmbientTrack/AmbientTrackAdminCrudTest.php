<?php

namespace Tests\Feature\AmbientTrack;

use App\Models\AmbientTrack;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AmbientTrackAdminCrudTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(): array
    {
        return [
            'title' => 'Chasing Horizons',
            'external_url' => 'https://example.com/ambient/chasing-horizons.mp3',
            'order_no' => 0,
            'is_active' => true,
        ];
    }

    public function test_guest_cannot_access_the_admin_ambient_tracks_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/ambient-tracks');

        $response->assertUnauthorized();
    }

    public function test_non_admin_user_cannot_access_the_admin_ambient_tracks_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/ambient-tracks');

        $response->assertForbidden();
    }

    public function test_admin_can_create_an_ambient_track(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/ambient-tracks', $this->validPayload());

        $response->assertCreated();
        $response->assertJsonPath('track.title', 'Chasing Horizons');
        $this->assertDatabaseHas('ambient_tracks', ['title' => 'Chasing Horizons']);
    }

    public function test_creating_an_ambient_track_requires_exactly_one_source(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $payload = $this->validPayload();
        unset($payload['external_url']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/ambient-tracks', $payload);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['disk', 'path']);
    }

    public function test_admin_can_update_an_ambient_track(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $track = AmbientTrack::factory()->create(['title' => 'Old Title']);

        $payload = $this->validPayload();
        $payload['title'] = 'New Title';

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/ambient-tracks/{$track->id}", $payload);

        $response->assertOk();
        $response->assertJsonPath('track.title', 'New Title');
        $this->assertDatabaseHas('ambient_tracks', ['id' => $track->id, 'title' => 'New Title']);
    }

    public function test_admin_can_delete_an_ambient_track(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $track = AmbientTrack::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/ambient-tracks/{$track->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('ambient_tracks', ['id' => $track->id]);
    }

    public function test_admin_index_includes_category_lookup_list(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/ambient-tracks');

        $response->assertOk();
        $response->assertJsonStructure(['tracks', 'categories']);
    }
}
