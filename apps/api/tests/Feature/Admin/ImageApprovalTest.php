<?php

namespace Tests\Feature\Admin;

use App\Enums\ImageRegenerationStatus;
use App\Models\Quiz;
use App\Models\QuizImageRegeneration;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    /** Attach a real image file (on the faked public disk) to a question. */
    private function questionWithImage(string $sourceUrl): QuizQuestion
    {
        Storage::fake('public');
        $quiz = Quiz::factory()->create();
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        $question->addMedia(UploadedFile::fake()->image('orig.jpg', 1080, 420))
            ->withCustomProperties(['source_url' => $sourceUrl])
            ->toMediaCollection(QuizQuestion::MEDIA_COLLECTION_IMAGES);

        return $question;
    }

    public function test_guest_cannot_list_image_approvals(): void
    {
        $this->getJson('/api/v1/admin/image-approvals')->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_image_approvals(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/image-approvals')->assertForbidden();
    }

    public function test_index_defaults_to_awaiting_review(): void
    {
        QuizImageRegeneration::query()->create(['source_url' => 'a', 'status' => ImageRegenerationStatus::AwaitingReview]);
        QuizImageRegeneration::query()->create(['source_url' => 'b', 'status' => ImageRegenerationStatus::Pending]);
        QuizImageRegeneration::query()->create(['source_url' => 'c', 'status' => ImageRegenerationStatus::Approved]);

        $response = $this->actingAs($this->admin(), 'sanctum')->getJson('/api/v1/admin/image-approvals');

        $response->assertOk();
        $sources = collect($response->json('data'))->pluck('status');
        $this->assertEquals(['awaiting_review'], $sources->unique()->values()->all());
        $this->assertCount(1, $response->json('data'));
    }

    public function test_approve_backs_up_original_and_replaces_it_in_place(): void
    {
        Storage::fake('local');

        $question = $this->questionWithImage('https://src/image.jpg');
        $media = $question->getFirstMedia(QuizQuestion::MEDIA_COLLECTION_IMAGES);
        $originalBytes = file_get_contents($media->getPath());

        Storage::disk('local')->put('quiz-candidates/1/cand.jpg', 'REGENERATED-BYTES');
        $row = QuizImageRegeneration::query()->create([
            'source_url' => 'https://src/image.jpg',
            'representative_media_id' => $media->id,
            'usage_count' => 1,
            'status' => ImageRegenerationStatus::AwaitingReview,
            'candidate_disk' => 'local',
            'candidate_path' => 'quiz-candidates/1/cand.jpg',
        ]);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/image-approvals/{$row->id}/approve");

        $response->assertOk()->assertJsonPath('image_regeneration.status', 'approved');

        $row->refresh();
        $this->assertEquals(ImageRegenerationStatus::Approved, $row->status);
        $this->assertNotNull($row->backup_path);
        // Live file is now the candidate; the backup (on the media's disk) holds the original bytes.
        $this->assertSame('REGENERATED-BYTES', file_get_contents($media->getPath()));
        $this->assertSame($originalBytes, Storage::disk($media->disk)->get($row->backup_path));
        // Candidate staging is cleaned up after approval.
        $this->assertFalse(Storage::disk('local')->exists('quiz-candidates/1/cand.jpg'));
    }

    public function test_approve_rejects_a_row_not_awaiting_review(): void
    {
        $row = QuizImageRegeneration::query()->create(['source_url' => 'x', 'status' => ImageRegenerationStatus::Pending]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/image-approvals/{$row->id}/approve")
            ->assertStatus(422);
    }

    public function test_reject_marks_rejected(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('quiz-candidates/1/cand.jpg', 'X');
        $row = QuizImageRegeneration::query()->create([
            'source_url' => 'y',
            'status' => ImageRegenerationStatus::AwaitingReview,
            'candidate_disk' => 'local',
            'candidate_path' => 'quiz-candidates/1/cand.jpg',
        ]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/image-approvals/{$row->id}/reject")
            ->assertOk()
            ->assertJsonPath('image_regeneration.status', 'rejected');

        $this->assertEquals(ImageRegenerationStatus::Rejected, $row->refresh()->status);
    }

    public function test_discard_reverts_an_approved_image_to_the_original(): void
    {
        $question = $this->questionWithImage('https://src/rev.jpg');
        $media = $question->getFirstMedia(QuizQuestion::MEDIA_COLLECTION_IMAGES);
        $originalBytes = file_get_contents($media->getPath());

        // Simulate an approved row: original backed up on the media disk, live file overwritten.
        Storage::disk($media->disk)->put('quiz-image-backups/9/orig.jpg', $originalBytes);
        file_put_contents($media->getPath(), 'APPROVED-BYTES');
        $row = QuizImageRegeneration::query()->create([
            'source_url' => 'https://src/rev.jpg',
            'representative_media_id' => $media->id,
            'usage_count' => 1,
            'status' => ImageRegenerationStatus::Approved,
            'backup_path' => 'quiz-image-backups/9/orig.jpg',
        ]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/image-approvals/{$row->id}/discard")
            ->assertOk()
            ->assertJsonPath('image_regeneration.status', 'pending');

        // The live image is restored to the original and the row is reopened.
        $this->assertSame($originalBytes, file_get_contents($media->getPath()));
        $row->refresh();
        $this->assertEquals(ImageRegenerationStatus::Pending, $row->status);
        $this->assertNull($row->backup_path);
    }

    public function test_upload_stages_a_designer_image_as_candidate(): void
    {
        Storage::fake('local');
        $row = QuizImageRegeneration::query()->create([
            'source_url' => 'u',
            'status' => ImageRegenerationStatus::Pending,
        ]);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->post("/api/v1/admin/image-approvals/{$row->id}/upload", [
                'image' => UploadedFile::fake()->image('designer.jpg', 1200, 500),
            ]);

        $response->assertOk()->assertJsonPath('image_regeneration.status', 'awaiting_review');

        $row->refresh();
        $this->assertEquals(ImageRegenerationStatus::AwaitingReview, $row->status);
        $this->assertNotNull($row->candidate_path);
        $this->assertTrue(Storage::disk('local')->exists($row->candidate_path));
        $this->assertSame('Manual designer upload', $row->prompt);
    }

    public function test_upload_rejects_a_non_image(): void
    {
        $row = QuizImageRegeneration::query()->create(['source_url' => 'u2', 'status' => ImageRegenerationStatus::Pending]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/image-approvals/{$row->id}/upload", ['image' => 'not-a-file'])
            ->assertStatus(422);
    }

    public function test_candidate_route_streams_the_staged_image(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('quiz-candidates/1/cand.jpg', 'STREAMED-BYTES');
        $row = QuizImageRegeneration::query()->create([
            'source_url' => 'z',
            'status' => ImageRegenerationStatus::AwaitingReview,
            'candidate_disk' => 'local',
            'candidate_path' => 'quiz-candidates/1/cand.jpg',
        ]);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->get("/api/v1/admin/image-approvals/{$row->id}/candidate");

        $response->assertOk();
        $this->assertSame('STREAMED-BYTES', $response->streamedContent());
    }
}
