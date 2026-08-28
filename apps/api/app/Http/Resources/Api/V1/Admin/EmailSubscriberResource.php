<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\EmailSubscriber;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin EmailSubscriber */
class EmailSubscriberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'state' => $this->state,
            'vehicle_type' => $this->vehicle_type,
            'source' => $this->source,
            'last_sent_at' => $this->last_sent_at,
            'is_subscribed' => $this->unsubscribed_at === null,
            'unsubscribed_at' => $this->unsubscribed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
