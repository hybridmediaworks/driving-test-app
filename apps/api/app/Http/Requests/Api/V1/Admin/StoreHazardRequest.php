<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Api\V1\Admin\Concerns\ValidatesHazard;
use Illuminate\Foundation\Http\FormRequest;

class StoreHazardRequest extends FormRequest
{
    use ValidatesHazard;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return $this->hazardRules('required');
    }
}
