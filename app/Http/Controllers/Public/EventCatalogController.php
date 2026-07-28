<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Enums\EventStatus;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventCategory;
use App\Support\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class EventCatalogController extends Controller
{
    public function index(Request $request, CurrentCompany $currentCompany): Response
    {
        $company = $currentCompany->get();
        $search = $request->string('search')->trim()->toString();
        $category = $request->string('category')->toString();
        $city = $request->string('city')->trim()->toString();

        $events = Event::query()
            ->select(['id', 'event_category_id', 'public_code', 'name', 'slug', 'short_description', 'venue_name', 'city', 'published_at'])
            ->with([
                'category:id,name,slug',
                'coverMedia',
                'occurrences' => fn ($query) => $query
                    ->select(['id', 'event_id', 'starts_at', 'sales_start_at', 'sales_end_at', 'status'])
                    ->where('status', EventStatus::Published)
                    ->where(function ($query): void {
                        $query->whereNull('sales_start_at')
                            ->orWhere('sales_start_at', '<=', now());
                    })
                    ->where(function ($query): void {
                        $query->whereNull('sales_end_at')
                            ->orWhere('sales_end_at', '>=', now());
                    })
                    ->oldest('starts_at'),
            ])
            ->where('company_id', $company->id)
            ->published()
            ->when($search !== '', fn ($query) => $query->whereLike('name', '%'.$search.'%'))
            ->when($category !== '', fn ($query) => $query->whereIn('event_category_id', EventCategory::query()->where('slug', $category)->select('id')))
            ->when($city !== '', fn ($query) => $query->whereLike('city', '%'.$city.'%'))
            ->whereHas('occurrences', function ($query): void {
                $query->where('status', EventStatus::Published)
                    ->where(function ($query): void {
                        $query->whereNull('sales_start_at')
                            ->orWhere('sales_start_at', '<=', now());
                    })
                    ->where(function ($query): void {
                        $query->whereNull('sales_end_at')
                            ->orWhere('sales_end_at', '>=', now());
                    });
            })
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('events/index', [
            'events' => $events,
            'categories' => EventCategory::query()->where('company_id', $company->id)->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
            'filters' => compact('search', 'category', 'city'),
        ]);
    }

    public function show(Event $event): Response
    {
        abort_unless($event->status === EventStatus::Published, 404);
        $event->load([
            'category:id,name',
            'coverMedia',
            'occurrences' => fn ($query) => $query
                ->where('status', EventStatus::Published)
                ->where(function ($query): void {
                    $query->whereNull('sales_start_at')
                        ->orWhere('sales_start_at', '<=', now());
                })
                ->where(function ($query): void {
                    $query->whereNull('sales_end_at')
                        ->orWhere('sales_end_at', '>=', now());
                })
                ->with([
                    'layout.locations' => fn ($locations) => $locations->where('is_visible', true)->where('is_enabled', true)->with([
                        'inventory',
                        'ticketTypes' => fn ($tickets) => $tickets->wherePivot('is_active', true)->orderBy('event_location_ticket_types.created_at')->select(['ticket_types.id', 'ticket_types.name', 'ticket_types.base_price']),
                    ]),
                ])
                ->oldest('starts_at'),
        ]);

        return Inertia::render('events/show', ['event' => $event]);
    }
}
