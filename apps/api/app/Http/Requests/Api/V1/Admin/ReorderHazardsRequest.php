<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\HazardSimulator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * `order` is the FULL, complete list of scored (in-timeline) hazard ids in their new sequence —
 * `sort_order` becomes each id's index. Only in-timeline hazards are ordered; pool-only hazards
 * keep a null sort_order and are never part of this list.
 */
class ReorderHazardsRequest extends FormRequest
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
        /** @var HazardSimulator $simulator */
        $simulator = $this->route('hazardSimulator');

        return [
            'order' => ['required', 'array', 'min:1'],
            'order.*' => [
                'integer',
                Rule::exists('hazards', 'id')
                    ->where('hazard_simulator_id', $simulator->id)
                    ->where('in_timeline', true),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var HazardSimulator $simulator */
            $simulator = $this->route('hazardSimulator');
            $order = $this->input('order', []);

            if (! is_array($order)) {
                return;
            }

            if (count($order) !== count(array_unique($order))) {
                $validator->errors()->add('order', __('Each hazard may appear only once in the order.'));
            }

            $expected = $simulator->hazards()->where('in_timeline', true)->count();
            if (count($order) !== $expected) {
                $validator->errors()->add(
                    'order',
                    __('You must include every scored hazard for this simulator (:expected total).', ['expected' => $expected]),
                );
            }
        });
    }
}
