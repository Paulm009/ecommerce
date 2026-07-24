<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ManualRefund;
use App\Models\PaymentIncident;
use App\Models\PaymentIncidentAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class PaymentIncidentController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status', 'open')->toString();
        $incidents = PaymentIncident::query()
            ->with(['paymentAttempt.sale:id,public_number,total_amount,status'])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest('opened_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/payments/index', ['incidents' => $incidents, 'filters' => compact('status')]);
    }

    public function resolve(PaymentIncident $paymentIncident, Request $request): RedirectResponse
    {
        $data = $request->validate(['resolution_notes' => ['required', 'string', 'max:3000'], 'refund_reference' => ['nullable', 'string', 'max:180']]);
        $paymentIncident->update(['status' => 'resolved', 'resolved_at' => now(), 'resolution_notes' => $data['resolution_notes']]);
        PaymentIncidentAction::query()->create(['payment_incident_id' => $paymentIncident->id, 'action_type' => 'resolved', 'notes' => $data['resolution_notes'], 'performed_by_user_id' => $request->user()->id]);

        if (! empty($data['refund_reference'])) {
            ManualRefund::query()->create([
                'payment_incident_id' => $paymentIncident->id,
                'payment_attempt_id' => $paymentIncident->payment_attempt_id,
                'amount' => $paymentIncident->received_amount,
                'status' => 'completed',
                'reason' => 'Pago confirmado fuera de tiempo',
                'completed_by_user_id' => $request->user()->id,
                'external_reference' => $data['refund_reference'],
                'completed_at' => now(),
            ]);
        }

        return back()->with('success', 'Incidencia resuelta.');
    }
}
