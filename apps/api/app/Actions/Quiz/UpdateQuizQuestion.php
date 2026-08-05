<?php

namespace App\Actions\Quiz;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class UpdateQuizQuestion
{
    public function __construct(
        private readonly SyncQuizQuestionAnswers $syncAnswers,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array{answer_text: string, explanation?: string|null, is_correct: bool}>  $answers
     * @param  list<UploadedFile>  $newImages
     * @param  list<int>  $keepMediaIds  Existing media IDs to retain; anything else attached is removed.
     */
    public function __invoke(Quiz $quiz, QuizQuestion $question, array $data, array $answers, array $newImages, array $keepMediaIds): QuizQuestion
    {
        DB::transaction(function () use ($question, $data, $answers, $newImages, $keepMediaIds): void {
            $question->update($data);

            $question->media()
                ->whereNotIn('id', $keepMediaIds)
                ->get()
                ->each(fn ($media) => $media->delete());

            foreach ($newImages as $image) {
                $question->addMedia($image)->toMediaCollection(QuizQuestion::MEDIA_COLLECTION_IMAGES);
            }

            ($this->syncAnswers)($question, $answers);
        });

        $quiz->syncTotalQuestions();

        return $question->fresh(['answers', 'media']);
    }
}
