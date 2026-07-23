<?php

declare(strict_types=1);

namespace App\Payments;

use App\Contracts\Payments\QrPaymentGateway;
use App\Enums\PaymentStatus;
use App\Models\PaymentAttempt;

final class FakeQrPaymentGateway implements QrPaymentGateway
{
    public function requestPayment(PaymentAttempt $paymentAttempt): array
    {
        $expiresAt = $paymentAttempt->qr_expires_at ?? now()->addMinutes(20);

        return [
            'provider_reference' => 'DEMO-'.$paymentAttempt->id,
            'qr_payload' => implode('|', ['EVENT-COMMERCE-DEMO', $paymentAttempt->idempotency_key, $paymentAttempt->amount, $paymentAttempt->currency_code]),
            'expires_at' => $expiresAt,
        ];
    }

    public function checkPayment(PaymentAttempt $paymentAttempt): array
    {
        return [
            'status' => $paymentAttempt->status instanceof PaymentStatus ? $paymentAttempt->status->value : (string) $paymentAttempt->status,
            'provider_transaction_id' => $paymentAttempt->provider_transaction_id,
        ];
    }
}
