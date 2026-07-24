<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Company;

final class CurrentCompany
{
    public function get(): Company
    {
        return once(fn (): Company => Company::query()->where('status', 'active')->oldest()->firstOrFail());
    }
}
