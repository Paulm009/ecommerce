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
use App\Models\MediaAsset;
use App\Models\TicketType;
use App\Models\TicketTypeInventory;
use App\Models\User;
use App\Support\GeneratesPublicNumbers;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
                'sales_start_at' => $this->normalizeDateTime($data['sales_start_at'] ?? null, now()),
                'sales_end_at' => $this->normalizeSalesEndAt(
                    $data['sales_start_at'] ?? null,
                    $data['sales_end_at'] ?? null,
                    $data['starts_at'],
                ),
                'status' => $data['status'],
                'capacity_snapshot' => 0,
            ]);
            $layout = $this->instantiateLayout($occurrence, $data['layout_template_id'], $user->id);
            $ticketTypes = is_array($data['ticket_types'] ?? null) ? $data['ticket_types'] : null;

            if ($ticketTypes !== null) {
                $capacitySnapshot = collect($ticketTypes)->sum(
                    fn (array $ticketType): int => (int) ($ticketType['quota_total'] ?? 0),
                );
                $this->syncTicketTypes($occurrence, $layout, $ticketTypes);
            } else {
                $capacitySnapshot = $this->syncTicketTypesFromLayout($occurrence, $layout);
            }

            $occurrence->update(['capacity_snapshot' => $capacitySnapshot]);
            $this->syncCoverImage($event, $company->id, $user, $data['cover_image'] ?? null);

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

    private function syncTicketTypesFromLayout(EventOccurrence $occurrence, EventLayout $layout): int
    {
        $locations = EventLocation::query()
            ->where('event_layout_id', $layout->id)
            ->orderBy('created_at')
            ->get();

        $locationsByParentId = $locations->groupBy(
            static fn (EventLocation $location): string => $location->parent_id ?? '__root__',
        );
        $templateType = (string) data_get($layout->snapshot_json, 'template_type', 'sectors');
        $rootLocations = match ($templateType) {
            'matrix' => $locations->filter(
                static fn (EventLocation $location): bool => $location->location_type === 'matrix' && $location->parent_id === null,
            ),
            'mixed' => $locations->filter(
                static fn (EventLocation $location): bool => $location->location_type === 'sector' && $location->parent_id === null,
            ),
            default => $locations->filter(
                static fn (EventLocation $location): bool => $location->parent_id === null && $location->is_selectable,
            ),
        };

        if ($rootLocations->isEmpty()) {
            $rootLocations = $locations->filter(
                static fn (EventLocation $location): bool => $location->parent_id === null && $location->is_selectable,
            );
        }

        if ($rootLocations->isEmpty()) {
            $rootLocations = $locations->filter(
                static fn (EventLocation $location): bool => $location->is_selectable,
            );
        }

        $capacitySnapshot = 0;
        $usedCodes = [];

        foreach ($rootLocations->values() as $index => $rootLocation) {
            $sellableLocations = $this->collectSellableLocations($rootLocation, $locationsByParentId);

            if ($sellableLocations->isEmpty() && $rootLocation->is_selectable) {
                $sellableLocations = collect([$rootLocation]);
            }

            if ($sellableLocations->isEmpty()) {
                continue;
            }

            $quotaTotal = (int) $sellableLocations->sum('capacity_total');

            if ($quotaTotal < 1) {
                $quotaTotal = $sellableLocations->count();
            }
            $basePrice = $this->formatMoney(data_get($rootLocation->metadata_json, 'price', 0));
            $ticketName = $this->buildTicketTypeName($rootLocation, $templateType, $index);
            $ticketCode = $this->buildTicketTypeCode($rootLocation, $templateType, $index, $usedCodes);

            $ticketType = TicketType::query()->create([
                'event_occurrence_id' => $occurrence->id,
                'name' => $ticketName,
                'description' => null,
                'code' => $ticketCode,
                'base_price' => $basePrice,
                'quota_total' => $quotaTotal,
                'minimum_per_order' => 1,
                'maximum_per_order' => $quotaTotal,
                'sales_start_at' => $occurrence->sales_start_at,
                'sales_end_at' => $occurrence->sales_end_at,
                'is_active' => true,
                'sort_order' => $index,
            ]);

            $ticketType->locations()->sync(
                $sellableLocations
                    ->pluck('id')
                    ->mapWithKeys(static fn (string $locationId): array => [
                        $locationId => [
                            'id' => (string) Str::uuid(),
                            'is_active' => true,
                        ],
                    ])
                    ->all(),
            );

            $usedCodes[] = $ticketCode;

            $capacitySnapshot += $quotaTotal;
        }

        if ($capacitySnapshot < 1) {
            throw ValidationException::withMessages([
                'layout_template_id' => 'La plantilla seleccionada no contiene ubicaciones válidas para crear tipos de entrada.',
            ]);
        }

        return $capacitySnapshot;
    }

    public function syncCoverImage(Event $event, string $companyId, User $user, ?UploadedFile $coverImage): void
    {
        if ($coverImage === null) {
            return;
        }

        $existingCover = $event->coverMedia()->first();

        if ($existingCover !== null) {
            $event->mediaAssets()->detach($existingCover->id);
            Storage::disk($existingCover->disk)->delete($existingCover->path);
            $existingCover->forceDelete();
        }

        $path = $coverImage->storePublicly('events/covers', 'public');

        if (! is_string($path)) {
            return;
        }

        $media = MediaAsset::query()->create([
            'company_id' => $companyId,
            'disk' => 'public',
            'path' => $path,
            'original_name' => $coverImage->getClientOriginalName(),
            'mime_type' => $coverImage->getMimeType() ?? 'image/jpeg',
            'size_bytes' => $coverImage->getSize(),
            'checksum_sha256' => hash_file('sha256', $coverImage->getPathname()),
            'uploaded_by_user_id' => $user->id,
        ]);

        $event->mediaAssets()->attach($media->id, [
            'media_role' => 'cover',
            'sort_order' => 0,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $ticketTypes
     */
    public function syncTicketTypes(EventOccurrence $occurrence, EventLayout $layout, array $ticketTypes): void
    {
        $existingTicketTypes = TicketType::query()
            ->where('event_occurrence_id', $occurrence->id)
            ->with('inventory')
            ->get()
            ->keyBy('id');
        $locationIds = EventLocation::query()
            ->where('event_layout_id', $layout->id)
            ->where('is_selectable', true)
            ->pluck('id');

        foreach ($ticketTypes as $index => $ticketTypeData) {
            $ticketTypeId = isset($ticketTypeData['id']) && is_string($ticketTypeData['id']) && $ticketTypeData['id'] !== ''
                ? $ticketTypeData['id']
                : null;
            $ticketType = $ticketTypeId !== null ? $existingTicketTypes->get($ticketTypeId) : null;
            $attributes = [
                'name' => $this->stringValue($ticketTypeData, 'name', $ticketType?->name ?? ''),
                'description' => $this->nullableStringValue($ticketTypeData, 'description', $ticketType?->description),
                'code' => mb_strtoupper(trim($this->stringValue($ticketTypeData, 'code', $ticketType?->code ?? ''))),
                'base_price' => $this->stringValue($ticketTypeData, 'base_price', (string) ($ticketType?->base_price ?? '0.00')),
                'quota_total' => (int) $this->stringValue($ticketTypeData, 'quota_total', (string) ($ticketType?->quota_total ?? 0)),
                'minimum_per_order' => (int) $this->stringValue($ticketTypeData, 'minimum_per_order', (string) ($ticketType?->minimum_per_order ?? 1)),
                'maximum_per_order' => $this->nullableIntegerValue($ticketTypeData, 'maximum_per_order', $ticketType?->maximum_per_order),
                'sales_start_at' => $this->nullableStringValue($ticketTypeData, 'sales_start_at', $ticketType?->sales_start_at?->toDateTimeString()),
                'sales_end_at' => $this->nullableStringValue($ticketTypeData, 'sales_end_at', $ticketType?->sales_end_at?->toDateTimeString()),
                'is_active' => array_key_exists('is_active', $ticketTypeData)
                    ? (bool) $ticketTypeData['is_active']
                    : ($ticketType?->is_active ?? true),
                'sort_order' => $index,
            ];

            if ($ticketType === null) {
                $ticketType = TicketType::query()->create([
                    'event_occurrence_id' => $occurrence->id,
                    ...$attributes,
                ]);
                $ticketType->locations()->sync($locationIds->mapWithKeys(fn (string $id): array => [$id => ['id' => (string) Str::uuid(), 'is_active' => true]])->all());
            } else {
                $ticketType->update($attributes);
            }

            $inventory = TicketTypeInventory::query()->firstOrNew(['ticket_type_id' => $ticketType->id]);
            $selectionQuantity = (int) $inventory->selection_quantity;
            $paymentReservedQuantity = (int) $inventory->payment_reserved_quantity;
            $soldQuantity = (int) $inventory->sold_quantity;
            $courtesyQuantity = (int) $inventory->courtesy_quantity;
            $quotaTotal = (int) $attributes['quota_total'];
            $availableQuantity = max(0, $quotaTotal - $selectionQuantity - $paymentReservedQuantity - $soldQuantity - $courtesyQuantity);

            $inventory->fill([
                'quota_total' => $quotaTotal,
                'selection_quantity' => $selectionQuantity,
                'payment_reserved_quantity' => $paymentReservedQuantity,
                'sold_quantity' => $soldQuantity,
                'courtesy_quantity' => $courtesyQuantity,
                'available_quantity' => $availableQuantity,
                'lock_version' => (int) $inventory->lock_version,
            ])->save();
        }
    }

    /**
     * @param  Collection<string, Collection<int, EventLocation>>  $locationsByParentId
     * @return Collection<int, EventLocation>
     */
    private function collectSellableLocations(EventLocation $location, Collection $locationsByParentId): Collection
    {
        $children = $locationsByParentId->get($location->id, collect());

        if ($children->isEmpty()) {
            return $location->is_selectable ? collect([$location]) : collect();
        }

        return $children->flatMap(
            fn (EventLocation $child): Collection => $this->collectSellableLocations($child, $locationsByParentId),
        );
    }

    private function buildTicketTypeName(EventLocation $location, string $templateType, int $index): string
    {
        if ($templateType === 'matrix') {
            return 'General';
        }

        $label = trim((string) ($location->label ?? ''));

        return $label !== '' ? $label : 'Entrada '.($index + 1);
    }

    /**
     * @param  array<int, string>  $usedCodes
     */
    private function buildTicketTypeCode(EventLocation $location, string $templateType, int $index, array $usedCodes): string
    {
        $base = $templateType === 'matrix'
            ? 'GENERAL'
            : (string) Str::of((string) ($location->external_key !== '' ? $location->external_key : ($location->label ?? 'entrada-'.($index + 1))))
                ->replaceMatches('/[^A-Za-z0-9]+/', '_')
                ->trim('_')
                ->upper();

        if ($base === '') {
            $base = 'TICKET_'.($index + 1);
        }

        $code = $base;
        $suffix = 2;

        while (in_array($code, $usedCodes, true)) {
            $code = $base.'_'.$suffix++;
        }

        return $code;
    }

    private function formatMoney(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function stringValue(array $data, string $key, string $default): string
    {
        if (! array_key_exists($key, $data)) {
            return $default;
        }

        return (string) $data[$key];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function nullableStringValue(array $data, string $key, ?string $default): ?string
    {
        if (! array_key_exists($key, $data)) {
            return $default;
        }

        $value = trim((string) $data[$key]);

        return $value === '' ? null : $value;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function nullableIntegerValue(array $data, string $key, ?int $default): ?int
    {
        if (! array_key_exists($key, $data)) {
            return $default;
        }

        $value = trim((string) $data[$key]);

        return $value === '' ? null : (int) $value;
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

    private function normalizeSalesEndAt(mixed $salesStartAt, mixed $salesEndAt, mixed $startsAt): CarbonImmutable
    {
        $normalizedSalesStartAt = $this->normalizeDateTime($salesStartAt, now());
        $defaultEndAt = $this->normalizeDateTime($startsAt, $normalizedSalesStartAt);
        $normalizedSalesEndAt = $this->normalizeDateTime($salesEndAt, $defaultEndAt);

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

        return $default;
    }
}
