<?php

declare(strict_types=1);

namespace App\Contracts\Payments;

use App\Models\PaymentAttempt;

interface QrPaymentGateway
{
    /**
     * @return array{provider_reference: string, qr_payload: string, expires_at: \DateTimeInterface}
     */
    public function requestPayment(PaymentAttempt $paymentAttempt): array;

    /**
     * @return array{status: string, provider_transaction_id: string|null}
     */
    public function checkPayment(PaymentAttempt $paymentAttempt): array;
}
