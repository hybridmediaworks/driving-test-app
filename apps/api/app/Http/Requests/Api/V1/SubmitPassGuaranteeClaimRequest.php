<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class SubmitPassGuaranteeClaimRequest extends FormRequest
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
            'proof_notes' => ['nullable', 'string', 'max:5000'],
            'exam_date' => ['nullable', 'date'],
            'proof_files' => ['nullable', 'array', 'max:5'],
            'proof_files.*' => ['file', 'mimes:jpg,jpeg,png,gif,pdf', 'max:10240'],
        ];
    }
}
