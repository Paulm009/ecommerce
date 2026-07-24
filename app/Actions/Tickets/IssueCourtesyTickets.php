<?php

declare(strict_types=1);

namespace App\Actions\Tickets;

use App\Jobs\SendTicketDeliveryEmail;
use App\Models\CourtesyBatch;
use App\Models\CourtesyItem;
use App\Models\EventInventoryMovement;
use App\Models\EventLocation;
use App\Models\EventLocationInventory;
use App\Models\EventOccurrence;
use App\Models\Ticket;
use App\Models\TicketEntitlement;
use App\Models\TicketType;
use App\Models\TicketTypeInventory;
use App\Support\GeneratesPublicNumbers;
use App\Support\TicketQrToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class IssueCourtesyTickets
{
    public function __construct(
        private GeneratesPublicNumbers $numbers,
        private TicketQrToken $qrTokens,
    ) {}

    /**
     * @param  array{recipient_name?: string|null, recipient_email?: string|null, recipient_phone?: string|null, reason?: string|null, items: array<int, array{event_location_id: string, ticket_type_id: string, quantity: int}>}  $data
     */
    public function handle(EventOccurrence $occurrence, array $data, string $issuedByUserId): Ticket
    {
        $ticket = DB::transaction(function () use ($occurrence, $data, $issuedByUserId): Ticket {
            $occurrence->loadMissing('event');
            $batch = CourtesyBatch::query()->create([
                'event_occurrence_id' => $occurrence->id,
                'public_number' => $this->numbers->next($occurrence->event->company_id, 'courtesy', 'COR'),
                'recipient_name' => $data['recipient_name'] ?? null,
                'recipient_email' => $data['recipient_email'] ?? null,
                'recipient_phone' => $data['recipient_phone'] ?? null,
                'reason' => $data['reason'] ?? null,
                'issued_by_user_id' => $issuedByUserId,
            ]);

            $courtesyItems = collect($data['items'])
                ->sortBy(fn (array $item): string => $item['event_location_id'].'-'.$item['ticket_type_id'])
                ->map(function (array $requestedItem) use ($occurrence, $batch, $issuedByUserId): CourtesyItem {
                    $location = EventLocation::query()->with('layout:id,event_occurrence_id')->findOrFail($requestedItem['event_location_id']);
                    $ticketType = TicketType::query()->findOrFail($requestedItem['ticket_type_id']);
                    $quantity = $requestedItem['quantity'];

                    if ($quantity < 1 || $location->layout->event_occurrence_id !== $occurrence->id || $ticketType->event_occurrence_id !== $occurrence->id) {
                        throw ValidationException::withMessages(['items' => 'La cortesía contiene una ubicación o cantidad inválida.']);
                    }

                    $locationInventory = EventLocationInventory::query()->lockForUpdate()->findOrFail($location->id);
                    $ticketInventory = TicketTypeInventory::query()->lockForUpdate()->findOrFail($ticketType->id);

                    if ($locationInventory->available_quantity < $quantity || ($ticketInventory->available_quantity !== null && $ticketInventory->available_quantity < $quantity)) {
                        throw ValidationException::withMessages(['items' => 'No existe disponibilidad suficiente para emitir la cortesía.']);
                    }

                    $item = CourtesyItem::query()->create([
                        'courtesy_batch_id' => $batch->id,
                        'ticket_type_id' => $ticketType->id,
                        'event_location_id' => $location->id,
                        'quantity' => $quantity,
                        'ticket_type_name_snapshot' => $ticketType->name,
                        'location_label_snapshot' => $location->label,
                    ]);

                    $locationInventory->update([
                        'courtesy_quantity' => $locationInventory->courtesy_quantity + $quantity,
                        'available_quantity' => $locationInventory->available_quantity - $quantity,
                        'lock_version' => $locationInventory->lock_version + 1,
                    ]);
                    $ticketInventory->update([
                        'courtesy_quantity' => $ticketInventory->courtesy_quantity + $quantity,
                        'available_quantity' => $ticketInventory->available_quantity === null ? null : $ticketInventory->available_quantity - $quantity,
                        'lock_version' => $ticketInventory->lock_version + 1,
                    ]);

                    EventInventoryMovement::query()->create([
                        'event_location_id' => $location->id,
                        'ticket_type_id' => $ticketType->id,
                        'movement_type' => 'courtesy_issued',
                        'quantity' => $quantity,
                        'from_bucket' => 'available',
                        'to_bucket' => 'courtesy',
                        'courtesy_item_id' => $item->id,
                        'performed_by_user_id' => $issuedByUserId,
                    ]);

                    return $item;
                });

            $ticketId = (string) Str::uuid();
            $qrToken = $this->qrTokens->for($ticketId);
            $ticket = Ticket::query()->create([
                'id' => $ticketId,
                'event_occurrence_id' => $occurrence->id,
                'courtesy_batch_id' => $batch->id,
                'public_code' => 'TKT-'.Str::upper(Str::random(16)),
                'qr_token_hash' => hash('sha256', $qrToken),
                'quota_total' => $courtesyItems->sum('quantity'),
                'recipient_name' => $data['recipient_name'] ?? null,
                'recipient_email' => $data['recipient_email'] ?? null,
            ]);

            foreach ($courtesyItems as $item) {
                TicketEntitlement::query()->create([
                    'ticket_id' => $ticket->id,
                    'courtesy_item_id' => $item->id,
                    'ticket_type_id' => $item->ticket_type_id,
                    'event_location_id' => $item->event_location_id,
                    'quantity' => $item->quantity,
                ]);
            }

            return $ticket->load(['occurrence.event', 'entitlements']);
        }, 3);

        SendTicketDeliveryEmail::dispatch($ticket->id, (string) Str::uuid());

        return $ticket;
    }
}
