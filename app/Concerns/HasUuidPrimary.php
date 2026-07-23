<?php

declare(strict_types=1);

namespace App\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * Trait for models that use UUID v7 as primary key.
 */
trait HasUuidPrimary
{
    use HasUuids;

    /**
     * Get the columns that should receive a unique identifier.
     *
     * @return array<int, string>
     */
    public function uniqueIds(): array
    {
        return ['id'];
    }
}
