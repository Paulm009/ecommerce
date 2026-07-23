<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['ticket_id', 'previous_status', 'new_status', 'reason', 'performed_by_user_id'])]
class TicketStatusHistory extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;
}
