<?php

declare(strict_types=1);

namespace App\Support;

final class TicketQrToken
{
    public function for(string $ticketId): string
    {
        $signature = hash_hmac('sha256', $ticketId, (string) config('app.key'));

        return $ticketId.'.'.$signature;
    }

    public function ticketId(string $token): ?string
    {
        [$ticketId, $signature] = array_pad(explode('.', $token, 2), 2, null);

        if ($ticketId === null || $signature === null || ! hash_equals($this->for($ticketId), $token)) {
            return null;
        }

        return $ticketId;
    }
}
