<?php

declare(strict_types=1);

namespace App\Enums;

enum ReservationStatus: string
{
    case TemporarySelection = 'temporary_selection';
    case PendingPayment = 'pending_payment';
    case Paid = 'paid';
    case Expired = 'expired';
}
