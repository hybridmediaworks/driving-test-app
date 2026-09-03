<?php

namespace Tests\Feature\Hazard;

use App\Models\HazardSimulator;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AuthenticatesWithBearerToken;
use Tests\TestCase;

class HazardAttemptGradingTest extends TestCase
{
    use AuthenticatesWithBearerToken;
    use RefreshDatabase;

    /**
     * 6 scored assessment hazards + 2 auto-credited demo hazards, ~6s windows, well spaced.
     */
    private int $simCounter = 0;

    private function makeSimulator(?int $passThreshold = null): HazardSimulator
    {
        $slug = 'grading-sim-'.(++$this->simCounter);

        $video = Video::factory()->create([
            'section' => 'Defensive Driving Hazard Simulators',
            'is_premium' => false,
            'external_url' => 'https://player.vimeo.com/video/1',
        ]);

        $simulator = HazardSimulator::factory()->create([
            'video_id' => $video->id,
            'slug' => $slug,
            'pass_threshold_percent' => $passThreshold,
            'scoring_profile' => 'standard',
        ]);

        $rows = [
            ['source_hazard_id' => 90, 'mode' => 'demo', 'sort_order' => 0, 'time_start' => 4, 'time_end' => 8],
            ['source_hazard_id' => 91, 'mode' => 'demo', 'sort_order' => 1, 'time_start' => 12, 'time_end' => 16],
        ];
        $windows = [[20, 26], [35, 41], [50, 56], [65, 71], [80, 86], [95, 101]];
        foreach ($windows as $i => [$start, $end]) {
            $rows[] = [
                'source_hazard_id' => 100 + $i,
                'mode' => 'assessment',
                'sort_order' => 2 + $i,
                'time_start' => $start,
                'time_end' => $end,
            ];
        }

        $simulator->hazards()->createMany(array_map(fn ($r) => [
            'type' => 'vehicle',
            'in_timeline' => true,
            'comment' => "Hazard {$r['source_hazard_id']}",
            'audio_url' => "https://x/{$r['source_hazard_id']}.mp3",
            ...$r,
        ], $rows));

        return $simulator;
    }

    /**
     * @param  list<array{0: float, 1: float|null, 2: float|null}>  $clicks  [seconds, x, y]
     * @return list<array{video_ms: int, x: float|null, y: float|null}>
     */
    private function events(array $clicks): array
    {
        return array_map(fn ($c) => [
            'video_ms' => (int) round($c[0] * 1000),
            'x' => $c[1] ?? 0.5,
            'y' => $c[2] ?? 0.5,
        ], $clicks);
    }

    private function runAttempt(HazardSimulator $simulator, array $events, ?User $user = null): array
    {
        $test = $user ? $this->withUserToken($user) : $this->withHeader('X-Guest-Token', 'guest-abc');

        $start = $test->postJson("/api/v1/hazard-simulators/{$simulator->slug}/attempts/start");
        $start->assertOk();
        $attemptId = $start->json('attempt.id');

        $submit = $test->postJson("/api/v1/hazard-simulators/{$simulator->slug}/attempts/{$attemptId}", [
            'events' => $events,
            'duration_seconds' => 135,
        ]);
        $submit->assertCreated();

        return $submit->json('attempt');
    }

    public function test_reference_run_a_three_of_six_fast_with_false_clicks_is_a_low_score(): void
    {
        $simulator = $this->makeSimulator();

        // Spot the first 3 hazards ~0.42s into each window (fast), plus 15 irregular false clicks.
        $clicks = [[20.42, 0.4, 0.5], [35.42, 0.4, 0.5], [50.42, 0.4, 0.5]];
        foreach ([1.0, 1.7, 2.5, 3.1, 3.7, 16.4, 17.3, 27.1, 28.4, 29.6, 42.2, 44.9, 47.1, 58.3, 61.4] as $t) {
            $clicks[] = [$t, 0.1, 0.1];
        }

        $attempt = $this->runAttempt($simulator, $this->events($clicks));

        $this->assertSame(3, $attempt['hazards_spotted']);
        $this->assertSame(6, $attempt['hazards_total']);
        $this->assertSame(15, $attempt['false_clicks']);
        $this->assertSame('fast', $attempt['reaction_band']);
        $this->assertGreaterThanOrEqual(25, $attempt['score']);
        $this->assertLessThanOrEqual(55, $attempt['score']);
    }

