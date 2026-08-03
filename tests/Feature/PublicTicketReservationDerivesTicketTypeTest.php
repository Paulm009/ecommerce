<?php

declare(strict_types=1);

use App\Models\Event;
use App\Models\TicketReservation;
use App\Models\TicketTypeInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('derives the ticket type from the selected location when creating a reservation', function (): void {
    $occurrence = Event::query()
        ->where('name', 'Festival Fuego 2026')
        ->firstOrFail()
        ->occurrences()
        ->with(['layout.locations'])
        ->firstOrFail();

    $location = $occurrence->layout->locations->firstWhere('is_selectable', true);
    if ($location === null) {
        $this->fail('No se encontró una ubicación seleccionable en el plano del evento.');
    }

    $expectedTicketType = $location->ticketTypes()
        ->wherePivot('is_active', true)
        ->orderBy('event_location_ticket_types.created_at')
        ->firstOrFail();

    TicketTypeInventory::query()
        ->whereIn('ticket_type_id', $location->ticketTypes()->pluck('ticket_types.id'))
        ->delete();

    $sessionToken = 'test-session-token-derives-ticket-type-000000';
    $payload = [
        'session_token' => $sessionToken,
        'items' => [[
            'event_location_id' => $location->id,
            'quantity' => 2,
        ]],
    ];

    $response = $this->post(route('reservations.store', $occurrence), $payload);

    $response->assertRedirect();
    $this->get($response->headers->get('Location'))->assertOk();

    $reservation = TicketReservation::query()
        ->where('event_occurrence_id', $occurrence->id)
        ->where('session_token_hash', hash('sha256', $sessionToken))
        ->firstOrFail();

    $this->assertDatabaseHas('ticket_reservation_items', [
        'ticket_reservation_id' => $reservation->id,
        'event_location_id' => $location->id,
        'ticket_type_id' => $expectedTicketType->id,
        'quantity' => 2,
    ]);
    $this->assertDatabaseHas('ticket_type_inventory', [
        'ticket_type_id' => $expectedTicketType->id,
    ]);
});
