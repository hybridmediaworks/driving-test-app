<?php

namespace App\Actions\Quiz;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CreateQuizQuestion
{
    public function __construct(
        private readonly SyncQuizQuestionAnswers $syncAnswers,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array{answer_text: string, explanation?: string|null, is_correct: bool}>  $answers
     * @param  list<UploadedFile>  $images
     */
    public function __invoke(Quiz $quiz, array $data, array $answers, array $images = []): QuizQuestion
    {
        $data['sort_order'] = $quiz->quizQuestions()->count();

        $question = DB::transaction(function () use ($quiz, $data, $answers, $images): QuizQuestion {
            /** @var QuizQuestion $question */
            $question = $quiz->quizQuestions()->create($data);

            foreach ($images as $image) {
                $question->addMedia($image)->toMediaCollection(QuizQuestion::MEDIA_COLLECTION_IMAGES);
            }

            ($this->syncAnswers)($question, $answers);

            return $question;
        });

        $quiz->syncTotalQuestions();

        return $question->load(['answers', 'media']);
    }
}
