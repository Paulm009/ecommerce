<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\VoidTicketRequest;
use App\Jobs\SendTicketDeliveryEmail;
use App\Models\Ticket;
use App\Models\TicketStatusHistory;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class TicketController extends Controller
{
    public function index(Request $request, CurrentCompany $currentCompany): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();
        $tickets = Ticket::query()
            ->with(['occurrence.event:id,company_id,name', 'entitlements'])
            ->withCount('scans')
            ->whereHas('occurrence.event', fn ($query) => $query->where('company_id', $currentCompany->get()->id))
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->whereLike('public_code', '%'.$search.'%')->orWhereLike('recipient_name', '%'.$search.'%')->orWhereLike('recipient_email', '%'.$search.'%')))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest('issued_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/tickets/index', ['tickets' => $tickets, 'filters' => compact('search', 'status')]);
    }

    public function resend(Ticket $ticket): RedirectResponse
    {
        abort_if($ticket->recipient_email === null, 422, 'La entrada no tiene correo de destino.');
        SendTicketDeliveryEmail::dispatch($ticket->id, (string) Str::uuid());

        return back()->with('success', 'Reenvío de entrada encolado.');
    }

    public function void(VoidTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        DB::transaction(function () use ($request, $ticket): void {
            $ticket = Ticket::query()->lockForUpdate()->findOrFail($ticket->id);
            abort_if($ticket->status === TicketStatus::Voided, 422, 'La entrada ya está anulada.');
            $previousStatus = $ticket->status;
            $ticket->update(['status' => TicketStatus::Voided, 'voided_at' => now(), 'voided_by_user_id' => $request->user()->id, 'void_reason' => $request->validated('reason')]);
            TicketStatusHistory::query()->create(['ticket_id' => $ticket->id, 'previous_status' => $previousStatus->value, 'new_status' => TicketStatus::Voided->value, 'reason' => $request->validated('reason'), 'performed_by_user_id' => $request->user()->id]);
        }, 3);

        return back()->with('success', 'Entrada anulada.');
    }
}
