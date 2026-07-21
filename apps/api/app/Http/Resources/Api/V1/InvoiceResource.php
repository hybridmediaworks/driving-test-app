<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Laravel\Cashier\Invoice;

/** @mixin Invoice */
class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date()->toIso8601String(),
            'total' => $this->total(),
            'status' => $this->status,
            'hosted_invoice_url' => $this->hosted_invoice_url,
            'invoice_pdf' => $this->invoice_pdf,
        ];
    }
}