    public function test_reference_run_b_five_of_six_average_with_more_false_clicks_is_a_mid_score(): void
    {
        $simulator = $this->makeSimulator();

        // Spot 5 hazards ~1.49s into each window (average), plus 22 irregular false clicks.
        $clicks = [[21.49, 0.4, 0.5], [36.49, 0.4, 0.5], [51.49, 0.4, 0.5], [66.49, 0.4, 0.5], [81.49, 0.4, 0.5]];
        foreach ([1.0, 1.7, 2.5, 3.1, 3.7, 9.2, 10.4, 17.6, 18.9, 27.1, 28.4, 29.6, 31.2, 43.2, 44.9, 47.1, 58.3, 61.4, 62.9, 73.1, 76.4, 90.2] as $t) {
            $clicks[] = [$t, 0.1, 0.1];
        }

        $attempt = $this->runAttempt($simulator, $this->events($clicks));

        $this->assertSame(5, $attempt['hazards_spotted']);
        $this->assertSame(22, $attempt['false_clicks']);
        $this->assertSame('average', $attempt['reaction_band']);
        $this->assertGreaterThanOrEqual(45, $attempt['score']);
        $this->assertLessThanOrEqual(70, $attempt['score']);
    }

    public function test_detection_dominates_more_hazards_spotted_beats_faster_reactions(): void
    {
        $simulator = $this->makeSimulator();

        $fastButFew = $this->runAttempt($simulator, $this->events([
            [20.30, 0.4, 0.5], [35.30, 0.4, 0.5],
        ]));

        $simulator2 = $this->makeSimulator();
        $slowerButMany = $this->runAttempt($simulator2, $this->events([
            [24.0, 0.4, 0.5], [39.0, 0.4, 0.5], [54.0, 0.4, 0.5], [69.0, 0.4, 0.5], [99.0, 0.4, 0.5],
        ]));

        $this->assertGreaterThan($fastButFew['score'], $slowerButMany['score']);
    }

    public function test_metronomic_spam_clicking_does_not_inflate_the_score(): void
    {
        $simulator = $this->makeSimulator();

        // 12 clicks exactly 700ms apart, several of which land inside hazard windows.
        $clicks = [];
        for ($i = 0; $i < 12; $i++) {
            $clicks[] = [20.0 + $i * 0.7, 0.5, 0.5];
        }

        $attempt = $this->runAttempt($simulator, $this->events($clicks));

        $this->assertSame(0, $attempt['hazards_spotted']);
        $this->assertSame(0, $attempt['score']);
    }

    public function test_clicks_within_the_dedupe_window_are_ignored(): void
    {
        $simulator = $this->makeSimulator();

        // Three rapid clicks 100ms apart at the same hazard — counts as one spot, no false clicks.
        $attempt = $this->runAttempt($simulator, $this->events([
            [21.0, 0.4, 0.4], [21.1, 0.4, 0.4], [21.2, 0.4, 0.4],
        ]));

        $this->assertSame(1, $attempt['hazards_spotted']);
        $this->assertSame(0, $attempt['false_clicks']);
    }

    public function test_a_click_where_a_demo_and_a_scored_window_overlap_counts_as_the_scored_hit(): void
    {
        // AL Sim 1 really has this: demo hazard 15 (31.5–38.7) overlaps scored hazard 21 (35.1–42.2).
        $simulator = $this->makeSimulator();
        $simulator->hazards()->where('source_hazard_id', 90)->update(['time_start' => 18, 'time_end' => 24]);

        // Click at 21s — inside both the (shifted) demo window and scored hazard 100's window.
        $attempt = $this->runAttempt($simulator, $this->events([[21.0, 0.5, 0.5]]));

        $this->assertSame(1, $attempt['hazards_spotted']);
        $this->assertSame(0, $attempt['false_clicks']);
    }

    public function test_spotting_a_pool_only_hazard_is_not_a_false_click(): void
    {
        $simulator = $this->makeSimulator();
        $simulator->hazards()->create([
            'source_hazard_id' => 200, 'type' => 'pedestrian', 'mode' => 'assessment',
            'in_timeline' => false, 'sort_order' => null, 'time_start' => 30, 'time_end' => 33,
            'comment' => 'Unscored pedestrian',
        ]);

        $attempt = $this->runAttempt($simulator, $this->events([[31.0, 0.5, 0.5]]));

        $this->assertSame(0, $attempt['hazards_spotted']);
        $this->assertSame(0, $attempt['false_clicks']);
    }

