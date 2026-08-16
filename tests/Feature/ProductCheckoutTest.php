<?php

declare(strict_types=1);

use App\Enums\ProductStatus;
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

it('registers a guest and creates the product order during checkout', function (): void {
    $variant = publishedVariant();

    $this->post(route('product-orders.store'), [
        'buyer_name' => 'Comprador Nuevo',
        'buyer_email' => 'nuevo@example.com',
        'buyer_phone' => '+591 70000123',
        'buyer_identity_document' => 'CI-123456',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'session_token' => 'checkout-test-session-token-000000000',
        'items' => [['product_variant_id' => $variant->id, 'quantity' => 1]],
    ])->assertRedirect();

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'name' => 'Comprador Nuevo',
        'email' => 'nuevo@example.com',
        'phone' => '+591 70000123',
        'user_type' => 'customer',
    ]);
    $this->assertDatabaseHas('product_orders', ['buyer_email' => 'nuevo@example.com']);
});

it('requires a password when a guest checks out', function (): void {
    $variant = publishedVariant();

    $this->post(route('product-orders.store'), [
        'buyer_name' => 'Sin Password',
        'buyer_email' => 'sinpass@example.com',
        'buyer_phone' => '+591 70000123',
        'buyer_identity_document' => 'CI-123456',
        'session_token' => 'checkout-test-session-token-000000000',
        'items' => [['product_variant_id' => $variant->id, 'quantity' => 1]],
    ])->assertSessionHasErrors('password');

    $this->assertDatabaseMissing('users', ['email' => 'sinpass@example.com']);
});

it('rejects guest checkout when the email is already registered', function (): void {
    $variant = publishedVariant();

    $this->post(route('product-orders.store'), [
        'buyer_name' => 'Correo Duplicado',
        'buyer_email' => 'cliente@example.com',
        'buyer_phone' => '+591 70000123',
        'buyer_identity_document' => 'CI-123456',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'session_token' => 'checkout-test-session-token-000000000',
        'items' => [['product_variant_id' => $variant->id, 'quantity' => 1]],
    ])->assertSessionHasErrors('buyer_email');
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
