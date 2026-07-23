<?php

declare(strict_types=1);

namespace App\Actions\Tickets;

use App\Enums\TicketStatus;
use App\Models\AccessScan;
use App\Models\EventOccurrence;
use App\Models\Ticket;
use App\Models\User;
use App\Support\TicketQrToken;
use Illuminate\Support\Facades\DB;

final class ScanTicket
{
    public function __construct(private TicketQrToken $qrTokens) {}

    /** @return array{result: string, consumed: int, remaining: int|null, ticket: Ticket|null} */
    public function handle(EventOccurrence $occurrence, string $token, User $scanner): array
    {
        return DB::transaction(function () use ($occurrence, $token, $scanner): array {
            $ticketId = $this->qrTokens->ticketId($token);
            $isManualCode = $ticketId === null;
            $ticket = $isManualCode
                ? Ticket::query()->where('public_code', mb_strtoupper(trim($token)))->lockForUpdate()->first()
                : Ticket::query()->lockForUpdate()->find($ticketId);
            $result = 'invalid';
            $consumed = 0;
            $remaining = null;

            if (! $isManualCode && $ticket !== null && ! hash_equals($ticket->qr_token_hash, hash('sha256', $token))) {
                $ticket = null;
            } elseif ($ticket !== null && $ticket->event_occurrence_id !== $occurrence->id) {
                $result = 'wrong_event';
            } elseif ($ticket !== null && $ticket->status === TicketStatus::Voided) {
                $result = 'voided';
            } elseif ($ticket !== null && $ticket->quota_used >= $ticket->quota_total) {
                $result = 'exhausted';
                $remaining = 0;
            } elseif ($ticket !== null) {
                $result = 'accepted';
                $consumed = 1;
                $ticket->quota_used++;
                $remaining = $ticket->quota_total - $ticket->quota_used;
                $ticket->status = $remaining === 0 ? TicketStatus::Exhausted : TicketStatus::Active;
                $ticket->save();
            }

            AccessScan::query()->create([
                'event_occurrence_id' => $occurrence->id,
                'ticket_id' => $ticket?->id,
                'scanner_user_id' => $scanner->id,
                'qr_fingerprint' => hash('sha256', $token),
                'scan_result' => $result,
                'consumed_quantity' => $consumed,
                'quota_before' => $ticket === null ? null : $ticket->quota_used - $consumed,
                'quota_after' => $ticket?->quota_used,
            ]);

            return ['result' => $result, 'consumed' => $consumed, 'remaining' => $remaining, 'ticket' => $ticket];
        }, 3);
    }
}
