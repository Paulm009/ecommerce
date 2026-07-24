<?php

declare(strict_types=1);

namespace App\Http\Controllers\Operations;

use App\Actions\Cash\CloseCashSession;
use App\Actions\Cash\OpenCashSession;
use App\Enums\CashSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cash\CloseCashSessionRequest;
use App\Http\Requests\Cash\OpenCashSessionRequest;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CashController extends Controller
{
    public function index(CurrentCompany $currentCompany): Response
    {
        $register = CashRegister::query()->where('company_id', $currentCompany->get()->id)->where('is_primary', true)->firstOrFail();
        $currentSession = CashSession::query()->with(['movements', 'posSales.sale'])->where('cash_register_id', $register->id)->where('status', CashSessionStatus::Open)->first();

        return Inertia::render('operations/cash/index', [
            'register' => $register,
            'currentSession' => $currentSession,
            'history' => CashSession::query()->where('cash_register_id', $register->id)->latest('opened_at')->paginate(20),
        ]);
    }

    public function open(OpenCashSessionRequest $request, CurrentCompany $currentCompany, OpenCashSession $openCashSession): RedirectResponse
    {
        $register = CashRegister::query()->where('company_id', $currentCompany->get()->id)->where('is_primary', true)->firstOrFail();
        $openCashSession->handle($register, $request->user(), $request->validated('opening_amount'));

        return back()->with('success', 'Caja abierta.');
    }

    public function movement(CashSession $cashSession, Request $request): RedirectResponse
    {
        abort_unless($cashSession->status === CashSessionStatus::Open, 422);
        $data = $request->validate([
            'direction' => ['required', 'in:in,out'],
            'amount' => ['required', 'decimal:0,2', 'min:0.01'],
            'description' => ['required', 'string', 'max:1000'],
        ]);
        CashMovement::query()->create([
            'cash_session_id' => $cashSession->id,
            'movement_type' => 'manual',
            'direction' => $data['direction'],
            'amount' => $data['amount'],
            'description' => $data['description'],
            'created_by_user_id' => $request->user()->id,
            'authorized_by_user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Movimiento registrado.');
    }

    public function close(CloseCashSessionRequest $request, CashSession $cashSession, CloseCashSession $closeCashSession): RedirectResponse
    {
        $closeCashSession->handle($cashSession, $request->user(), $request->validated('declared_amount'), $request->validated('closing_notes'));

        return back()->with('success', 'Caja cerrada.');
    }
}
