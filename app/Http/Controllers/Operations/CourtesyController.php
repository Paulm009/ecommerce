<?php

declare(strict_types=1);

namespace App\Http\Controllers\Operations;

use App\Actions\Tickets\IssueCourtesyTickets;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\IssueCourtesyRequest;
use App\Models\CourtesyBatch;
use App\Models\EventOccurrence;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class CourtesyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('operations/courtesies/index', [
            'occurrences' => EventOccurrence::query()->with(['event:id,name', 'ticketTypes.inventory', 'layout.locations.inventory'])->where('status', 'published')->latest('starts_at')->get(),
            'batches' => CourtesyBatch::query()->with(['occurrence.event:id,name', 'tickets:id,courtesy_batch_id,public_code,quota_total,quota_used,status'])->latest('issued_at')->paginate(20),
        ]);
    }

    public function store(IssueCourtesyRequest $request, EventOccurrence $occurrence, IssueCourtesyTickets $issueCourtesyTickets): RedirectResponse
    {
        $issueCourtesyTickets->handle($occurrence, $request->validated(), $request->user()->id);

        return back()->with('success', 'Cortesía emitida.');
    }
}
