<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\CashSessionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['cash_register_id', 'session_number', 'status', 'opened_by_user_id', 'opened_at', 'opening_amount', 'closed_by_user_id', 'closed_at', 'expected_amount', 'declared_amount', 'difference_amount', 'closing_notes'])]
class CashSession extends Model
{
    use HasUuidPrimary;

    protected $attributes = ['status' => 'open'];

    protected function casts(): array
    {
        return ['status' => CashSessionStatus::class, 'opened_at' => 'datetime', 'closed_at' => 'datetime', 'opening_amount' => 'decimal:2', 'expected_amount' => 'decimal:2', 'declared_amount' => 'decimal:2', 'difference_amount' => 'decimal:2'];
    }

    public function register(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class, 'cash_register_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(CashMovement::class);
    }

    public function posSales(): HasMany
    {
        return $this->hasMany(PosSale::class);
    }
}
