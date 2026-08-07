<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Handbook;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreHandbookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'state_id' => ['required', 'integer', 'exists:states,id'],
            'vehicle_type_id' => ['required', 'integer', 'exists:vehicle_types,id'],
            'language' => ['required', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:255'],
            'source_url' => ['nullable', 'string', 'url', 'max:500'],
            'total_words' => ['nullable', 'integer', 'min:0'],
            'pdf' => ['nullable', 'file', 'mimes:pdf', 'max:51200'],
            'chapters' => ['required', 'array', 'min:1'],
            'chapters.*.title' => ['required', 'string', 'max:255'],
            'chapters.*.sections' => ['required', 'array', 'min:1'],
            'chapters.*.sections.*.heading' => ['nullable', 'string', 'max:255'],
            'chapters.*.sections.*.content' => ['required', 'string'],
        ];
    }

    /**
     * Ensures the same state+vehicle_type+language combination isn't created twice — matches the
     * DB unique constraint, surfaced as a validation error instead of a 500.
     */
    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $exists = Handbook::query()
                ->where('state_id', $this->integer('state_id'))
                ->where('vehicle_type_id', $this->integer('vehicle_type_id'))
                ->where('language', $this->string('language'))
                ->exists();

            if ($exists) {
                $validator->errors()->add('state_id', 'A handbook for this state, vehicle type, and language already exists.');
            }
        });
    }
}
