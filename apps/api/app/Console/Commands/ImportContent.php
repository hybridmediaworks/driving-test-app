<?php

namespace App\Console\Commands;

use App\Actions\Content\ImportExtraSupportFromCrawl;
use App\Actions\Content\ImportHandbookFromCrawl;
use App\Actions\Content\ImportQuizzesFromCrawl;
use App\Actions\Content\ImportSimulatorsFromCrawl;
use App\Actions\Content\ImportVideosFromCrawl;
use App\Models\State;
use App\Models\VehicleType;
use App\Support\ImportSummary;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

/**
 * Imports the real crawled dataset (see docs/PHASE_3_CONTENT_PLATFORM.md "Ingestion pipeline")
 * from `<root>/<state>/<VehicleType>/<TestType>/...` into quizzes/handbooks/cheat-sheets/videos.
 *
 * php artisan content:import "D:\Files&images\driving test" --dry-run
 * php artisan content:import "D:\Files&images\driving test" --state=alabama,alaska
 */
class ImportContent extends Command
{
    protected $signature = 'content:import
        {path : Root folder containing one subfolder per state}
        {--state= : Comma-separated state folder names to import (default: all found)}
        {--vehicle-type=car,motorcycle : Comma-separated vehicle types to import}
        {--only= : Comma-separated content types to import (questions,handbook,extra-support,videos,simulators — default: all)}
        {--skip-hazards : With simulators, import only the flat video and leave the interactive hazard layer untouched}
        {--dry-run : Report what would be imported without writing anything}';

    /** Set once from --skip-hazards; read in importTestTrack when handing off to the simulator importer. */
    private bool $skipHazards = false;

    protected $description = 'Import the real crawled state/vehicle/test-track content dataset.';

    /** Vehicle-type slug -> real folder name on disk. */
    private const VEHICLE_FOLDERS = [
        'car' => 'Car',
        'motorcycle' => 'Motorcycle',
        'cdl' => 'CDL',
    ];

    /** test_track slug -> real folder name on disk. */
    private const TEST_TRACK_FOLDERS = [
        'permit_test' => 'Permit Test',
        'driving_test' => 'Driving Test',
    ];

    /**
     * Folder names that don't reduce to their state name by just swapping hyphens for spaces
     * (the crawler dropped "of" from "district-columbia").
     */
    private const STATE_FOLDER_ALIASES = [
        'district-columbia' => 'DC',
    ];

