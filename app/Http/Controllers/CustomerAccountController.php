<?php

namespace App\Http\Controllers;

use App\Models\ProductOrder;
use App\Models\Ticket;
use App\Support\TicketQrToken;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CustomerAccountController extends Controller
{
    public function __invoke(Request $request, TicketQrToken $qrTokens): Response
    {
        $email = $request->user()->email;

        return Inertia::render('account/index', [
            'tickets' => Ticket::query()
                ->with(['occurrence.event:id,name'])
                ->where('recipient_email', $email)
                ->latest('issued_at')
                ->get()
                ->map(fn (Ticket $ticket): array => [
                    'id' => $ticket->id,
                    'public_code' => $ticket->public_code,
                    'status' => $ticket->status,
                    'quota_total' => $ticket->quota_total,
                    'quota_used' => $ticket->quota_used,
                    'issued_at' => $ticket->issued_at,
                    'event_name' => $ticket->occurrence->event->name,
                    'starts_at' => $ticket->occurrence->starts_at,
                    'url' => route('tickets.show', ['ticket' => $ticket, 'token' => $qrTokens->for($ticket->id)]),
                ]),
            'orders' => ProductOrder::query()
                ->with('items:id,product_order_id,product_name_snapshot,variant_name_snapshot,quantity,line_total')
                ->where('buyer_email', $email)
                ->latest()
                ->get(['id', 'order_number', 'buyer_email', 'status', 'paid_at', 'delivered_at', 'created_at']),
        ]);
    }
}
