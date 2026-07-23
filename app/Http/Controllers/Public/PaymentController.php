<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Actions\Payments\ConfirmPayment;
use App\Contracts\Payments\QrPaymentGateway;
use App\Http\Controllers\Controller;
use App\Models\PaymentAttempt;
use App\Support\QrCodeDataUri;
use App\Support\TicketQrToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class PaymentController extends Controller
{
    public function show(PaymentAttempt $paymentAttempt, TicketQrToken $qrTokens, QrCodeDataUri $qrCode): Response
    {
        $paymentAttempt->load(['sale.ticketOrder.tickets', 'sale.productOrder', 'sale.posSale']);

        return Inertia::render('payments/show', [
            'payment' => $paymentAttempt,
            'qrPayload' => $paymentAttempt->qr_payload_encrypted,
            'qrImage' => $paymentAttempt->qr_payload_encrypted === null ? null : $qrCode->for($paymentAttempt->qr_payload_encrypted),
            'canSimulate' => app()->isLocal() || app()->runningUnitTests(),
            'tickets' => $paymentAttempt->sale->ticketOrder?->tickets->map(fn ($ticket): array => [
                'public_code' => $ticket->public_code,
                'url' => route('tickets.show', ['ticket' => $ticket, 'token' => $qrTokens->for($ticket->id)]),
            ])->values() ?? [],
        ]);
    }

    public function status(PaymentAttempt $paymentAttempt, QrPaymentGateway $gateway): JsonResponse
    {
        $paymentAttempt->update(['last_checked_at' => now()]);

        return response()->json($gateway->checkPayment($paymentAttempt));
    }

    public function simulate(PaymentAttempt $paymentAttempt, ConfirmPayment $confirmPayment): RedirectResponse
    {
        abort_unless(app()->isLocal() || app()->runningUnitTests(), 404);
        $confirmPayment->handle($paymentAttempt, 'DEMO-TX-'.Str::upper(Str::random(10)), 'DEMO-EVENT-'.$paymentAttempt->id, 'manual_check');

        return to_route('payments.show', $paymentAttempt)->with('success', 'Pago de demostración confirmado.');
    }
}