    public function handle(
        ImportQuizzesFromCrawl $importQuizzes,
        ImportHandbookFromCrawl $importHandbook,
        ImportExtraSupportFromCrawl $importExtraSupport,
        ImportVideosFromCrawl $importVideos,
        ImportSimulatorsFromCrawl $importSimulators,
    ): int {
        $root = rtrim((string) $this->argument('path'), '\\/');
        if (! File::isDirectory($root)) {
            $this->error("Not a directory: {$root}");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $this->skipHazards = (bool) $this->option('skip-hazards');
        $only = $this->csvOption('only');
        $wantedStates = $this->csvOption('state');
        $vehicleSlugs = $this->csvOption('vehicle-type') ?: ['car', 'motorcycle'];

        if (in_array('cdl', $vehicleSlugs, true)) {
            $this->warn('CDL is deferred per docs/PHASE_3_CONTENT_PLATFORM.md — importing it anyway since you asked explicitly.');
        }

        $summary = new ImportSummary;

        $stateFolders = collect(File::directories($root))
            ->when($wantedStates !== [], fn ($dirs) => $dirs->filter(
                fn ($dir) => in_array(Str::lower(basename($dir)), array_map(Str::lower(...), $wantedStates), true),
            ));

        if ($stateFolders->isEmpty()) {
            $this->error('No matching state folders found under '.$root);

            return self::FAILURE;
        }

        foreach ($stateFolders as $stateFolder) {
            $this->importState(
                $stateFolder,
                $vehicleSlugs,
                $only,
                $summary,
                $dryRun,
                $importQuizzes,
                $importHandbook,
                $importExtraSupport,
                $importVideos,
                $importSimulators,
            );
        }

        $this->report($summary, $dryRun);

        return self::SUCCESS;
    }

    /**
     * @param  list<string>  $vehicleSlugs
     * @param  list<string>  $only
     */
    private function importState(
        string $stateFolder,
        array $vehicleSlugs,
        array $only,
        ImportSummary $summary,
        bool $dryRun,
        ImportQuizzesFromCrawl $importQuizzes,
        ImportHandbookFromCrawl $importHandbook,
        ImportExtraSupportFromCrawl $importExtraSupport,
        ImportVideosFromCrawl $importVideos,
        ImportSimulatorsFromCrawl $importSimulators,
    ): void {
        $stateFolderName = basename($stateFolder);
        $stateFolderKey = Str::lower($stateFolderName);

        $state = array_key_exists($stateFolderKey, self::STATE_FOLDER_ALIASES)
            ? State::query()->where('code', self::STATE_FOLDER_ALIASES[$stateFolderKey])->first()
            : State::query()->whereRaw('LOWER(name) = ?', [str_replace('-', ' ', $stateFolderKey)])->first();

        if ($state === null) {
            $summary->warn("No matching state row for folder \"{$stateFolderName}\" — skipped.");

            return;
        }

        $this->info("== {$state->name} ==");

        foreach ($vehicleSlugs as $vehicleSlug) {
            $vehicleFolderName = self::VEHICLE_FOLDERS[$vehicleSlug] ?? null;
            $vehicleType = $vehicleFolderName !== null ? VehicleType::query()->where('name', $vehicleSlug)->first() : null;

            if ($vehicleFolderName === null || $vehicleType === null) {
                $summary->warn("Unknown vehicle type \"{$vehicleSlug}\" — skipped.");

                continue;
            }

            $vehicleFolder = $stateFolder.DIRECTORY_SEPARATOR.$vehicleFolderName;
            if (! File::isDirectory($vehicleFolder)) {
                continue;
            }

            $this->line("  -- {$vehicleType->title} --");

            foreach (self::TEST_TRACK_FOLDERS as $testTrack => $testTrackFolderName) {
                $testTrackFolder = $vehicleFolder.DIRECTORY_SEPARATOR.$testTrackFolderName;
                if (! File::isDirectory($testTrackFolder)) {
                    continue;
                }

                $this->importTestTrack(
                    $testTrackFolder,
                    $state,
                    $vehicleType,
                    $testTrack,
                    $testTrackFolderName === 'Permit Test',
                    $only,
                    $summary,
                    $dryRun,
                    $importQuizzes,
                    $importHandbook,
                    $importExtraSupport,
                    $importVideos,
                    $importSimulators,
                );
            }
        }
    }

    /**
     * @param  list<string>  $only
     */
    private function importTestTrack(
        string $testTrackFolder,
        State $state,
        VehicleType $vehicleType,
        string $testTrack,
        bool $isPermitTest,
        array $only,
        ImportSummary $summary,
        bool $dryRun,
        ImportQuizzesFromCrawl $importQuizzes,
        ImportHandbookFromCrawl $importHandbook,
        ImportExtraSupportFromCrawl $importExtraSupport,
        ImportVideosFromCrawl $importVideos,
        ImportSimulatorsFromCrawl $importSimulators,
    ): void {
        $wants = fn (string $type) => $only === [] || in_array($type, $only, true);
        $label = "{$state->name}/{$vehicleType->title}/{$testTrack}";

        if ($wants('questions')) {
            $questionsPath = $testTrackFolder.DIRECTORY_SEPARATOR.'questions.json';
            if ($data = $this->readJson($questionsPath, $summary)) {
                $this->line("     questions.json ({$label})");
                $importQuizzes($data, $state, $vehicleType, $testTrack, $summary, $dryRun);
            }
        }

        if ($isPermitTest) {
            if ($wants('handbook')) {
                $handbookDir = $testTrackFolder.DIRECTORY_SEPARATOR.'handbook';
                $handbookJsonPath = $handbookDir.DIRECTORY_SEPARATOR.'handbook.json';
                if (File::isDirectory($handbookDir) && ($data = $this->readJson($handbookJsonPath, $summary))) {
                    $pdfPath = collect(File::glob($handbookDir.DIRECTORY_SEPARATOR.'*.pdf'))->first();
                    $this->line("     handbook.json ({$label})");
                    $importHandbook($data, $pdfPath, $state, $vehicleType, $summary, $dryRun);
                }
            }

            if ($wants('extra-support')) {
                $extraSupportDir = $testTrackFolder.DIRECTORY_SEPARATOR.'extra_support';
                if (File::isDirectory($extraSupportDir)) {
                    $indexPath = collect(File::glob($extraSupportDir.DIRECTORY_SEPARATOR.'*'.DIRECTORY_SEPARATOR.'index.json'))->first();
                    if ($indexPath !== null && ($data = $this->readJson($indexPath, $summary))) {
                        $this->line("     extra_support/index.json ({$label})");
                        $importExtraSupport($data, dirname($indexPath), $state, $vehicleType, $summary, $dryRun);
                    }
                }
            }
        } else {
            if ($wants('videos')) {
                $videosPath = $testTrackFolder.DIRECTORY_SEPARATOR.'videos.json';
                if (File::exists($videosPath) && ($data = $this->readJson($videosPath, $summary))) {
                    $this->line("     videos.json ({$label})");
                    $importVideos($data, $state, $vehicleType, $testTrack, $summary, $dryRun);
                }
            }

            if ($wants('simulators')) {
                $simulatorsPath = $testTrackFolder.DIRECTORY_SEPARATOR.'simulators.json';
                if (File::exists($simulatorsPath) && ($data = $this->readJson($simulatorsPath, $summary))) {
                    $this->line("     simulators.json ({$label})");
                    $importSimulators($data, $state, $vehicleType, $testTrack, $summary, $dryRun, $this->skipHazards);
                }
            }
        }
    }

    private function readJson(string $path, ImportSummary $summary): ?array
    {
        if (! File::exists($path)) {
            return null;
        }

        try {
            $decoded = json_decode(File::get($path), true, 512, JSON_THROW_ON_ERROR);

            return is_array($decoded) ? $decoded : null;
        } catch (Throwable $e) {
            $summary->warn("Failed to parse {$path}: {$e->getMessage()}");

            return null;
        }
    }

    /**
     * @return list<string>
     */
    private function csvOption(string $name): array
    {
        $value = $this->option($name);
        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }

    private function report(ImportSummary $summary, bool $dryRun): void
    {
        $this->newLine();
        $this->info($dryRun ? '=== Dry run summary ===' : '=== Import summary ===');

        $counts = $summary->counts();
        ksort($counts);
        foreach ($counts as $key => $count) {
            $this->line("  {$key}: {$count}");
        }

        $warnings = $summary->warnings();
        if ($warnings !== []) {
            $this->newLine();
            $this->warn(count($warnings).' warning(s):');
            foreach ($warnings as $warning) {
                $this->line("  - {$warning}");
            }
        }
    }
}