    public function test_breakdown_marks_missed_hazards_with_a_seek_offset_and_the_feedback_copy(): void
    {
        $simulator = $this->makeSimulator();

        $attempt = $this->runAttempt($simulator, $this->events([[20.5, 0.4, 0.5]]));

        $breakdown = collect($attempt['breakdown']);
        $this->assertCount(8, $breakdown); // 6 scored + 2 demo

        $first = $breakdown->firstWhere('hazard_id', $simulator->hazards()->where('source_hazard_id', 100)->value('id'));
        $this->assertTrue($first['spotted']);

        $missed = $breakdown->firstWhere('hazard_id', $simulator->hazards()->where('source_hazard_id', 101)->value('id'));
        $this->assertFalse($missed['spotted']);
        $this->assertSame('Hazard 101', $missed['comment']);
        $this->assertEquals(33.0, $missed['seek_to']); // time_start 35 - 2s lead-in

        $demo = $breakdown->firstWhere('hazard_id', $simulator->hazards()->where('source_hazard_id', 90)->value('id'));
        $this->assertTrue($demo['auto_credited']);
        $this->assertTrue($demo['spotted']);
    }

    public function test_pass_threshold_is_persisted_at_grade_time(): void
    {
        $simulator = $this->makeSimulator(passThreshold: 50);

        // Spot all 6 quickly — a clear pass.
        $attempt = $this->runAttempt($simulator, $this->events([
            [20.3, 0.4, 0.5], [35.3, 0.4, 0.5], [50.3, 0.4, 0.5], [65.3, 0.4, 0.5], [80.3, 0.4, 0.5], [95.3, 0.4, 0.5],
        ]));

        $this->assertTrue($attempt['passed']);
        $this->assertDatabaseHas('hazard_simulator_attempts', ['id' => $attempt['id'], 'passed' => true]);
    }

    public function test_score_only_simulator_reports_passed_null(): void
    {
        $simulator = $this->makeSimulator();

        $attempt = $this->runAttempt($simulator, $this->events([[20.3, 0.4, 0.5]]));

        $this->assertNull($attempt['passed']);
    }

    public function test_a_guest_run_is_claimed_on_register(): void
    {
        $simulator = $this->makeSimulator();
        $this->runAttempt($simulator, $this->events([[20.3, 0.4, 0.5]]));

        $this->assertDatabaseHas('hazard_simulator_attempts', ['guest_token' => 'guest-abc', 'user_id' => null]);

        $this->withHeader('X-Guest-Token', 'guest-abc')->postJson('/api/v1/register', [
            'name' => 'Claimed Learner',
            'email' => 'claimed@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'claimed@example.com')->firstOrFail();
        $this->assertDatabaseHas('hazard_simulator_attempts', ['user_id' => $user->id, 'guest_token' => null]);
    }

    public function test_completed_attempt_shows_in_history_and_is_cleared_by_reset_all_results(): void
    {
        $simulator = $this->makeSimulator();
        $user = User::factory()->create();
        $this->runAttempt($simulator, $this->events([[20.3, 0.4, 0.5]]), $user);

        $history = $this->withUserToken($user)->getJson('/api/v1/hazard-attempts');
        $history->assertOk();
        $this->assertCount(1, $history->json('data'));
        $this->assertNotNull($history->json('data.0.breakdown'));

        $this->withUserToken($user)->deleteJson('/api/v1/attempts')->assertOk();

        $this->assertDatabaseCount('hazard_simulator_attempts', 0);
    }

    public function test_submitting_an_already_completed_attempt_is_rejected(): void
    {
        $simulator = $this->makeSimulator();
        $attempt = $this->runAttempt($simulator, $this->events([[20.3, 0.4, 0.5]]));

        $this->withHeader('X-Guest-Token', 'guest-abc')
            ->postJson("/api/v1/hazard-simulators/{$simulator->slug}/attempts/{$attempt['id']}", ['events' => []])
            ->assertStatus(422);
    }

    public function test_mark_endpoint_reveals_a_spotted_hazard_but_reports_a_miss_for_a_false_click(): void
    {
        $simulator = $this->makeSimulator();
        $test = $this->withHeader('X-Guest-Token', 'guest-abc');
        $attemptId = $test->postJson("/api/v1/hazard-simulators/{$simulator->slug}/attempts/start")->json('attempt.id');

        $hit = $test->postJson("/api/v1/hazard-simulators/{$simulator->slug}/attempts/{$attemptId}/mark", [
            'video_ms' => 21000, 'x' => 0.5, 'y' => 0.5,
        ]);
        $hit->assertOk()->assertJsonPath('hit', true)->assertJsonPath('hazard.comment', 'Hazard 100');

        $miss = $test->postJson("/api/v1/hazard-simulators/{$simulator->slug}/attempts/{$attemptId}/mark", [
            'video_ms' => 5000, 'x' => 0.1, 'y' => 0.1,
        ]);
        $miss->assertOk()->assertJsonPath('hit', false)->assertJsonPath('hazard', null);
    }
}
