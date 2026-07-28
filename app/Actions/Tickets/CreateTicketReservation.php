<?php

declare(strict_types=1);

namespace App\Actions\Tickets;

use App\Models\CompanySetting;
use App\Models\EventInventoryMovement;
use App\Models\EventLocation;
use App\Models\EventLocationInventory;
use App\Models\EventOccurrence;
use App\Models\TicketReservation;
use App\Models\TicketReservationItem;
use App\Models\TicketTypeInventory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CreateTicketReservation
{
    /**
     * @param  array<int, array{event_location_id: string, ticket_type_id?: string|null, quantity: int}>  $requestedItems
     */
    public function handle(EventOccurrence $occurrence, array $requestedItems, string $sessionToken, ?string $createdByUserId = null): TicketReservation
    {
        return DB::transaction(function () use ($occurrence, $requestedItems, $sessionToken, $createdByUserId): TicketReservation {
            $occurrence->loadMissing('event');
            $selectionMinutes = CompanySetting::query()
                ->whereKey($occurrence->event->company_id)
                ->value('temporary_selection_minutes') ?? 5;

            $reservation = TicketReservation::query()->create([
                'event_occurrence_id' => $occurrence->id,
                'session_token_hash' => hash('sha256', $sessionToken),
                'selection_expires_at' => now()->addMinutes((int) $selectionMinutes),
                'created_by_user_id' => $createdByUserId,
            ]);

            collect($requestedItems)
                ->sortBy(fn (array $item): string => $item['event_location_id'].'-'.(string) data_get($item, 'ticket_type_id', ''))
                ->each(function (array $requestedItem) use ($occurrence, $reservation, $createdByUserId): void {
                    $quantity = $requestedItem['quantity'];
                    $requestedTicketTypeId = data_get($requestedItem, 'ticket_type_id');
                    $location = EventLocation::query()
                        ->with('layout:id,event_occurrence_id')
                        ->findOrFail($requestedItem['event_location_id']);

                    if ($location->layout === null || $location->layout->event_occurrence_id !== $occurrence->id) {
                        throw ValidationException::withMessages(['items' => 'La ubicación seleccionada no corresponde a la función seleccionada.']);
                    }

                    if (! $location->is_enabled || ! $location->is_visible || ! $location->is_selectable) {
                        throw ValidationException::withMessages(['items' => 'La ubicación seleccionada no está habilitada para reservar.']);
                    }

                    $ticketTypeQuery = $location->ticketTypes()
                        ->wherePivot('is_active', true)
                        ->orderBy('event_location_ticket_types.created_at');

                    if ($requestedTicketTypeId !== null) {
                        $ticketTypeQuery->whereKey($requestedTicketTypeId);
                    }

                    $ticketType = $ticketTypeQuery->first();

                    if ($ticketType === null || $ticketType->event_occurrence_id !== $occurrence->id) {
                        throw ValidationException::withMessages(['items' => 'La ubicación seleccionada no tiene una tarifa válida para esta función.']);
                    }

                    $locationInventory = EventLocationInventory::query()
                        ->lockForUpdate()
                        ->find($location->id);
                    if ($locationInventory === null) {
                        throw ValidationException::withMessages(['items' => 'La ubicación seleccionada no tiene inventario configurado.']);
                    }

                    $ticketInventory = TicketTypeInventory::query()
                        ->lockForUpdate()
                        ->find($ticketType->id);

                    if ($ticketInventory === null) {
                        $ticketInventory = TicketTypeInventory::query()->create([
                            'ticket_type_id' => $ticketType->id,
                            'quota_total' => (int) ($ticketType->quota_total ?? 0),
                            'selection_quantity' => 0,
                            'payment_reserved_quantity' => 0,
                            'sold_quantity' => 0,
                            'courtesy_quantity' => 0,
                            'available_quantity' => max(0, (int) ($ticketType->quota_total ?? 0)),
                            'lock_version' => 0,
                        ]);
                    }

                    if ($quantity < 1 || $locationInventory->available_quantity < $quantity) {
                        throw ValidationException::withMessages(['items' => 'Una de las ubicaciones ya no tiene disponibilidad suficiente.']);
                    }

                    if ($ticketInventory->available_quantity !== null && $ticketInventory->available_quantity < $quantity) {
                        throw ValidationException::withMessages(['items' => 'El tipo de entrada ya no tiene cupos suficientes.']);
                    }

                    $unitPrice = (string) ($ticketType->pivot->price_override ?? $ticketType->base_price);
                    $reservationItem = TicketReservationItem::query()->create([
                        'ticket_reservation_id' => $reservation->id,
                        'ticket_type_id' => $ticketType->id,
                        'event_location_id' => $location->id,
                        'quantity' => $quantity,
                        'unit_price_snapshot' => $unitPrice,
                        'line_subtotal' => $this->multiplyMoney($unitPrice, $quantity),
                    ]);

                    $locationInventory->update([
                        'selection_quantity' => $locationInventory->selection_quantity + $quantity,
                        'available_quantity' => $locationInventory->available_quantity - $quantity,
                        'lock_version' => $locationInventory->lock_version + 1,
                    ]);

                    if ($ticketInventory->available_quantity !== null) {
                        $ticketInventory->update([
                            'selection_quantity' => $ticketInventory->selection_quantity + $quantity,
                            'available_quantity' => $ticketInventory->available_quantity - $quantity,
                            'lock_version' => $ticketInventory->lock_version + 1,
                        ]);
                    } else {
                        $ticketInventory->increment('selection_quantity', $quantity);
                    }

                    EventInventoryMovement::query()->create([
                        'event_location_id' => $location->id,
                        'ticket_type_id' => $ticketType->id,
                        'movement_type' => 'temporary_selection',
                        'quantity' => $quantity,
                        'from_bucket' => 'available',
                        'to_bucket' => 'selection',
                        'reservation_item_id' => $reservationItem->id,
                        'performed_by_user_id' => $createdByUserId,
                    ]);
                });

            return $reservation->load(['items.ticketType', 'items.location']);
        }, 3);
    }

    private function multiplyMoney(string $amount, int $quantity): string
    {
        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');
        $cents = ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');

        $totalCents = $cents * $quantity;

        return sprintf('%d.%02d', intdiv($totalCents, 100), abs($totalCents % 100));
    }
}
