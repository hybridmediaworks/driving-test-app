<?php

namespace Tests\Feature;

use App\Models\Expert;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExpertTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_public_index_returns_published_experts_in_sort_order(): void
    {
        Expert::factory()->create(['name' => 'Second', 'slug' => 'second', 'sort_order' => 2]);
        Expert::factory()->create(['name' => 'First', 'slug' => 'first', 'sort_order' => 1]);
        Expert::factory()->unpublished()->create(['name' => 'Hidden', 'slug' => 'hidden', 'sort_order' => 0]);

        $response = $this->getJson('/api/v1/experts');

        $response->assertOk();
        $response->assertJsonCount(2, 'experts');
        $this->assertSame(['first', 'second'], collect($response->json('experts'))->pluck('slug')->all());
        // Summary shape only — no bio/sections on the list endpoint.
        $response->assertJsonMissingPath('experts.0.sections');
        $response->assertJsonPath('experts.0.verified_at', fn ($v) => is_string($v) && strlen($v) === 10);
    }

    public function test_public_show_returns_the_full_profile(): void
    {
        Expert::factory()->create([
            'slug' => 'marcus-reyes',
            'name' => 'Marcus Reyes',
            'title' => 'Lead DMV Content Reviewer',
            'intro' => 'Oversees editorial accuracy.',
            'sections' => [
                ['heading' => 'Education', 'body' => 'M.S., somewhere'],
                ['heading' => 'Methodology', 'body' => 'Checks every source.'],
            ],
            'verified_at' => '2026-08-01',
        ]);

        $response = $this->getJson('/api/v1/experts/marcus-reyes');

        $response->assertOk();
        $response->assertJsonPath('expert.name', 'Marcus Reyes');
        $response->assertJsonPath('expert.intro', 'Oversees editorial accuracy.');
        $response->assertJsonPath('expert.sections.0.heading', 'Education');
        $response->assertJsonPath('expert.sections.1.body', 'Checks every source.');
        $response->assertJsonPath('expert.verified_at', '2026-08-01');
        $response->assertJsonPath('expert.photo_url', null);
    }

    public function test_public_show_404s_for_an_unpublished_expert(): void
    {
        Expert::factory()->unpublished()->create(['slug' => 'draft']);

        $this->getJson('/api/v1/experts/draft')->assertNotFound();
    }

    public function test_public_show_404s_for_an_unknown_slug(): void
    {
        $this->getJson('/api/v1/experts/nobody')->assertNotFound();
    }

    public function test_guest_cannot_list_experts_in_admin(): void
    {
        $this->getJson('/api/v1/admin/experts')->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_experts_in_admin(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/experts')->assertForbidden();
    }

    public function test_admin_can_create_an_expert_and_the_slug_is_derived_from_the_name(): void
    {
        $response = $this->actingAs($this->admin(), 'sanctum')->postJson('/api/v1/admin/experts', [
            'name' => 'Dana Whitfield',
            'title' => 'Head of Learning Experience',
            'verified_at' => '2026-08-28',
            'sections' => [
                ['heading' => 'Approach', 'body' => 'Format matches the real exam.'],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('expert.slug', 'dana-whitfield');
        $response->assertJsonPath('expert.sections.0.heading', 'Approach');
        $this->assertDatabaseHas('experts', ['slug' => 'dana-whitfield', 'name' => 'Dana Whitfield']);

        $this->getJson('/api/v1/experts/dana-whitfield')->assertOk()->assertJsonPath('expert.name', 'Dana Whitfield');
    }

    public function test_create_de_duplicates_a_derived_slug(): void
    {
        Expert::factory()->create(['slug' => 'dana-whitfield']);

        $response = $this->actingAs($this->admin(), 'sanctum')->postJson('/api/v1/admin/experts', [
            'name' => 'Dana Whitfield',
            'title' => 'Reviewer',
            'verified_at' => '2026-08-28',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('expert.slug', 'dana-whitfield-1');
    }

    public function test_create_validates_required_fields_and_section_shape(): void
    {
        $response = $this->actingAs($this->admin(), 'sanctum')->postJson('/api/v1/admin/experts', [
            'sections' => [['heading' => 'No body here']],
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name', 'title', 'verified_at', 'sections.0.body']);
    }

    public function test_admin_can_update_an_expert_and_the_public_endpoint_reflects_it(): void
    {
        $expert = Expert::factory()->create(['slug' => 'marcus-reyes', 'name' => 'Marcus Reyes', 'title' => 'Reviewer']);

        $response = $this->actingAs($this->admin(), 'sanctum')->putJson("/api/v1/admin/experts/{$expert->id}", [
            'name' => 'Marcus Reyes',
            'title' => 'Principal DMV Content Reviewer',
            'verified_at' => '2026-08-28',
            'sections' => [['heading' => 'Editorial policy', 'body' => 'Independent of any DMV.']],
        ]);

        $response->assertOk();
        $response->assertJsonPath('expert.title', 'Principal DMV Content Reviewer');
        // Slug is untouched on update unless explicitly changed — inbound links must not break.
        $response->assertJsonPath('expert.slug', 'marcus-reyes');

        $this->getJson('/api/v1/experts/marcus-reyes')
            ->assertOk()
            ->assertJsonPath('expert.title', 'Principal DMV Content Reviewer')
            ->assertJsonPath('expert.sections.0.body', 'Independent of any DMV.');
    }

    public function test_admin_can_upload_and_remove_a_photo(): void
    {
        Storage::fake('public');
        $expert = Expert::factory()->create();

        $upload = $this->actingAs($this->admin(), 'sanctum')->post("/api/v1/admin/experts/{$expert->id}", [
            '_method' => 'PUT',
            'name' => $expert->name,
            'title' => $expert->title,
            'verified_at' => '2026-08-28',
            'photo' => UploadedFile::fake()->image('expert.jpg', 300, 300),
        ]);

        $upload->assertOk();
        $this->assertNotNull($upload->json('expert.photo_url'));
        $this->getJson("/api/v1/experts/{$expert->slug}")->assertJsonPath('expert.photo_url', $upload->json('expert.photo_url'));

        $removed = $this->actingAs($this->admin(), 'sanctum')->post("/api/v1/admin/experts/{$expert->id}", [
            '_method' => 'PUT',
            'name' => $expert->name,
            'title' => $expert->title,
            'verified_at' => '2026-08-28',
            'remove_photo' => true,
        ]);

        $removed->assertOk();
        $removed->assertJsonPath('expert.photo_url', null);
    }

    public function test_admin_can_delete_an_expert(): void
    {
        $expert = Expert::factory()->create();

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson("/api/v1/admin/experts/{$expert->id}")
            ->assertOk();

        $this->assertDatabaseMissing('experts', ['id' => $expert->id]);
    }
}
