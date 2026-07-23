<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $legal_name
 * @property string $commercial_name
 * @property string|null $tax_identifier
 * @property string|null $contact_email
 * @property string|null $contact_phone
 * @property string|null $logo_media_id
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory, HasUuidPrimary;

    protected $fillable = [
        'legal_name', 'commercial_name', 'tax_identifier',
        'contact_email', 'contact_phone', 'logo_media_id', 'status',
    ];

    /**
     * @return HasOne<CompanySetting>
     */
    public function settings(): HasOne
    {
        return $this->hasOne(CompanySetting::class, 'company_id');
    }

    /**
     * @return HasMany<User>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<Role>
     */
    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }
}
