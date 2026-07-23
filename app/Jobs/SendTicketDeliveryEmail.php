<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\CompanySetting;
use App\Models\OutboundEmail;
use App\Models\Ticket;
use App\Support\TicketQrToken;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class SendTicketDeliveryEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public string $ticketId, public string $deliveryId) {}

    public function handle(TicketQrToken $qrTokens): void
    {
        $ticket = Ticket::query()->with('occurrence.event')->findOrFail($this->ticketId);

        if ($ticket->recipient_email === null) {
            return;
        }

        $outbound = OutboundEmail::query()->firstOrCreate(
            ['provider_message_id' => $this->deliveryId],
            [
                'company_id' => $ticket->occurrence->event->company_id,
                'template_code' => 'ticket_delivery',
                'recipient_email' => $ticket->recipient_email,
                'recipient_name' => $ticket->recipient_name,
                'subject' => 'Tu entrada para '.$ticket->occurrence->event->name,
                'related_type' => 'ticket',
                'related_id' => $ticket->id,
            ],
        );

        if ($outbound->status === 'sent') {
            return;
        }

        $url = route('tickets.show', ['ticket' => $ticket, 'token' => $qrTokens->for($ticket->id)]);
        $html = '<h1>Tu entrada digital</h1><p>Hola '.e($ticket->recipient_name).', tu entrada para '.e($ticket->occurrence->event->name).' está lista.</p><p><a href='.e($url).'>Abrir entrada '.e($ticket->public_code).'</a></p>';
        $settings = CompanySetting::query()->find($ticket->occurrence->event->company_id);

        try {
            $outbound->increment('attempts');
            Mail::html($html, function (Message $message) use ($ticket, $outbound, $settings): void {
                $message->to($ticket->recipient_email, $ticket->recipient_name)->subject($outbound->subject);

                if ($settings?->sender_email !== null) {
                    $message->from($settings->sender_email, $settings->sender_name);
                }
            });
            $outbound->update(['status' => 'sent', 'sent_at' => now(), 'last_error' => null]);
            $ticket->update(['last_sent_at' => now()]);
        } catch (Throwable $exception) {
            $outbound->update(['status' => 'failed', 'last_error' => $exception->getMessage()]);

            throw $exception;
        }
    }
}
