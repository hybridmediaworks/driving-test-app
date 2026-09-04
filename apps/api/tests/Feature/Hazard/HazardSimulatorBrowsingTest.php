<?php

namespace Tests\Feature\Hazard;

use App\Models\HazardSimulator;
use App\Models\HazardSimulatorAttempt;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AuthenticatesWithBearerToken;
use Tests\TestCase;

class HazardSimulatorBrowsingTest extends TestCase
{
    use AuthenticatesWithBearerToken;
    use RefreshDatabase;

    private function makeActiveSubscriber(): User
    {
        Plan::query()->firstOrCreate(
            ['key' => 'monthly'],
            ['name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'stripe_price_id' => 'price_monthly_hazard_test'],
        );

        $user = User::factory()->create(['is_admin' => false]);

        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => 'price_monthly_hazard_test',
            'quantity' => 1,
        ]);

        return $user;
    }

    /**
     * A simulator with 1 demo + 2 scored assessment hazards on a premium video.
     */
    private function makeSimulator(array $videoOverrides = []): HazardSimulator
    {
        $video = Video::factory()->create(array_merge([
            'section' => 'Defensive Driving Hazard Simulators',
            'is_premium' => true,
            'is_active' => true,
            'external_url' => 'https://player.vimeo.com/video/475031029',
        ], $videoOverrides));

        $simulator = HazardSimulator::factory()->create([
            'video_id' => $video->id,
            'slug' => 'al-hazard-sim-1',
            'provider_video_id' => '475031029',
            'hazard_count' => 3,
            'demo_hazard_count' => 1,
        ]);

        $simulator->hazards()->createMany([
            ['source_hazard_id' => 1, 'type' => 'sign', 'mode' => 'demo', 'in_timeline' => true, 'sort_order' => 0, 'time_start' => 4, 'time_end' => 8, 'comment' => 'Demo sign', 'audio_url' => 'https://x/d1.mp3'],
            ['source_hazard_id' => 2, 'type' => 'vehicle', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 1, 'time_start' => 20, 'time_end' => 26, 'comment' => 'Braking car ahead', 'audio_url' => 'https://x/h2.mp3'],
            ['source_hazard_id' => 3, 'type' => 'pedestrian', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 2, 'time_start' => 40, 'time_end' => 46, 'comment' => 'Cyclist entering', 'audio_url' => 'https://x/h3.mp3'],
        ]);

        return $simulator;
    }

    public function test_guest_sees_the_teaser_but_no_manifest_for_a_premium_simulator(): void
    {
        $simulator = $this->makeSimulator();

        $response = $this->getJson("/api/v1/hazard-simulators/{$simulator->slug}");

        $response->assertOk();
        $response->assertJsonPath('simulator.slug', 'al-hazard-sim-1');
        $response->assertJsonPath('simulator.hazard_count', 3);
        $response->assertJsonPath('locked', true);
        $response->assertJsonPath('manifest', null);
    }

    public function test_entitled_caller_gets_a_manifest_with_demo_hazards_but_not_the_scored_answer_key(): void
    {
        $simulator = $this->makeSimulator();
        $subscriber = $this->makeActiveSubscriber();

        $response = $this->withUserToken($subscriber)->getJson("/api/v1/hazard-simulators/{$simulator->slug}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $response->assertJsonPath('manifest.provider_video_id', '475031029');
        $response->assertJsonPath('manifest.scored_hazard_count', 2);
        $response->assertJsonPath('manifest.demo_hazard_count', 1);

        // Demo hazards come through in full.
        $response->assertJsonPath('manifest.demo_hazards.0.comment', 'Demo sign');
        $response->assertJsonPath('manifest.demo_hazards.0.time_start', 4);

        // The scored hazards' comments/windows never appear anywhere in the payload.
        $body = $response->json();
        $this->assertStringNotContainsString('Braking car ahead', json_encode($body));
        $this->assertStringNotContainsString('Cyclist entering', json_encode($body));
    }

    public function test_free_simulator_is_playable_by_a_guest(): void
    {
        $simulator = $this->makeSimulator(['is_premium' => false]);

        $response = $this->getJson("/api/v1/hazard-simulators/{$simulator->slug}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $response->assertJsonPath('manifest.scored_hazard_count', 2);
    }

    public function test_guest_cannot_start_an_attempt_on_a_premium_simulator(): void
    {
        $simulator = $this->makeSimulator();

        $this->postJson("/api/v1/hazard-simulators/{$simulator->slug}/attempts/start")
            ->assertForbidden();
    }

    public function test_index_lists_active_simulators_with_a_locked_flag(): void
    {
        $this->makeSimulator();
        HazardSimulator::factory()->inactive()->create(['slug' => 'inactive-one']);

        $response = $this->getJson('/api/v1/hazard-simulators');

        $response->assertOk();
        $slugs = collect($response->json('data'))->pluck('slug');
        $this->assertTrue($slugs->contains('al-hazard-sim-1'));
        $this->assertFalse($slugs->contains('inactive-one'));
        $this->assertTrue(collect($response->json('data'))->firstWhere('slug', 'al-hazard-sim-1')['locked']);
    }

    public function test_inactive_simulator_404s_on_show(): void
    {
        $simulator = $this->makeSimulator();
        $simulator->update(['is_active' => false]);

        $this->getJson("/api/v1/hazard-simulators/{$simulator->slug}")->assertForbidden();
    }

    public function test_video_resource_flags_that_a_hazard_video_has_a_simulator(): void
    {
        $simulator = $this->makeSimulator();

        $response = $this->getJson("/api/v1/videos/{$simulator->video->id}");

        $response->assertOk();
        $response->assertJsonPath('video.has_simulator', true);
        $response->assertJsonPath('video.simulator_slug', 'al-hazard-sim-1');
    }

    public function test_show_restores_the_callers_last_completed_attempt_so_a_refresh_shows_the_result(): void
    {
        $simulator = $this->makeSimulator();
        $subscriber = $this->makeActiveSubscriber();

        $noAttemptYet = $this->withUserToken($subscriber)->getJson("/api/v1/hazard-simulators/{$simulator->slug}");
        $noAttemptYet->assertOk();
        $noAttemptYet->assertJsonPath('last_attempt', null);

        $attempt = HazardSimulatorAttempt::factory()->create([
            'user_id' => $subscriber->id,
            'hazard_simulator_id' => $simulator->id,
            'score' => 78,
        ]);

        $response = $this->withUserToken($subscriber)->getJson("/api/v1/hazard-simulators/{$simulator->slug}");
        $response->assertOk();
        $response->assertJsonPath('last_attempt.id', $attempt->id);
        $response->assertJsonPath('last_attempt.score', 78);
    }

    public function test_show_restores_a_guests_last_attempt_by_guest_token(): void
    {
        $simulator = $this->makeSimulator(['is_premium' => false]); // free, so a guest may attempt
        $attempt = HazardSimulatorAttempt::factory()->guest('guest-xyz')->create([
            'hazard_simulator_id' => $simulator->id,
        ]);

        $mine = $this->withHeader('X-Guest-Token', 'guest-xyz')
            ->getJson("/api/v1/hazard-simulators/{$simulator->slug}");
        $mine->assertJsonPath('last_attempt.id', $attempt->id);

        $someoneElses = $this->withHeader('X-Guest-Token', 'a-different-guest')
            ->getJson("/api/v1/hazard-simulators/{$simulator->slug}");
        $someoneElses->assertJsonPath('last_attempt', null);
    }

    public function test_index_reports_this_callers_attempted_best_score_and_passed_state(): void
    {
        $simulator = $this->makeSimulator();
        $simulator->update(['pass_threshold_percent' => 70]);
        $subscriber = $this->makeActiveSubscriber();

        $fresh = $this->withUserToken($subscriber)->getJson('/api/v1/hazard-simulators');
        $mine = collect($fresh->json('data'))->firstWhere('slug', $simulator->slug);
        $this->assertFalse($mine['attempted']);
        $this->assertNull($mine['best_score']);
        $this->assertNull($mine['passed']);

        HazardSimulatorAttempt::factory()->create(['user_id' => $subscriber->id, 'hazard_simulator_id' => $simulator->id, 'score' => 55]);
        HazardSimulatorAttempt::factory()->create(['user_id' => $subscriber->id, 'hazard_simulator_id' => $simulator->id, 'score' => 82]);

        $after = $this->withUserToken($subscriber)->getJson('/api/v1/hazard-simulators');
        $mine = collect($after->json('data'))->firstWhere('slug', $simulator->slug);
        $this->assertTrue($mine['attempted']);
        $this->assertSame(82, $mine['best_score']); // best of the two, not the latest
        $this->assertTrue($mine['passed']); // 82 >= the 70% threshold
    }

    public function test_index_shows_no_attempt_state_for_an_anonymous_caller(): void
    {
        $simulator = $this->makeSimulator(['is_premium' => false]);
        HazardSimulatorAttempt::factory()->create(['hazard_simulator_id' => $simulator->id]);

        $response = $this->getJson('/api/v1/hazard-simulators');

        $mine = collect($response->json('data'))->firstWhere('slug', $simulator->slug);
        $this->assertFalse($mine['attempted']);
        $this->assertNull($mine['best_score']);
    }
}
