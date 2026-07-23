<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['cash_session_id', 'movement_type', 'direction', 'amount', 'pos_sale_id', 'payment_attempt_id', 'description', 'created_by_user_id', 'authorized_by_user_id'])]
class CashMovement extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(CashSession::class, 'cash_session_id');
    }
}
