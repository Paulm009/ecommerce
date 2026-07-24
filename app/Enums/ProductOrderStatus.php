<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductOrderStatus: string
{
    case PendingPayment = 'pending_payment';
    case Paid = 'paid';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}
