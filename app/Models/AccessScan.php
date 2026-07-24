<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['event_occurrence_id', 'ticket_id', 'scanner_user_id', 'qr_fingerprint', 'scan_result', 'consumed_quantity', 'quota_before', 'quota_after', 'device_identifier', 'ip_address', 'notes', 'scanned_at'])]
class AccessScan extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['scanned_at' => 'datetime'];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
