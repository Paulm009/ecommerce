<?php

declare(strict_types=1);

namespace App\Actions\Products;

use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateProduct
{
    /** @param array<string, mixed> $data */
    public function handle(Company $company, array $data, User $user): Product
    {
        return DB::transaction(function () use ($company, $data, $user): Product {
            $product = Product::query()->create([
                'company_id' => $company->id,
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'description' => $data['description'] ?? null,
                'product_type' => $data['product_type'],
                'status' => $data['status'],
                'is_featured' => $data['is_featured'] ?? false,
                'hide_when_out_of_stock' => $data['hide_when_out_of_stock'] ?? false,
                'published_at' => $data['status'] === 'published' ? now() : null,
                'created_by_user_id' => $user->id,
            ]);
            $categoryLinks = collect($data['category_ids'])
                ->mapWithKeys(fn (string $id, int $index): array => [$id => ['is_primary' => $index === 0]])
                ->all();
            $product->categories()->sync($categoryLinks);

            foreach ($data['variants'] as $index => $variantData) {
                $variant = ProductVariant::query()->create([
                    'product_id' => $product->id,
                    'name' => $variantData['name'] ?? null,
                    'sku' => $variantData['sku'],
                    'barcode' => $variantData['barcode'] ?? null,
                    'sale_price' => $variantData['sale_price'],
                    'purchase_cost' => $variantData['purchase_cost'],
                    'low_stock_threshold' => $variantData['low_stock_threshold'],
                    'is_default' => $index === 0,
                    'sort_order' => $index,
                ]);
                InventoryBalance::query()->create([
                    'product_variant_id' => $variant->id,
                    'on_hand_quantity' => $variantData['stock'],
                    'available_quantity' => $variantData['stock'],
                ]);
            }

            return $product;
        }, 3);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 2;

        while (Product::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
