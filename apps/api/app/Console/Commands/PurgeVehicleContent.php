<?php

namespace App\Console\Commands;

use App\Models\Flashcard;
use App\Models\Handbook;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\VehicleType;
use Illuminate\Console\Command;

/**
 * Deletes every imported content row for one vehicle type, so a re-import starts from a clean slate.
 *
 * `content:import` is already idempotent — it updates quizzes in place and replaces their questions
 * — so this is only needed when the SOURCE changed shape and rows would otherwise be orphaned (e.g.
 * quizzes the crawl no longer lists, which an import can't know to remove).
 *
 * Deletes model-by-model rather than with a bulk query delete, so Spatie's deleting-model hooks fire
 * and the media files (question images, handbook PDFs) go with the rows instead of being orphaned on
 * disk. That makes it slow on a large vehicle — CDL is ~180k questions — so it reports progress.
 *
 *   php artisan content:purge-vehicle cdl --dry-run
 *   php artisan content:purge-vehicle cdl
 */
class PurgeVehicleContent extends Command
{
    protected $signature = 'content:purge-vehicle
        {vehicle-type : Vehicle type name (car, motorcycle, cdl)}
        {--force : Skip the confirmation prompt}
        {--with-attempts : Also delete learners\' attempts on these quizzes — destroys their history}
        {--dry-run : Report what would be deleted without deleting anything}';

    protected $description = 'Delete all imported quizzes, questions, flashcards and handbooks for one vehicle type.';

    public function handle(): int
    {
        $name = (string) $this->argument('vehicle-type');
        $vehicleType = VehicleType::query()->where('name', $name)->first();

        if ($vehicleType === null) {
            $this->error("Unknown vehicle type \"{$name}\". Known: ".VehicleType::query()->pluck('name')->implode(', '));

            return self::FAILURE;
        }

        $quizIds = Quiz::query()->where('vehicle_type_id', $vehicleType->id)->pluck('id');
        $counts = [
            'quizzes' => $quizIds->count(),
            'questions' => QuizQuestion::query()->whereIn('quiz_id', $quizIds)->count(),
            'flashcards' => Flashcard::query()->where('vehicle_type_id', $vehicleType->id)->count(),
            'handbooks' => Handbook::query()->where('vehicle_type_id', $vehicleType->id)->count(),
        ];

        $this->info("{$vehicleType->title} content to delete:");
        foreach ($counts as $label => $count) {
            $this->line('  '.str_pad($label, 12).number_format($count));
        }

        // Checked BEFORE anything is deleted: quiz_attempts holds a RESTRICT foreign key on
        // quizzes, so a single attempted quiz aborts the delete — and finding that out halfway
        // through leaves the questions gone and the quizzes behind, which is worse than not
        // starting. Re-importing is usually the right move instead: content:import updates quizzes
        // in place and replaces their questions without touching anyone's results.
        $attemptedQuizzes = Quiz::query()->whereIn('id', $quizIds)->whereHas('attempts')->count();
        $attempts = QuizAttempt::query()->whereIn('quiz_id', $quizIds)->count();

        if ($attemptedQuizzes > 0) {
            $this->newLine();
            $this->warn(number_format($attemptedQuizzes).' of these quizzes have learner attempts ('.number_format($attempts).' in total).');

            if (! $this->option('with-attempts')) {
                $this->error('Aborted — deleting them would fail on the quiz_attempts foreign key.');
                $this->line('  Re-run `content:import` instead (it replaces questions in place), or pass');
                $this->line('  --with-attempts to delete those results too. That cannot be undone.');

                return self::FAILURE;
            }

            $this->warn('--with-attempts given: those results will be deleted as well.');
        }

        if (array_sum($counts) === 0) {
            $this->info('Nothing to delete.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry run — nothing deleted.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm("Permanently delete all {$vehicleType->title} content?", false)) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        if ($this->option('with-attempts')) {
            QuizAttempt::query()->whereIn('quiz_id', $quizIds)->chunkById(500, fn ($rows) => $rows->each->delete());
            $this->info('Deleted '.number_format($attempts).' attempt(s).');
        }

        $bar = $this->output->createProgressBar($counts['questions']);
        $bar->start();
        QuizQuestion::query()->whereIn('quiz_id', $quizIds)->chunkById(200, function ($questions) use ($bar): void {
            $questions->each->delete();
            $bar->advance($questions->count());
        });
        $bar->finish();
        $this->newLine();

        Quiz::query()->whereIn('id', $quizIds)->chunkById(200, fn ($quizzes) => $quizzes->each->delete());
        Flashcard::query()->where('vehicle_type_id', $vehicleType->id)->chunkById(500, fn ($cards) => $cards->each->delete());
        Handbook::query()->where('vehicle_type_id', $vehicleType->id)->get()->each->delete();

        $this->info("Deleted all {$vehicleType->title} content.");

        return self::SUCCESS;
    }
}
