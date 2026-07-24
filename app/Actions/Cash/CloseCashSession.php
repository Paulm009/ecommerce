<?php

declare(strict_types=1);

namespace App\Actions\Cash;

use App\Enums\CashSessionStatus;
use App\Models\CashSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CloseCashSession
{
    public function handle(CashSession $cashSession, User $user, string $declaredAmount, ?string $notes = null): CashSession
    {
        return DB::transaction(function () use ($cashSession, $user, $declaredAmount, $notes): CashSession {
            $cashSession = CashSession::query()->with('movements')->lockForUpdate()->findOrFail($cashSession->id);

            if ($cashSession->status !== CashSessionStatus::Open) {
                throw ValidationException::withMessages(['cash_session' => 'La caja ya está cerrada.']);
            }

            $expectedCents = $this->moneyToCents((string) $cashSession->opening_amount);
            foreach ($cashSession->movements as $movement) {
                $movementCents = $this->moneyToCents((string) $movement->amount);
                $expectedCents += $movement->direction === 'in' ? $movementCents : -$movementCents;
            }
            $declaredCents = $this->moneyToCents($declaredAmount);

            $cashSession->update([
                'status' => CashSessionStatus::Closed,
                'closed_by_user_id' => $user->id,
                'closed_at' => now(),
                'expected_amount' => $this->centsToMoney($expectedCents),
                'declared_amount' => $declaredAmount,
                'difference_amount' => $this->centsToMoney($declaredCents - $expectedCents),
                'closing_notes' => $notes,
            ]);

            return $cashSession;
        }, 3);
    }

    private function moneyToCents(string $amount): int
    {
        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');

        return ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');
    }

    private function centsToMoney(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $absoluteCents = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($absoluteCents, 100), $absoluteCents % 100);
    }
}
