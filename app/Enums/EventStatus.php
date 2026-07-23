<?php

declare(strict_types=1);

namespace App\Enums;

enum EventStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Finished = 'finished';
    case Cancelled = 'cancelled';
}
