<?php

declare(strict_types=1);

namespace App\Actions\Cash;

use App\Enums\CashSessionStatus;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\User;
use App\Support\GeneratesPublicNumbers;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class OpenCashSession
{
    public function __construct(private GeneratesPublicNumbers $numbers) {}

    public function handle(CashRegister $register, User $user, string $openingAmount): CashSession
    {
        return DB::transaction(function () use ($register, $user, $openingAmount): CashSession {
            $hasOpenSession = CashSession::query()
                ->where('cash_register_id', $register->id)
                ->where('status', CashSessionStatus::Open)
                ->lockForUpdate()
                ->exists();

            if ($hasOpenSession) {
                throw ValidationException::withMessages(['cash_register' => 'La caja principal ya tiene una sesión abierta.']);
            }

            return CashSession::query()->create([
                'cash_register_id' => $register->id,
                'session_number' => $this->numbers->next($register->company_id, 'cash_session', 'CAJ'),
                'opened_by_user_id' => $user->id,
                'opening_amount' => $openingAmount,
            ]);
        }, 3);
    }
}
