<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\InventoryBalance;
use App\Models\OutboundEmail;
use App\Models\ProductVariant;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class SendLowStockAlertEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public string $productVariantId) {}

    public function handle(): void
    {
        $variant = ProductVariant::query()->with('product')->findOrFail($this->productVariantId);
        $balance = InventoryBalance::query()->findOrFail($variant->id);

        if ($balance->available_quantity > $variant->low_stock_threshold) {
            return;
        }

        $company = Company::query()->findOrFail($variant->product->company_id);
        $settings = CompanySetting::query()->find($company->id);
        $recipient = $settings?->support_email ?? $company->contact_email;

        if ($recipient === null) {
            return;
        }

        $outbound = OutboundEmail::query()->firstOrCreate(
            ['template_code' => 'low_stock', 'related_type' => 'product_variant', 'related_id' => $variant->id],
            ['company_id' => $company->id, 'recipient_email' => $recipient, 'subject' => 'Alerta de stock bajo: '.$variant->sku],
        );

        if ($outbound->status === 'sent') {
            return;
        }

        try {
            $outbound->increment('attempts');
            Mail::html('<h1>Stock bajo</h1><p>'.e($variant->product->name).' · '.e($variant->sku).' tiene '.$balance->available_quantity.' unidades disponibles.</p>', function (Message $message) use ($recipient, $outbound, $settings): void {
                $message->to($recipient)->subject($outbound->subject);

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
}
