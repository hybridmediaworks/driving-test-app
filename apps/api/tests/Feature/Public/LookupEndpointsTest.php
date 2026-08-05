<?php

namespace Tests\Feature\Public;

use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LookupEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_list_states(): void
    {
        State::factory()->create(['code' => 'CA', 'name' => 'California']);
        State::factory()->create(['code' => 'TX', 'name' => 'Texas']);

        $response = $this->getJson('/api/v1/states');

        $response->assertOk();
        $codes = collect($response->json('data'))->pluck('code');
        $this->assertTrue($codes->contains('CA'));
        $this->assertTrue($codes->contains('TX'));
    }

    public function test_guest_can_list_active_vehicle_types_only(): void
    {
        VehicleType::factory()->create(['name' => 'car', 'is_active' => true]);
        VehicleType::factory()->create(['name' => 'retired-type', 'is_active' => false]);

        $response = $this->getJson('/api/v1/vehicle-types');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name');
        $this->assertTrue($names->contains('car'));
        $this->assertFalse($names->contains('retired-type'));
    }

    public function test_guest_can_list_active_quiz_categories_only_in_display_order(): void
    {
        QuizCategory::factory()->create(['name' => 'second', 'title' => 'Second', 'order_no' => 1, 'is_active' => true]);
        QuizCategory::factory()->create(['name' => 'first', 'title' => 'First', 'order_no' => 0, 'is_active' => true]);
        QuizCategory::factory()->create(['name' => 'hidden', 'title' => 'Hidden', 'order_no' => 2, 'is_active' => false]);

        $response = $this->getJson('/api/v1/quiz-categories');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name');
        $this->assertEquals(['first', 'second'], $names->all());
    }
}
