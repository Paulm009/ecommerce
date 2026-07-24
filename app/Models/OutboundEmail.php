<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'template_code', 'recipient_email', 'recipient_name', 'subject', 'related_type', 'related_id', 'status', 'provider_message_id', 'attempts', 'last_error', 'queued_at', 'sent_at'])]
class OutboundEmail extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['queued_at' => 'datetime', 'sent_at' => 'datetime'];
    }
}
