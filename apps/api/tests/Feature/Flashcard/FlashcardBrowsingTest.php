<?php

namespace Tests\Feature\Flashcard;

use App\Models\Flashcard;
use App\Models\Plan;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AuthenticatesWithBearerToken;
use Tests\TestCase;

class FlashcardBrowsingTest extends TestCase
{
    use RefreshDatabase;
    use AuthenticatesWithBearerToken;

    private function makeActiveSubscriber(): User
    {
        Plan::query()->firstOrCreate(
            ['key' => 'monthly'],
            ['name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'stripe_price_id' => 'price_monthly_flashcard_test'],
        );

        $user = User::factory()->create(['is_admin' => false]);

        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => 'price_monthly_flashcard_test',
            'quantity' => 1,
        ]);

        return $user;
    }

    public function test_guest_sees_front_text_but_not_back_text_for_a_premium_card(): void
    {
        $card = Flashcard::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->getJson('/api/v1/flashcards');

        $response->assertOk();
        $response->assertJsonPath('data.0.id', $card->id);
        $response->assertJsonPath('data.0.front_text', $card->front_text);
        $response->assertJsonPath('data.0.back_text', null);
        $response->assertJsonPath('data.0.image_url', null);
        $response->assertJsonPath('data.0.locked', true);
    }

    public function test_guest_sees_back_text_for_a_free_card(): void
    {
        $card = Flashcard::factory()->create(['is_premium' => false, 'is_active' => true]);

        $response = $this->getJson('/api/v1/flashcards');

        $response->assertOk();
        $response->assertJsonPath('data.0.back_text', $card->back_text);
        $response->assertJsonPath('data.0.locked', false);
    }

    public function test_admin_sees_back_text_for_a_premium_card(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $card = Flashcard::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->withUserToken($admin)->getJson('/api/v1/flashcards');

        $response->assertOk();
        $response->assertJsonPath('data.0.back_text', $card->back_text);
        $response->assertJsonPath('data.0.locked', false);
    }

    public function test_active_subscriber_sees_back_text_for_a_premium_card(): void
    {
        $subscriber = $this->makeActiveSubscriber();
        $card = Flashcard::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->withUserToken($subscriber)->getJson('/api/v1/flashcards');

        $response->assertOk();
        $response->assertJsonPath('data.0.back_text', $card->back_text);
        $response->assertJsonPath('data.0.locked', false);
    }

    public function test_inactive_cards_are_excluded_from_the_public_index(): void
    {
        Flashcard::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/flashcards');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_filtering_by_state_includes_universal_cards_with_a_null_state(): void
    {
        $california = State::factory()->create(['code' => 'CA']);
        $texas = State::factory()->create(['code' => 'TX']);

        $universal = Flashcard::factory()->create(['state_id' => null, 'is_active' => true]);
        $caOnly = Flashcard::factory()->create(['state_id' => $california->id, 'is_active' => true]);
        $txOnly = Flashcard::factory()->create(['state_id' => $texas->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/flashcards?state=CA');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($universal->id));
        $this->assertTrue($ids->contains($caOnly->id));
        $this->assertFalse($ids->contains($txOnly->id));
    }

    public function test_filtering_by_category_narrows_results(): void
    {
        $roadSigns = QuizCategory::factory()->create(['name' => 'road-signs']);
        $trafficLaws = QuizCategory::factory()->create(['name' => 'traffic-laws']);

        $signCard = Flashcard::factory()->create(['quiz_category_id' => $roadSigns->id, 'is_active' => true]);
        Flashcard::factory()->create(['quiz_category_id' => $trafficLaws->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/flashcards?category=road-signs');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEqualsCanonicalizing([$signCard->id], $ids->all());
    }

    public function test_study_endpoint_returns_an_unpaginated_set_with_the_same_locking_rules(): void
    {
        Flashcard::factory()->count(3)->create(['is_premium' => false, 'is_active' => true]);
        Flashcard::factory()->create(['is_premium' => true, 'is_active' => true]);
        Flashcard::factory()->create(['is_active' => false]); // excluded

        $response = $this->getJson('/api/v1/flashcards/study');

        $response->assertOk();
        $cards = $response->json('data');
        $this->assertCount(4, $cards);
        $lockedCount = collect($cards)->where('locked', true)->count();
        $this->assertSame(1, $lockedCount);
        // Not the standard PaginatedResponse envelope — just {data: [...]}.
        $response->assertJsonMissingPath('meta');
    }
}
