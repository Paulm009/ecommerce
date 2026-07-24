<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'sequence_type', 'year', 'current_value'])]
class NumberSequence extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;
}
