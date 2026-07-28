<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Actions\Tickets\ConfirmTicketReservation;
use App\Actions\Tickets\CreateTicketReservation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\ConfirmTicketReservationRequest;
use App\Http\Requests\Tickets\CreateTicketReservationRequest;
use App\Models\EventOccurrence;
use App\Models\TicketReservation;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class EventReservationController extends Controller
{
    public function store(CreateTicketReservationRequest $request, EventOccurrence $occurrence, CreateTicketReservation $createReservation): RedirectResponse
    {
        $data = $request->validated();
        $reservation = $createReservation->handle($occurrence, $data['items'], $data['session_token'], $request->user()?->id);

        return to_route('reservations.show', ['reservation' => $reservation->id]);
    }

    public function show(TicketReservation $reservation): Response
    {
        return Inertia::render('reservations/show', [
            'reservation' => $reservation->load(['items.ticketType', 'items.location', 'occurrence.event']),
        ]);
    }

    public function confirm(ConfirmTicketReservationRequest $request, TicketReservation $reservation, ConfirmTicketReservation $confirmReservation): RedirectResponse
    {
        $paymentAttempt = $confirmReservation->handle($reservation, $request->validated());

        return to_route('payments.show', ['paymentAttempt' => $paymentAttempt->id]);
    }
}
