<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['payment_incident_id', 'action_type', 'notes', 'performed_by_user_id', 'metadata_json'])]
class PaymentIncidentAction extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['metadata_json' => 'array'];
    }
}
