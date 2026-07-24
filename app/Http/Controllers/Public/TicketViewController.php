<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Support\QrCodeDataUri;
use App\Support\TicketQrToken;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class TicketViewController extends Controller
{
    public function __invoke(Request $request, Ticket $ticket, TicketQrToken $qrTokens, QrCodeDataUri $qrCode): Response
    {
        $token = $request->string('token')->toString();
        abort_unless($token !== '' && hash_equals($ticket->qr_token_hash, hash('sha256', $token)), 403);

        return Inertia::render('tickets/show', [
            'ticket' => $ticket->load(['occurrence.event', 'entitlements']),
            'qrToken' => $qrTokens->for($ticket->id),
            'qrImage' => $qrCode->for($token),
        ]);
    }
}
