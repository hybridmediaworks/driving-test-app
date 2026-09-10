<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\State;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin State */
class StateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'agency_name' => $this->agency_name,
            'dmv_website_url' => $this->dmv_website_url,
            'permit_test_fee_cents' => $this->permit_test_fee_cents,
            'retake_wait_days' => $this->retake_wait_days,
            'supervised_driving_hours' => $this->supervised_driving_hours,
            'minimum_permit_age' => $this->minimum_permit_age,
            'test_language_count' => $this->test_language_count,
            'online_testing_available' => $this->online_testing_available,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
