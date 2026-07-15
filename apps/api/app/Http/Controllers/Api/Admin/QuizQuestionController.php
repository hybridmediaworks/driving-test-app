<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MoveQuizQuestionRequest;
use App\Http\Requests\Admin\ReorderQuizQuestionsRequest;
use App\Http\Requests\Admin\StoreQuizQuestionRequest;
use App\Http\Requests\Admin\UpdateQuizQuestionRequest;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class QuizQuestionController extends Controller
{
    public function index(Request $request, Quiz $quiz): JsonResponse
    {
        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);

        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        return response()->json([
            'quiz' => $quiz,
            'questions' => $quiz->quizQuestions()
                ->with('answers')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->paginate($perPage)
                ->withQueryString(),
        ]);
    }

    public function store(StoreQuizQuestionRequest $request, Quiz $quiz): JsonResponse
    {
        $validated = $request->safe()->except(['images']);
        $answers = $validated['answers'];
        unset($validated['answers']);

        $validated['sort_order'] = (int) $quiz->quizQuestions()->count();
        $validated['images'] = $this->storeUploadedImages($request);

        $question = DB::transaction(function () use ($quiz, $validated, $answers): QuizQuestion {
            /** @var QuizQuestion $question */
            $question = $quiz->quizQuestions()->create($validated);

            foreach ($answers as $index => $row) {
                $question->answers()->create([
                    'answer_text' => $row['answer_text'],
                    'explanation' => blank($row['explanation'] ?? null)
                        ? null
                        : $row['explanation'],
                    'is_correct' => $row['is_correct'],
                    'sort_order' => $index,
                ]);
            }

            return $question;
        });

        $quiz->syncTotalQuestions();

        return response()->json(['question' => $question->load('answers')], 201);
    }

    public function show(Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);
        $question->load('answers');

        return response()->json(['quiz' => $quiz, 'question' => $question]);
    }

    public function update(UpdateQuizQuestionRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        $validated = $request->safe()->except(['images', 'keep_images']);
        $answers = $validated['answers'];
        unset($validated['answers']);

        $oldImages = $question->images ?? [];
        $keep = $this->decodeKeepImages($request->input('keep_images'), $oldImages);
        $newPaths = $this->storeUploadedImages($request);

        foreach (array_diff($oldImages, array_merge($keep, $newPaths)) as $removed) {
            Storage::disk('public')->delete($removed);
        }

        $validated['images'] = array_values(array_merge($keep, $newPaths));

        DB::transaction(function () use ($question, $validated, $answers): void {
            $question->update($validated);
            $question->answers()->delete();

            foreach ($answers as $index => $row) {
                $question->answers()->create([
                    'answer_text' => $row['answer_text'],
                    'explanation' => blank($row['explanation'] ?? null)
                        ? null
                        : $row['explanation'],
                    'is_correct' => $row['is_correct'],
                    'sort_order' => $index,
                ]);
            }
        });

        $quiz->syncTotalQuestions();

        return response()->json(['question' => $question->fresh()->load('answers')]);
    }

    public function destroy(Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        foreach ($question->images ?? [] as $path) {
            Storage::disk('public')->delete($path);
        }

        $question->delete();
        $quiz->syncTotalQuestions();

        return response()->json(['message' => __('Question deleted.')]);
    }

    public function reorder(ReorderQuizQuestionsRequest $request, Quiz $quiz): JsonResponse
    {
        $ids = $request->validated('order');

        DB::transaction(function () use ($quiz, $ids): void {
            foreach ($ids as $index => $id) {
                QuizQuestion::query()
                    ->where('quiz_id', $quiz->id)
                    ->whereKey($id)
                    ->update(['sort_order' => $index]);
            }
        });

        return response()->json(['message' => __('Question order updated.')]);
    }

    public function move(MoveQuizQuestionRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        $direction = $request->validated('direction');
        $orderedIds = $quiz->quizQuestions()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $idx = array_search($question->id, $orderedIds, true);
        if ($idx === false) {
            abort(404);
        }

        $swapIdx = $direction === 'up' ? $idx - 1 : $idx + 1;
        if ($swapIdx < 0 || $swapIdx >= count($orderedIds)) {
            return response()->json(['message' => __('Question order updated.')]);
        }

        $newOrder = $orderedIds;
        [$newOrder[$idx], $newOrder[$swapIdx]] = [$newOrder[$swapIdx], $newOrder[$idx]];

        DB::transaction(function () use ($quiz, $newOrder): void {
            foreach ($newOrder as $index => $id) {
                QuizQuestion::query()
                    ->where('quiz_id', $quiz->id)
                    ->whereKey($id)
                    ->update(['sort_order' => $index]);
            }
        });

        return response()->json(['message' => __('Question order updated.')]);
    }

    /**
     * @return list<string>
     */
    private function storeUploadedImages(Request $request): array
    {
        $paths = [];
        foreach ($request->file('images', []) as $file) {
            if ($file !== null && $file->isValid()) {
                $paths[] = $file->store('quiz-question-images', 'public');
            }
        }

        return $paths;
    }

    /**
     * @param  list<string>  $allowed
     * @return list<string>
     */
    private function decodeKeepImages(?string $json, array $allowed): array
    {
        if ($json === null || $json === '') {
            return [];
        }

        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            return [];
        }

        $decoded = array_values(array_filter($decoded, 'is_string'));

        return array_values(array_intersect($decoded, $allowed));
    }

    private function assertQuestionBelongsToQuiz(Quiz $quiz, QuizQuestion $question): void
    {
        if ($question->quiz_id !== $quiz->id) {
            abort(404);
        }
    }
}
