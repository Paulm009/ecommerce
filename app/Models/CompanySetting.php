<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $company_id
 * @property string $currency_code
 * @property string $timezone
 * @property int $temporary_selection_minutes
 * @property int $payment_reservation_minutes
 * @property string|null $sender_name
 * @property string|null $sender_email
 * @property string|null $support_email
 * @property string|null $support_phone
 * @property string|null $primary_color
 * @property string|null $secondary_color
 * @property array $settings_json
 * @property string|null $updated_by_user_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class CompanySetting extends Model
{
    public $incrementing = false;

    protected $primaryKey = 'company_id';

    protected $keyType = 'string';

    protected $fillable = [
        'company_id', 'currency_code', 'timezone', 'temporary_selection_minutes',
        'payment_reservation_minutes', 'sender_name', 'sender_email',
        'support_email', 'support_phone', 'primary_color', 'secondary_color',
        'settings_json', 'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'settings_json' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Company, CompanySetting>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
