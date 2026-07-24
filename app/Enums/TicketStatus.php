<?php

declare(strict_types=1);

namespace App\Enums;

enum TicketStatus: string
{
    case Active = 'active';
    case Exhausted = 'exhausted';
    case Voided = 'voided';
}
