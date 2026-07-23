<?php

declare(strict_types=1);

namespace App\Http\Requests\Payments;

use Illuminate\Foundation\Http\FormRequest;

final class BankWebhookRequest extends FormRequest
{
    public function authorize(): bool
    {
        $secret = (string) config('services.bank.webhook_secret');
        $signature = $this->header('X-Bank-Signature');

        return $secret !== ''
            && is_string($signature)
            && hash_equals(hash_hmac('sha256', $this->getContent(), $secret), $signature);
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'event_id' => ['required', 'string', 'max:180'],
            'payment_reference' => ['required', 'string', 'max:180'],
            'transaction_id' => ['required', 'string', 'max:180'],
            'status' => ['required', 'in:paid'],
            'amount' => ['required', 'decimal:0,2', 'min:0.01'],
            'currency' => ['required', 'string', 'size:3'],
        ];
    }
}
