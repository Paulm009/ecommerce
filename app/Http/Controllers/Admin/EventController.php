<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Events\CreateEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Events\StoreEventRequest;
use App\Http\Requests\Events\StorePromotionCodeRequest;
use App\Http\Requests\Events\UpdateEventRequest;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\PromotionCode;
use App\Support\CurrentCompany;
use Carbon\CarbonImmutable;
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
            ->select(['id', 'company_id', 'event_category_id', 'public_code', 'name', 'slug', 'short_description', 'description', 'venue_name', 'venue_address', 'city', 'status', 'published_at', 'created_at'])
            ->with([
                'category:id,name',
                'coverMedia',
                'occurrences' => fn ($query) => $query->select(['id', 'event_id', 'starts_at', 'ends_at', 'sales_start_at', 'sales_end_at', 'status', 'capacity_snapshot'])->with([
                    'layout:id,event_occurrence_id,layout_template_id',
                    'ticketTypes' => fn ($ticketTypesQuery) => $ticketTypesQuery->select([
                        'id',
                        'event_occurrence_id',
                        'name',
                        'description',
                        'code',
                        'base_price',
                        'quota_total',
                        'minimum_per_order',
                        'maximum_per_order',
                        'sales_start_at',
                        'sales_end_at',
                        'is_active',
                        'sort_order',
                    ])->orderBy('sort_order'),
                ])->oldest('starts_at'),
            ])
            ->where('company_id', $currentCompany->get()->id)
            ->when($search !== '', fn ($query) => $query->whereLike('name', '%'.$search.'%'))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $layoutIds = $events->getCollection()
            ->flatMap(fn (Event $event): array => $event->occurrences->map(fn ($occurrence): ?string => $occurrence->layout?->layout_template_id)->filter()->values()->all())
            ->unique()
            ->values();

        $layouts = LayoutTemplate::query()
            ->where('company_id', $currentCompany->get()->id)
            ->where(function ($query) use ($layoutIds): void {
                $query->where('status', 'active');

                if ($layoutIds->isNotEmpty()) {
                    $query->orWhereIn('id', $layoutIds->all());
                }
            })
            ->orderByRaw("case when status = 'active' then 0 else 1 end")
            ->orderBy('name')
            ->get(['id', 'name', 'version', 'status']);

        return Inertia::render('admin/events/index', [
            'events' => $events,
            'filters' => compact('search'),
            'categories' => EventCategory::query()->where('company_id', $currentCompany->get()->id)->where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'layouts' => $layouts,
        ]);
    }

    public function store(StoreEventRequest $request, CurrentCompany $currentCompany, CreateEvent $createEvent): RedirectResponse
    {
        $createEvent->handle($currentCompany->get(), [
            ...$request->validated(),
            'cover_image' => $request->file('cover_image'),
        ], $request->user());

        return to_route('admin.events.index')->with('success', 'Evento creado.');
    }

    public function update(UpdateEventRequest $request, Event $event, CreateEvent $createEvent): RedirectResponse
    {
        $data = $request->validated();
        $event->update([
            'event_category_id' => $data['event_category_id'] ?? null,
            'name' => $data['name'],
            'short_description' => $data['short_description'] ?? null,
            'description' => $data['description'] ?? null,
            'venue_name' => $data['venue_name'],
            'venue_address' => $data['venue_address'] ?? null,
            'city' => $data['city'] ?? null,
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published' ? ($event->published_at ?? now()) : $event->published_at,
            'cancelled_at' => $data['status'] === 'cancelled' ? now() : null,
            'updated_by_user_id' => $request->user()->id,
        ]);
        $occurrence = $event->occurrences()->with('layout')->oldest('starts_at')->first();

        $occurrence?->update([
            'starts_at' => $data['starts_at'],
            'ends_at' => $data['ends_at'] ?? null,
            'sales_start_at' => $this->normalizeDateTime(
                $data['sales_start_at'] ?? $occurrence?->sales_start_at,
                $occurrence?->sales_start_at ?? now(),
            ),
            'sales_end_at' => $this->normalizeSalesEndAt(
                $data['sales_start_at'] ?? $occurrence?->sales_start_at,
                $data['sales_end_at'] ?? $occurrence?->sales_end_at,
                $data['starts_at'],
                $occurrence?->sales_end_at ?? now(),
            ),
            'status' => $data['status'],
        ]);
        if ($occurrence?->layout !== null && array_key_exists('ticket_types', $data) && is_array($data['ticket_types'])) {
            $createEvent->syncTicketTypes($occurrence, $occurrence->layout, $data['ticket_types']);
            $occurrence->update([
                'capacity_snapshot' => collect($data['ticket_types'])->sum('quota_total'),
            ]);
        }
        $createEvent->syncCoverImage($event, $event->company_id, $request->user(), $request->file('cover_image'));

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

    private function normalizeSalesEndAt(mixed $salesStartAt, mixed $salesEndAt, mixed $startsAt, CarbonImmutable $defaultEndAt): CarbonImmutable
    {
        $normalizedSalesStartAt = $this->normalizeDateTime($salesStartAt, now());
        $fallbackEndAt = $this->normalizeDateTime($startsAt, $defaultEndAt);
        $normalizedSalesEndAt = $this->normalizeDateTime($salesEndAt, $fallbackEndAt);

        if ($normalizedSalesEndAt->lessThan($normalizedSalesStartAt)) {
            return $normalizedSalesStartAt;
        }

        return $normalizedSalesEndAt;
    }

    private function normalizeDateTime(mixed $value, CarbonImmutable $default): CarbonImmutable
    {
        if (is_string($value) && trim($value) !== '') {
            return CarbonImmutable::parse($value);
        }

        if ($value instanceof CarbonImmutable) {
            return $value;
        }

        return $default;
    }
}
