<?php

declare(strict_types=1);

namespace App\Http\Controllers\Webhooks;

use App\Actions\Payments\ConfirmPayment;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\BankWebhookRequest;
use App\Models\PaymentAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

final class BankPaymentWebhookController extends Controller
{
    public function __invoke(BankWebhookRequest $request, ConfirmPayment $confirmPayment): JsonResponse
    {
        $data = $request->validated();
        $paymentAttempt = PaymentAttempt::query()
            ->where('provider_code', config('services.bank.provider_code'))
            ->where('provider_reference', $data['payment_reference'])
            ->firstOrFail();

        if ($this->moneyToCents((string) $paymentAttempt->amount) !== $this->moneyToCents($data['amount']) || $paymentAttempt->currency_code !== strtoupper($data['currency'])) {
            throw ValidationException::withMessages(['payment' => 'El monto o la moneda no coincide con la solicitud original.']);
        }

        $confirmed = $confirmPayment->handle($paymentAttempt, $data['transaction_id'], $data['event_id'], 'webhook');

        return response()->json([
            'accepted' => true,
            'payment_attempt_id' => $confirmed->id,
            'status' => $confirmed->status->value,
        ]);
    }

    private function moneyToCents(string $amount): int
    {
        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');

        return ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');
    }
}
