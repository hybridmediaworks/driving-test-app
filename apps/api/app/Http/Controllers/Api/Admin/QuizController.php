<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuizRequest;
use App\Http\Requests\Admin\UpdateQuizRequest;
use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QuizController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Quiz::query()
            ->with(['category', 'quizType', 'state', 'vehicleType'])
            ->orderBy('order_no')
            ->orderBy('title');

        if ($request->filled('quiz_category_id')) {
            $query->where('quiz_category_id', $request->integer('quiz_category_id'));
        }

        if ($request->filled('quiz_type_id')) {
            $query->where('quiz_type_id', $request->integer('quiz_type_id'));
        }

        if ($request->filled('state_id')) {
            $query->where('state_id', $request->integer('state_id'));
        }

        if ($request->filled('vehicle_type_id')) {
            $query->where('vehicle_type_id', $request->integer('vehicle_type_id'));
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        return response()->json([
            'quizzes' => $query->paginate($perPage)->withQueryString(),
            'categories' => QuizCategory::query()->orderBy('order_no')->orderBy('title')->get(['id', 'name', 'title']),
            'quizTypes' => QuizType::query()->orderBy('title')->get(['id', 'name', 'title']),
            'states' => State::query()->orderBy('name')->get(['id', 'code', 'name']),
            'vehicleTypes' => VehicleType::query()->where('is_active', true)->orderBy('title')->get(['id', 'name', 'title']),
            'filters' => [
                'quiz_category_id' => $request->input('quiz_category_id'),
                'quiz_type_id' => $request->input('quiz_type_id'),
                'state_id' => $request->input('state_id'),
                'vehicle_type_id' => $request->input('vehicle_type_id'),
                'active_only' => $request->boolean('active_only'),
            ],
        ]);
    }

    public function store(StoreQuizRequest $request): JsonResponse
    {
        $data = $request->validated();
        unset($data['cover_image']);

        $slugInput = $data['slug'] ?? null;
        $data['slug'] = ($slugInput !== null && $slugInput !== '')
            ? Str::slug($slugInput)
            : Str::slug($data['title']);

        $slugBase = $data['slug'];
        $suffix = 1;
        while (Quiz::query()->where('slug', $data['slug'])->exists()) {
            $data['slug'] = $slugBase.'-'.$suffix;
            $suffix++;
        }

        $file = $request->file('cover_image');
        if ($file !== null && $file->isValid()) {
            $data['cover_image_path'] = $file->store('quiz-covers', 'public');
        }

        $quiz = Quiz::query()->create($data);

        return response()->json(['quiz' => $quiz], 201);
    }

    public function show(Quiz $quiz): JsonResponse
    {
        $quiz->loadCount('quizQuestions');
        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);

        return response()->json(['quiz' => $quiz]);
    }

    public function update(UpdateQuizRequest $request, Quiz $quiz): JsonResponse
    {
        $data = $request->validated();
        unset($data['cover_image'], $data['remove_cover_image']);

        $slugInput = $data['slug'] ?? null;
        $data['slug'] = ($slugInput !== null && $slugInput !== '')
            ? Str::slug($slugInput)
            : Str::slug($data['title']);

        $slugBase = $data['slug'];
        $suffix = 1;
        while (Quiz::query()->where('slug', $data['slug'])->where('id', '!=', $quiz->id)->exists()) {
            $data['slug'] = $slugBase.'-'.$suffix;
            $suffix++;
        }

        $newCover = $request->file('cover_image');
        if ($newCover !== null && $newCover->isValid()) {
            $this->deleteStoredQuizCover($quiz->cover_image_path);
            $data['cover_image_path'] = $newCover->store('quiz-covers', 'public');
        } elseif ($request->boolean('remove_cover_image')) {
            $this->deleteStoredQuizCover($quiz->cover_image_path);
            $data['cover_image_path'] = null;
        }

        $quiz->update($data);

        return response()->json(['quiz' => $quiz->fresh()]);
    }

    public function destroy(Quiz $quiz): JsonResponse
    {
        $quiz->delete();

        return response()->json(['message' => __('Quiz deleted.')]);
    }

    private function deleteStoredQuizCover(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        $path = str_replace('\\', '/', $path);
        Storage::disk('public')->delete($path);
    }
}
