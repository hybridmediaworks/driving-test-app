<?php

namespace Tests\Feature;

use App\Models\AmbientTrack;
use App\Models\QuizCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AmbientTrackTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_active_tracks_with_resolved_urls(): void
    {
        AmbientTrack::factory()->create(['title' => 'Chasing Horizons', 'order_no' => 0]);
        AmbientTrack::factory()->create(['title' => 'Inactive Track', 'is_active' => false, 'order_no' => 1]);

        $response = $this->getJson('/api/v1/ambient-tracks');

        $response->assertOk();
        $response->assertJsonCount(1, 'tracks');
        $response->assertJsonStructure(['tracks' => [['id', 'title', 'url']]]);
        $response->assertJsonPath('tracks.0.title', 'Chasing Horizons');
    }

    public function test_url_is_null_when_the_s3_bucket_is_not_configured(): void
    {
        config(['filesystems.disks.s3.bucket' => '']);
        AmbientTrack::factory()->create(['disk' => 's3', 'path' => 'ambient-music/x.mp3', 'external_url' => null]);

        $response = $this->getJson('/api/v1/ambient-tracks');

        $response->assertOk();
        $response->assertJsonPath('tracks.0.url', null);
    }

    public function test_url_resolves_against_the_configured_bucket(): void
    {
        config([
            'filesystems.disks.s3.bucket' => 'test-bucket',
            'filesystems.disks.s3.region' => 'us-east-1',
            'filesystems.disks.s3.key' => 'test-key',
            'filesystems.disks.s3.secret' => 'test-secret',
        ]);
        AmbientTrack::factory()->create(['disk' => 's3', 'path' => 'ambient-music/x.mp3', 'external_url' => null]);

        $response = $this->getJson('/api/v1/ambient-tracks');

        $response->assertOk();
        $url = $response->json('tracks.0.url');
        $this->assertNotNull($url);
        $this->assertStringContainsString('ambient-music/x.mp3', $url);
    }

    public function test_global_tracks_show_for_every_category(): void
    {
        $category = QuizCategory::factory()->create(['name' => 'road-signs']);
        AmbientTrack::factory()->create(['title' => 'Global Track', 'quiz_category_id' => null]);

        $response = $this->getJson('/api/v1/ambient-tracks?category=road-signs');

        $response->assertOk();
        $response->assertJsonPath('tracks.0.title', 'Global Track');
    }

    public function test_category_scoped_track_only_shows_for_its_own_category(): void
    {
        $roadSigns = QuizCategory::factory()->create(['name' => 'road-signs']);
        $trafficLaws = QuizCategory::factory()->create(['name' => 'traffic-laws']);
        AmbientTrack::factory()->create(['title' => 'Road Signs Track', 'quiz_category_id' => $roadSigns->id]);

        $matching = $this->getJson('/api/v1/ambient-tracks?category=road-signs');
        $matching->assertJsonCount(1, 'tracks');
        $matching->assertJsonPath('tracks.0.title', 'Road Signs Track');

        $nonMatching = $this->getJson('/api/v1/ambient-tracks?category=traffic-laws');
        $nonMatching->assertJsonCount(0, 'tracks');
    }

    public function test_no_category_filter_returns_every_active_track(): void
    {
        $category = QuizCategory::factory()->create(['name' => 'road-signs']);
        AmbientTrack::factory()->create(['quiz_category_id' => null]);
        AmbientTrack::factory()->create(['quiz_category_id' => $category->id]);

        $response = $this->getJson('/api/v1/ambient-tracks');

        $response->assertOk();
        $response->assertJsonCount(2, 'tracks');
    }
}
