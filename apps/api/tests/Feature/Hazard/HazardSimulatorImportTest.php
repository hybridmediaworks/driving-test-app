<?php

namespace Tests\Feature\Hazard;

use App\Actions\Content\ImportSimulatorsFromCrawl;
use App\Enums\HazardType;
use App\Models\HazardSimulator;
use App\Models\State;
use App\Models\VehicleType;
use App\Support\ImportSummary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HazardSimulatorImportTest extends TestCase
{
    use RefreshDatabase;

    private State $state;

    private VehicleType $vehicleType;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake(); // no real Vimeo oEmbed calls
        $this->state = State::factory()->create(['code' => 'AL', 'name' => 'Alabama']);
        $this->vehicleType = VehicleType::factory()->create(['name' => 'car', 'title' => 'Car']);
    }

    private function import(array $data, ImportSummary $summary, bool $skipHazards = false): void
    {
        app(ImportSimulatorsFromCrawl::class)($data, $this->state, $this->vehicleType, 'driving_test', $summary, false, $skipHazards);
    }

    /**
     * Mirrors AL Sim 1's real quirks: 11 hazards but a 9-entry timeline, demo_hazard_count 3 vs 2
     * actual demo rows, hazards 7 & 56 absent from the timeline, plus a zero-length window and a
     * timeline id with no matching hazard.
     *
     * @return array<string, mixed>
     */
    private function simOneFixture(): array
    {
        return [
            'simulators' => [[
                'section' => 'Defensive Driving Hazard Simulators',
                'title' => 'AL Defensive Driving Hazard Simulator 1',
                'url' => 'https://driving-tests.org/defensive-driving-hazard-simulator-1/',
                'vimeo_id' => '475031029',
                'vimeo_embed_url' => 'https://player.vimeo.com/video/475031029',
                'sim_id' => 2858,
                'page_id' => 25276,
                'test_level' => 'Hard',
                'test_length' => '2:15 min',
                'test_location' => 'Los Angeles, CA',
                'test_number' => '1',
                'hazard_count' => 9,
                'demo_hazard_count' => 3,
                'hazards' => [
                    ['id' => 5, 'type' => 'sign', 'group' => 1, 'time_start' => 7.239, 'time_end' => 11.994, 'frame_count' => 13, 'comment' => 'Pedestrian crossing.', 'audio_url' => 'https://x/2858-5.mp3', 'mode' => 'demo'],
                    ['id' => 7, 'type' => 'pedestrian', 'group' => 1, 'time_start' => 8.374, 'time_end' => 15.815, 'frame_count' => 19, 'comment' => 'Scooter.', 'audio_url' => 'https://x/2858-7.mp3', 'mode' => 'assessment'],
                    ['id' => 15, 'type' => 'pedestrian', 'group' => null, 'time_start' => 31.575, 'time_end' => 38.734, 'frame_count' => 13, 'comment' => 'Cyclist.', 'audio_url' => 'https://x/2858-15.mp3', 'mode' => 'demo'],
                    ['id' => 21, 'type' => 'sign', 'group' => null, 'time_start' => 35.116, 'time_end' => 42.257, 'frame_count' => 14, 'comment' => 'Stop sign.', 'audio_url' => 'https://x/2858-21.mp3', 'mode' => 'assessment'],
                    ['id' => 22, 'type' => 'vehicle', 'group' => null, 'time_start' => 35.156, 'time_end' => 41.944, 'frame_count' => 13, 'comment' => 'Left blinker.', 'audio_url' => 'https://x/2858-22.mp3', 'mode' => 'assessment'],
                    ['id' => 34, 'type' => 'vehicle', 'group' => null, 'time_start' => 57.438, 'time_end' => 61.878, 'frame_count' => 7, 'comment' => 'Entering lane.', 'audio_url' => 'https://x/2858-34.mp3', 'mode' => 'assessment'],
                    ['id' => 41, 'type' => 'vehicle', 'group' => null, 'time_start' => 78.544, 'time_end' => 86.105, 'frame_count' => 15, 'comment' => 'Parking.', 'audio_url' => 'https://x/2858-41.mp3', 'mode' => 'assessment'],
                    ['id' => 43, 'type' => 'sign', 'group' => null, 'time_start' => 87.914, 'time_end' => 95.147, 'frame_count' => 18, 'comment' => 'Stop sign.', 'audio_url' => 'https://x/2858-43.mp3', 'mode' => 'assessment'],
                    ['id' => 53, 'type' => 'pedestrian', 'group' => null, 'time_start' => 106.056, 'time_end' => 113.173, 'frame_count' => 15, 'comment' => 'Cyclist.', 'audio_url' => 'https://x/2858-53.mp3', 'mode' => 'assessment'],
                    // zero-length window — should warn but still import
                    ['id' => 54, 'type' => 'sign', 'group' => 6, 'time_start' => 111.181, 'time_end' => 111.181, 'frame_count' => 19, 'comment' => 'Ped crossing.', 'audio_url' => 'https://x/2858-54.mp3', 'mode' => 'assessment'],
                    ['id' => 56, 'type' => 'pedestrian', 'group' => 6, 'time_start' => 115.239, 'time_end' => 118.083, 'frame_count' => 9, 'comment' => 'Waiting to cross.', 'audio_url' => 'https://x/2858-56.mp3', 'mode' => 'assessment'],
                ],
                'timeline' => [
                    ['hazard_id' => 5, 'mode' => 'demo', 'group' => '1'],
                    ['hazard_id' => 15, 'mode' => 'demo', 'group' => null],
                    ['hazard_id' => 21, 'mode' => 'assessment', 'group' => null],
                    ['hazard_id' => 22, 'mode' => 'assessment', 'group' => null],
                    ['hazard_id' => 34, 'mode' => 'assessment', 'group' => null],
                    ['hazard_id' => 41, 'mode' => 'assessment', 'group' => null],
                    ['hazard_id' => 43, 'mode' => 'assessment', 'group' => null],
                    ['hazard_id' => 53, 'mode' => 'assessment', 'group' => null],
                    ['hazard_id' => 54, 'mode' => 'assessment', 'group' => '6'],
                    // references a hazard that isn't in hazards[]
                    ['hazard_id' => 999, 'mode' => 'assessment', 'group' => null],
                ],
            ]],
        ];
    }

    public function test_it_imports_the_simulator_its_full_hazard_pool_and_timeline_flags(): void
    {
        $summary = new ImportSummary;
        $this->import($this->simOneFixture(), $summary);

        $simulator = HazardSimulator::query()->where('sim_id', 2858)->firstOrFail();

        $this->assertNotNull($simulator->video);
        $this->assertSame('Defensive Driving Hazard Simulators', $simulator->video->section);
        $this->assertSame('475031029', $simulator->provider_video_id);
        $this->assertSame('Hard', $simulator->test_level);
        $this->assertNotEmpty($simulator->slug);

        // Whole pool imported: 11 hazards.
        $this->assertSame(11, $simulator->hazards()->count());

        // Scored total = timeline length (9), not the declared hazard_count.
        $this->assertSame(9, $simulator->hazard_count);
        $this->assertSame(9, $simulator->hazards()->where('in_timeline', true)->count());

        // demo_hazard_count reconciled to the 2 actual demo rows, not the declared 3.
        $this->assertSame(2, $simulator->demo_hazard_count);

        // Pool-only hazards (7 and 56) are stored but flagged out of the timeline.
        $this->assertFalse($simulator->hazards()->where('source_hazard_id', 7)->firstOrFail()->in_timeline);
        $this->assertFalse($simulator->hazards()->where('source_hazard_id', 56)->firstOrFail()->in_timeline);

        // Timeline order is captured.
        $ordered = $simulator->hazards()->where('in_timeline', true)->orderBy('sort_order')->pluck('source_hazard_id')->all();
        $this->assertSame([5, 15, 21, 22, 34, 41, 43, 53, 54], $ordered);

        // Type normalization + narration carried through.
        $sign = $simulator->hazards()->where('source_hazard_id', 5)->firstOrFail();
        $this->assertSame(HazardType::Sign, $sign->type);
        $this->assertSame('demo', $sign->mode);
        $this->assertSame('https://x/2858-5.mp3', $sign->audio_url);
    }

    public function test_it_logs_data_quality_warnings_without_failing(): void
    {
        $summary = new ImportSummary;
        $this->import($this->simOneFixture(), $summary);

        $warnings = implode("\n", $summary->warnings());

        $this->assertStringContainsString('demo_hazard_count (3) disagrees', $warnings);
        $this->assertStringContainsString('time_end', $warnings);           // zero-length window
        $this->assertStringContainsString('#999', $warnings);               // timeline id not in pool
        // The row still imported fully.
        $this->assertDatabaseCount('hazards', 11);
    }

    public function test_re_running_the_import_updates_in_place_without_duplicating(): void
    {
        $this->import($this->simOneFixture(), new ImportSummary);

        $mutated = $this->simOneFixture();
        $mutated['simulators'][0]['hazards'][3]['comment'] = 'EDITED stop sign copy';
        $this->import($mutated, new ImportSummary);

        $this->assertDatabaseCount('hazard_simulators', 1);
        $this->assertDatabaseCount('hazards', 11);
        $this->assertSame(
            'EDITED stop sign copy',
            HazardSimulator::query()->where('sim_id', 2858)->firstOrFail()
                ->hazards()->where('source_hazard_id', 21)->firstOrFail()->comment,
        );
    }

    public function test_skip_hazards_imports_the_video_but_not_the_interactive_layer(): void
    {
        $summary = new ImportSummary;
        $this->import($this->simOneFixture(), $summary, skipHazards: true);

        $this->assertDatabaseCount('videos', 1);
        $this->assertDatabaseCount('hazard_simulators', 0);
        $this->assertDatabaseCount('hazards', 0);
    }

    public function test_a_content_locked_simulator_is_left_untouched_by_a_re_import(): void
    {
        $this->import($this->simOneFixture(), new ImportSummary);

        $simulator = HazardSimulator::query()->where('sim_id', 2858)->firstOrFail();
        $simulator->update(['content_locked' => true, 'is_active' => false, 'scoring_profile' => 'standard']);
        $simulator->hazards()->where('source_hazard_id', 21)->update(['comment' => 'STAFF EDIT', 'time_end' => 99.5]);
        $staffHazard = $simulator->hazards()->create([
            'source_hazard_id' => null, 'type' => 'signal', 'mode' => 'assessment',
            'in_timeline' => true, 'sort_order' => 99, 'time_start' => 50, 'time_end' => 55, 'comment' => 'staff added',
        ]);

        $mutated = $this->simOneFixture();
        $mutated['simulators'][0]['hazards'][3]['comment'] = 'crawl would overwrite this';
        $mutated['simulators'][0]['test_level'] = 'Easy';

        $summary = new ImportSummary;
        $this->import($mutated, $summary);

        $this->assertStringContainsString('content locked by staff', implode("\n", $summary->warnings()));

        $simulator->refresh();
        $this->assertFalse($simulator->is_active);        // not reset to true
        $this->assertSame('Hard', $simulator->test_level); // not overwritten
        $this->assertSame('STAFF EDIT', $simulator->hazards()->where('source_hazard_id', 21)->firstOrFail()->comment);
        $this->assertDatabaseHas('hazards', ['id' => $staffHazard->id, 'comment' => 'staff added']);
    }

    public function test_staff_added_hazard_without_a_source_id_survives_an_unlocked_re_import(): void
    {
        $this->import($this->simOneFixture(), new ImportSummary);

        $simulator = HazardSimulator::query()->where('sim_id', 2858)->firstOrFail();
        $staffHazard = $simulator->hazards()->create([
            'source_hazard_id' => null, 'type' => 'signal', 'mode' => 'assessment',
            'in_timeline' => false, 'sort_order' => null, 'time_start' => 50, 'time_end' => 55, 'comment' => 'staff added',
        ]);

        $this->import($this->simOneFixture(), new ImportSummary); // still unlocked — crawl re-runs

        $this->assertDatabaseHas('hazards', ['id' => $staffHazard->id, 'comment' => 'staff added']);
    }
}
