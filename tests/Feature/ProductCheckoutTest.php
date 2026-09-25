<?php

declare(strict_types=1);

use App\Enums\ProductStatus;
use App\Models\ProductOrder;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

function publishedVariant(): ProductVariant
{
    return ProductVariant::query()
        ->whereHas('product', fn ($query) => $query->where('status', ProductStatus::Published))
        ->firstOrFail();
}

it('redirects guests to login instead of creating a product order', function (): void {
    $variant = publishedVariant();
    $ordersBefore = ProductOrder::query()->count();

    $this->post(route('product-orders.store'), [
        'buyer_name' => 'Comprador Nuevo',
        'buyer_email' => 'nuevo@example.com',
        'buyer_phone' => '+591 70000123',
        'buyer_identity_document' => 'CI-123456',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'session_token' => 'checkout-test-session-token-000000000',
        'items' => [['product_variant_id' => $variant->id, 'quantity' => 1]],
    ])->assertRedirect(route('login'));

    $this->assertGuest();
    $this->assertDatabaseMissing('users', ['email' => 'nuevo@example.com']);
    expect(ProductOrder::query()->count())->toBe($ordersBefore);
});

it('lets a logged-in user check out without a password', function (): void {
    $variant = publishedVariant();
    $user = User::query()->where('email', 'cliente@example.com')->firstOrFail();

    $this->actingAs($user)
        ->post(route('product-orders.store'), [
            'buyer_name' => $user->name,
            'buyer_email' => $user->email,
            'buyer_phone' => $user->phone,
            'buyer_identity_document' => 'CI-999',
            'session_token' => 'checkout-test-session-token-000000000',
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 1]],
        ])->assertRedirect();

    $this->assertDatabaseHas('product_orders', ['buyer_email' => 'cliente@example.com']);
});
