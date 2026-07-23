<?php

declare(strict_types=1);

namespace App\Http\Controllers\Operations;

use App\Actions\Tickets\ScanTicket;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\ScanTicketRequest;
use App\Models\AccessScan;
use App\Models\EventOccurrence;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ScannerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('operations/scanner/index', [
            'occurrences' => EventOccurrence::query()->with('event:id,name')->whereIn('status', ['published', 'finished'])->latest('starts_at')->limit(30)->get(['id', 'event_id', 'starts_at', 'status']),
            'history' => AccessScan::query()->with('ticket:id,public_code')->latest('scanned_at')->limit(30)->get(),
        ]);
    }

    public function scan(ScanTicketRequest $request, EventOccurrence $occurrence, ScanTicket $scanTicket): RedirectResponse
    {
        $result = $scanTicket->handle($occurrence, $request->validated('token'), $request->user());

        return back()->with('scanResult', ['result' => $result['result'], 'remaining' => $result['remaining']]);
    }
}
