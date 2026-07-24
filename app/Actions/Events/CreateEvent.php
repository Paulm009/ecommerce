<?php

declare(strict_types=1);

namespace App\Actions\Events;

use App\Models\Company;
use App\Models\Event;
use App\Models\EventLayout;
use App\Models\EventLocation;
use App\Models\EventLocationInventory;
use App\Models\EventOccurrence;
use App\Models\LayoutTemplate;
use App\Models\TicketType;
use App\Models\TicketTypeInventory;
use App\Models\User;
use App\Support\GeneratesPublicNumbers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateEvent
{
    public function __construct(private GeneratesPublicNumbers $numbers) {}

    /** @param array<string, mixed> $data */
    public function handle(Company $company, array $data, User $user): Event
    {
        return DB::transaction(function () use ($company, $data, $user): Event {
            $event = Event::query()->create([
                'company_id' => $company->id,
                'event_category_id' => $data['event_category_id'] ?? null,
                'public_code' => $this->numbers->next($company->id, 'event', 'EVT'),
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'short_description' => $data['short_description'] ?? null,
                'description' => $data['description'] ?? null,
                'venue_name' => $data['venue_name'],
                'venue_address' => $data['venue_address'] ?? null,
                'city' => $data['city'] ?? null,
                'status' => $data['status'],
                'published_at' => $data['status'] === 'published' ? now() : null,
                'created_by_user_id' => $user->id,
            ]);
            $occurrence = EventOccurrence::query()->create([
                'event_id' => $event->id,
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'] ?? null,
                'sales_start_at' => $data['sales_start_at'] ?? now(),
                'sales_end_at' => $data['sales_end_at'] ?? $data['starts_at'],
                'status' => $data['status'],
                'capacity_snapshot' => collect($data['ticket_types'])->sum('quota_total'),
            ]);
            $layout = $this->instantiateLayout($occurrence, $data['layout_template_id'], $user->id);
            $this->createTicketTypes($occurrence, $layout, $data['ticket_types']);

            return $event;
        }, 3);
    }

    private function instantiateLayout(EventOccurrence $occurrence, string $templateId, string $userId): EventLayout
    {
        $template = LayoutTemplate::query()->with('nodes')->findOrFail($templateId);
        $eventLayout = EventLayout::query()->create([
            'event_occurrence_id' => $occurrence->id,
            'layout_template_id' => $template->id,
            'template_version' => $template->version,
            'snapshot_json' => $template->source_json,
            'status' => 'active',
            'activated_at' => now(),
            'created_by_user_id' => $userId,
        ]);
        $locationsByTemplateNode = [];

        foreach ($template->nodes as $node) {
            $location = EventLocation::query()->create([
                'event_layout_id' => $eventLayout->id,
                'template_node_id' => $node->id,
                'parent_id' => $node->parent_id === null ? null : ($locationsByTemplateNode[$node->parent_id] ?? null),
                'external_key' => $node->external_key,
                'location_type' => $node->node_type,
                'label' => $node->label,
                'capacity_total' => $node->capacity,
                'is_selectable' => $node->is_selectable,
                'sale_mode' => $node->sale_mode,
                'geometry_json' => $node->geometry_json,
                'style_json' => $node->style_json,
                'metadata_json' => $node->metadata_json,
            ]);
            $locationsByTemplateNode[$node->id] = $location->id;
            EventLocationInventory::query()->create([
                'event_location_id' => $location->id,
                'capacity_total' => $node->capacity,
                'available_quantity' => $node->is_selectable ? $node->capacity : 0,
            ]);
        }

        return $eventLayout;
    }

    /** @param array<int, array<string, mixed>> $ticketTypes */
    private function createTicketTypes(EventOccurrence $occurrence, EventLayout $layout, array $ticketTypes): void
    {
        $locationIds = EventLocation::query()->where('event_layout_id', $layout->id)->where('is_selectable', true)->pluck('id');

        foreach ($ticketTypes as $index => $ticketTypeData) {
            $ticketType = TicketType::query()->create([
                'event_occurrence_id' => $occurrence->id,
                ...$ticketTypeData,
                'is_active' => true,
                'sort_order' => $index,
            ]);
            TicketTypeInventory::query()->create([
                'ticket_type_id' => $ticketType->id,
                'quota_total' => $ticketType->quota_total,
                'available_quantity' => $ticketType->quota_total,
            ]);
            $ticketType->locations()->sync($locationIds->mapWithKeys(fn (string $id): array => [$id => ['id' => (string) Str::uuid(), 'is_active' => true]])->all());
        }
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 2;

        while (Event::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
