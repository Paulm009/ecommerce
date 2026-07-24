<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\CompanySetting;
use App\Models\OutboundEmail;
use App\Models\PaymentAttempt;
use App\Support\TicketQrToken;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class SendPaymentConfirmationEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 120, 600];

    public function __construct(public string $paymentAttemptId) {}

    public function handle(TicketQrToken $qrTokens): void
    {
        $payment = PaymentAttempt::query()->with(['sale.ticketOrder.tickets', 'sale.productOrder'])->findOrFail($this->paymentAttemptId);

        if ($payment->sale->status !== 'paid' || $payment->sale->channel === 'pos') {
            return;
        }

        $ticketOrder = $payment->sale->ticketOrder;
        $productOrder = $payment->sale->productOrder;
        $isTicket = $ticketOrder !== null;
        $recipientEmail = $isTicket ? $ticketOrder->buyer_email : $productOrder?->buyer_email;
        $recipientName = $isTicket ? $ticketOrder->buyer_name : $productOrder?->buyer_name;

        if ($recipientEmail === null) {
            return;
        }

        $templateCode = $isTicket ? 'ticket_issued' : 'product_order_paid';
        $relatedType = $isTicket ? 'ticket_order' : 'product_order';
        $relatedId = $isTicket ? $ticketOrder->id : $productOrder->id;
        $subject = $isTicket ? 'Tus entradas ya están listas' : 'Tu pedido fue confirmado';
        $outbound = OutboundEmail::query()->firstOrCreate(
            ['template_code' => $templateCode, 'related_type' => $relatedType, 'related_id' => $relatedId],
            [
                'company_id' => $payment->sale->company_id,
                'recipient_email' => $recipientEmail,
                'recipient_name' => $recipientName,
                'subject' => $subject,
            ],
        );

        if ($outbound->status === 'sent') {
            return;
        }

        $html = $isTicket
            ? $this->ticketHtml($ticketOrder, $qrTokens)
            : $this->orderHtml($productOrder);
        $settings = CompanySetting::query()->find($payment->sale->company_id);

        try {
            $outbound->increment('attempts');
            Mail::html($html, function (Message $message) use ($recipientEmail, $recipientName, $subject, $settings): void {
                $message->to($recipientEmail, $recipientName)->subject($subject);

                if ($settings?->sender_email !== null) {
                    $message->from($settings->sender_email, $settings->sender_name);
                }
            });
            $outbound->update(['status' => 'sent', 'sent_at' => now(), 'last_error' => null]);
        } catch (Throwable $exception) {
            $outbound->update(['status' => 'failed', 'last_error' => $exception->getMessage()]);

            throw $exception;
        }
    }

    private function ticketHtml(mixed $order, TicketQrToken $qrTokens): string
    {
        $links = $order->tickets->map(function ($ticket) use ($qrTokens): string {
            $url = route('tickets.show', ['ticket' => $ticket, 'token' => $qrTokens->for($ticket->id)]);

            return '<li><a href='.e($url).'>'.e($ticket->public_code).'</a></li>';
        })->implode('');

        return '<h1>Pago confirmado</h1><p>Hola '.e($order->buyer_name).', tus entradas para '.e($order->event_name_snapshot).' están listas.</p><ul>'.$links.'</ul>';
    }

    private function orderHtml(mixed $order): string
    {
        return '<h1>Pedido confirmado</h1><p>Hola '.e($order->buyer_name).', recibimos el pago de tu pedido '.e($order->order_number).'. Coordinaremos la entrega o recojo por los datos registrados.</p>';
    }
}
