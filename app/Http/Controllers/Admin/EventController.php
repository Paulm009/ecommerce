<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Events\CreateEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Events\StoreEventRequest;
use App\Http\Requests\Events\StorePromotionCodeRequest;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\PromotionCode;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class EventController extends Controller
{
    public function index(Request $request, CurrentCompany $currentCompany): Response
    {
        $search = $request->string('search')->trim()->toString();
        $events = Event::query()
            ->with(['category:id,name', 'occurrences' => fn ($query) => $query->select(['id', 'event_id', 'starts_at', 'status'])->oldest('starts_at')])
            ->where('company_id', $currentCompany->get()->id)
            ->when($search !== '', fn ($query) => $query->whereLike('name', '%'.$search.'%'))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/events/index', [
            'events' => $events,
            'filters' => compact('search'),
            'categories' => EventCategory::query()->where('company_id', $currentCompany->get()->id)->where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'layouts' => LayoutTemplate::query()->where('company_id', $currentCompany->get()->id)->where('status', 'active')->get(['id', 'name', 'version']),
        ]);
    }

    public function store(StoreEventRequest $request, CurrentCompany $currentCompany, CreateEvent $createEvent): RedirectResponse
    {
        $event = $createEvent->handle($currentCompany->get(), $request->validated(), $request->user());

        return to_route('admin.events.index')->with('success', 'Evento creado.');
    }

    public function update(StoreEventRequest $request, Event $event): RedirectResponse
    {
        $data = $request->safe()->except(['layout_template_id', 'ticket_types', 'starts_at', 'ends_at', 'sales_start_at', 'sales_end_at']);
        $event->update([...$data, 'updated_by_user_id' => $request->user()->id]);
        $event->occurrences()->oldest('starts_at')->first()?->update($request->safe()->only(['starts_at', 'ends_at', 'sales_start_at', 'sales_end_at', 'status']));

        return back()->with('success', 'Evento actualizado.');
    }

    public function status(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['draft', 'published', 'finished', 'cancelled'])]]);
        $event->update([
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published' ? ($event->published_at ?? now()) : $event->published_at,
            'cancelled_at' => $data['status'] === 'cancelled' ? now() : null,
            'updated_by_user_id' => $request->user()->id,
        ]);
        $event->occurrences()->update(['status' => $data['status']]);

        return back()->with('success', 'Estado del evento actualizado.');
    }

    public function promotion(StorePromotionCodeRequest $request, Event $event): RedirectResponse
    {
        PromotionCode::query()->create([
            'event_id' => $event->id,
            ...$request->validated(),
            'code' => mb_strtoupper($request->string('code')->trim()->toString()),
            'is_active' => true,
            'created_by_user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Codigo promocional creado.');
    }
}
