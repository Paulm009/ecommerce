<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['legal_document_id', 'customer_id', 'user_id', 'sale_id', 'accepted_at', 'ip_address', 'user_agent'])]
class LegalAcceptance extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['accepted_at' => 'datetime'];
    }
}
