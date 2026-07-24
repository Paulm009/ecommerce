<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\NumberSequence;
use Illuminate\Support\Facades\DB;

final class GeneratesPublicNumbers
{
    public function next(string $companyId, string $sequenceType, string $prefix): string
    {
        return DB::transaction(function () use ($companyId, $sequenceType, $prefix): string {
            $year = (int) now()->format('Y');
            $sequence = NumberSequence::query()
                ->where('company_id', $companyId)
                ->where('sequence_type', $sequenceType)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if ($sequence === null) {
                NumberSequence::query()->create([
                    'company_id' => $companyId,
                    'sequence_type' => $sequenceType,
                    'year' => $year,
                    'current_value' => 0,
                ]);
            }

            NumberSequence::query()
                ->where('company_id', $companyId)
                ->where('sequence_type', $sequenceType)
                ->where('year', $year)
                ->increment('current_value');

            $currentValue = (int) NumberSequence::query()
                ->where('company_id', $companyId)
                ->where('sequence_type', $sequenceType)
                ->where('year', $year)
                ->value('current_value');

            return sprintf('%s-%d-%06d', $prefix, $year, $currentValue);
        }, 3);
    }
}
