<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Payments\ConfirmPayment;
use App\Actions\Tickets\ConfirmTicketReservation;
use App\Actions\Tickets\CreateTicketReservation;
use App\Models\EventOccurrence;
use Illuminate\Database\Seeder;

final class DemoCustomerTicketsSeeder extends Seeder
{
    public function run(): void
    {
        $buyer = ['buyer_name' => 'Cliente Demo', 'buyer_email' => 'cliente@example.com', 'buyer_phone' => '+591 71234567', 'buyer_identity_document' => 'CI-DEMO-001'];
        $purchases = [
            ['Noche Sinfónica', 0, 2],
            ['Product Summit Bolivia', 0, 1],
            ['Cena de Gala EVENTA', 1, 4],
            ['Festival Fuego 2026', 1, 1],
            ['Noche Sinfónica', 1, 3],
        ];

        foreach ($purchases as $index => [$eventName, $ticketTypeIndex, $quantity]) {
            $occurrence = EventOccurrence::query()->whereHas('event', fn ($query) => $query->where('name', $eventName))->with(['layout.locations', 'ticketTypes'])->oldest('starts_at')->firstOrFail();
            $location = $occurrence->layout->locations->where('is_selectable', true)->values()->get($index % 2 === 0 ? 0 : 1);
            $ticketType = $occurrence->ticketTypes->values()->get($ticketTypeIndex) ?? $occurrence->ticketTypes->first();
            $number = str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);

            $reservation = app(CreateTicketReservation::class)->handle($occurrence, [[
                'event_location_id' => $location->id,
                'ticket_type_id' => $ticketType->id,
                'quantity' => $quantity,
            ]], 'demo-session-token-customer-'.$number.'-000000000000');
            $payment = app(ConfirmTicketReservation::class)->handle($reservation, $buyer);
            app(ConfirmPayment::class)->handle($payment, 'BANK-TICKET-CUSTOMER-'.$number, 'EVENT-TICKET-CUSTOMER-'.$number, 'demo_seed');
        }
    }
}
