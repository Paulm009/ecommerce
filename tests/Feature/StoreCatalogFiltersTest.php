<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('sorts the catalog alphabetically', function (string $sort, bool $descending): void {
    $this->get(route('store.index', ['sort' => $sort]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('store/index')
            ->where('filters.sort', $sort)
            ->where('products.data', function (Collection $products) use ($descending): bool {
                $names = $products->pluck('name')->all();
                $expected = $names;
                $descending ? rsort($expected, SORT_STRING | SORT_FLAG_CASE) : sort($expected, SORT_STRING | SORT_FLAG_CASE);

                return count($names) > 1 && $names === $expected;
            }),
        );
})->with([
    'A-Z' => ['name_asc', false],
    'Z-A' => ['name_desc', true],
]);

it('sorts the catalog by the lowest variant price', function (string $sort, bool $descending): void {
    $this->get(route('store.index', ['sort' => $sort]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('products.data', function (Collection $products) use ($descending): bool {
                $prices = $products
                    ->map(fn (array $product): float => (float) collect($product['variants'])->min('sale_price'))
                    ->all();
                $expected = $prices;
                $descending ? rsort($expected) : sort($expected);

                return count($prices) > 1 && $prices === $expected;
            }),
        );
})->with([
    'menor precio' => ['price_asc', false],
    'mayor precio' => ['price_desc', true],
]);

it('filters the catalog by price range', function (): void {
    $this->get(route('store.index', ['min_price' => 50, 'max_price' => 150]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.minPrice', '50')
            ->where('filters.maxPrice', '150')
            ->where('products.data', fn (Collection $products): bool => $products->every(
                fn (array $product): bool => collect($product['variants'])->contains(
                    fn (array $variant): bool => $variant['sale_price'] >= 50 && $variant['sale_price'] <= 150,
                ),
            )),
        );
});

it('ignores unknown sort values', function (): void {
    $this->get(route('store.index', ['sort' => 'drop table']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('filters.sort', ''));
});
