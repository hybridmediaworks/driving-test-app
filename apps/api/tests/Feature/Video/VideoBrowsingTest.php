<?php

namespace Tests\Feature\Video;

use App\Models\Plan;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AuthenticatesWithBearerToken;
use Tests\TestCase;

class VideoBrowsingTest extends TestCase
{
    use AuthenticatesWithBearerToken;
    use RefreshDatabase;

    private function makeActiveSubscriber(): User
    {
        Plan::query()->firstOrCreate(
            ['key' => 'monthly'],
            ['name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'stripe_price_id' => 'price_monthly_video_test'],
        );

        $user = User::factory()->create(['is_admin' => false]);

        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => 'price_monthly_video_test',
            'quantity' => 1,
        ]);

        return $user;
    }

    public function test_guest_sees_the_teaser_but_not_the_url_for_a_premium_video(): void
    {
        $video = Video::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->getJson("/api/v1/videos/{$video->id}");

        $response->assertOk();
        $response->assertJsonPath('video.title', $video->title);
        $response->assertJsonPath('locked', true);
        $response->assertJsonPath('url', null);
    }

    public function test_guest_sees_the_url_for_a_free_video(): void
    {
        $video = Video::factory()->create(['is_premium' => false, 'is_active' => true, 'external_url' => 'https://example.com/free.mp4']);

        $response = $this->getJson("/api/v1/videos/{$video->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $response->assertJsonPath('url', 'https://example.com/free.mp4');
    }

    public function test_admin_sees_the_url_for_a_premium_video(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $video = Video::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->withUserToken($admin)->getJson("/api/v1/videos/{$video->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $this->assertNotNull($response->json('url'));
    }

    public function test_active_subscriber_sees_the_url_for_a_premium_video(): void
    {
        $subscriber = $this->makeActiveSubscriber();
        $video = Video::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->withUserToken($subscriber)->getJson("/api/v1/videos/{$video->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $this->assertNotNull($response->json('url'));
    }

    public function test_inactive_video_returns_403_on_show(): void
    {
        $video = Video::factory()->create(['is_active' => false]);

        $response = $this->getJson("/api/v1/videos/{$video->id}");

        $response->assertForbidden();
    }

    public function test_inactive_videos_are_excluded_from_the_index(): void
    {
        Video::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/videos');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_filtering_by_state_includes_universal_videos_with_a_null_state(): void
    {
        $california = State::factory()->create(['code' => 'CA']);
        $texas = State::factory()->create(['code' => 'TX']);

        $universal = Video::factory()->create(['state_id' => null, 'is_active' => true]);
        $caOnly = Video::factory()->create(['state_id' => $california->id, 'is_active' => true]);
        $txOnly = Video::factory()->create(['state_id' => $texas->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/videos?state=CA');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($universal->id));
        $this->assertTrue($ids->contains($caOnly->id));
        $this->assertFalse($ids->contains($txOnly->id));
    }

    public function test_filtering_by_category_narrows_results(): void
    {
        $roadSigns = QuizCategory::factory()->create(['name' => 'road-signs']);
        $trafficLaws = QuizCategory::factory()->create(['name' => 'traffic-laws']);

        $signVideo = Video::factory()->create(['quiz_category_id' => $roadSigns->id, 'is_active' => true]);
        Video::factory()->create(['quiz_category_id' => $trafficLaws->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/videos?category=road-signs');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEqualsCanonicalizing([$signVideo->id], $ids->all());
    }
}
